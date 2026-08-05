const Queue = require('../models/Queue');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { notifyYouAreNext, notifySkipped, notifyBatchActive } = require('./notification.service');
const { emitQueueUpdate, emitToPatient } = require('../socket/queueSocket');

const GRACE_PERIOD_TOKENS = 3; // Skipped patient gets this many tokens before being moved further

const startQueue = async (doctorId, slotId, date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const queue = await Queue.findOneAndUpdate(
    { doctorId, slotId, date: targetDate },
    { 
      status: 'active', 
      currentToken: 0, 
      nextToken: 1, 
      currentBatch: 1,
      skippedTokens: [],
      completedTokens: [],
      lastUpdatedAt: new Date()
    },
    { new: true, upsert: true }
  );

  // Mark first batch of bookings as 'waiting'
  const slot = await Slot.findById(slotId);
  const batchSize = slot ? slot.batchSize : 10;
  
  await Booking.updateMany(
    { slotId, bookingDate: targetDate, batchNumber: 1, status: 'confirmed' },
    { status: 'waiting' }
  );

  // Notify first batch patients
  const firstBatchBookings = await Booking.find({
    slotId, bookingDate: targetDate, batchNumber: 1
  });
  for (const booking of firstBatchBookings) {
    try {
      await notifyBatchActive(booking);
    } catch (err) {
      console.error('Batch notification failed:', err.message);
    }
  }

  emitQueueUpdate(doctorId, targetDate, queue);
  return queue;
};

const nextToken = async (queueId) => {
  // Use atomic findOneAndUpdate to prevent race conditions
  const queue = await Queue.findById(queueId);
  if (!queue) throw new Error('Queue not found');
  if (queue.status !== 'active') throw new Error('Queue is not active');

  // Mark current token's booking as completed
  if (queue.currentToken > 0) {
    await Booking.findOneAndUpdate(
      { slotId: queue.slotId, tokenNumber: queue.currentToken, bookingDate: queue.date, status: 'in-consultation' },
      { status: 'completed', completedAt: new Date() }
    );
    
    if (!queue.completedTokens.includes(queue.currentToken)) {
      queue.completedTokens.push(queue.currentToken);
    }
  }

  // Check if there's a skipped token ready to be reinserted (grace expired or buffer slot available)
  let nextTokenNumber = queue.nextToken;
  const reinsertableSkip = queue.skippedTokens.find(s => 
    !s.reinserted && new Date() < new Date(s.graceDeadline)
  );
  
  if (reinsertableSkip) {
    // Reinsert skipped patient
    nextTokenNumber = reinsertableSkip.tokenNumber;
    reinsertableSkip.reinserted = true;
    reinsertableSkip.reinsertedAt = new Date();
  } else {
    // Normal: advance to next token
    queue.nextToken += 1;
  }

  queue.currentToken = nextTokenNumber;
  queue.lastUpdatedAt = new Date();

  // Check if we need to advance batch
  const slot = await Slot.findById(queue.slotId);
  const batchSize = slot ? slot.batchSize : 10;
  const newBatch = Math.ceil(nextTokenNumber / batchSize);
  
  if (newBatch > queue.currentBatch) {
    queue.currentBatch = newBatch;
    
    // Activate next batch of bookings
    await Booking.updateMany(
      { slotId: queue.slotId, bookingDate: queue.date, batchNumber: newBatch, status: 'confirmed' },
      { status: 'waiting' }
    );
    
    // Notify next batch patients
    const nextBatchBookings = await Booking.find({
      slotId: queue.slotId, bookingDate: queue.date, batchNumber: newBatch
    });
    for (const booking of nextBatchBookings) {
      try { await notifyBatchActive(booking); } catch (err) { /* non-blocking */ }
    }
  }
  
  await queue.save();

  // Mark current booking as in-consultation
  const currentBooking = await Booking.findOneAndUpdate(
    { slotId: queue.slotId, tokenNumber: queue.currentToken, bookingDate: queue.date },
    { status: 'in-consultation', checkedInAt: new Date() },
    { new: true }
  ).populate('patientId', 'name phone');

  // Notify next-in-line patient
  const upcomingToken = reinsertableSkip ? queue.nextToken : queue.nextToken;
  const nextBooking = await Booking.findOne({ 
    slotId: queue.slotId, tokenNumber: upcomingToken, bookingDate: queue.date,
    status: { $in: ['confirmed', 'waiting'] }
  });
  if (nextBooking) {
    try { await notifyYouAreNext(nextBooking); } catch (err) { /* non-blocking */ }
  }

  // Calculate avg wait time
  const completedBookings = await Booking.find({
    slotId: queue.slotId, bookingDate: queue.date, status: 'completed',
    checkedInAt: { $exists: true }, completedAt: { $exists: true }
  });
  if (completedBookings.length > 0) {
    const totalWait = completedBookings.reduce((sum, b) => {
      return sum + (new Date(b.completedAt) - new Date(b.checkedInAt)) / 60000;
    }, 0);
    queue.avgWaitMinutes = Math.round(totalWait / completedBookings.length);
    await queue.save();
  }

  emitQueueUpdate(queue.doctorId, queue.date, queue);
  
  return {
    queue,
    currentPatient: currentBooking
  };
};

const skipToken = async (queueId) => {
  const queue = await Queue.findById(queueId);
  if (!queue) throw new Error('Queue not found');
  if (queue.status !== 'active') throw new Error('Queue is not active');

  const slot = await Slot.findById(queue.slotId);
  const avgMin = 10; // Default, could come from doctor model

  const bookingToSkip = await Booking.findOne({ 
    slotId: queue.slotId, tokenNumber: queue.currentToken, bookingDate: queue.date 
  });
  
  // Add to skipped tokens with grace deadline
  const graceDeadline = new Date(Date.now() + GRACE_PERIOD_TOKENS * avgMin * 60000);
  
  queue.skippedTokens.push({
    tokenNumber: queue.currentToken,
    bookingId: bookingToSkip ? bookingToSkip._id : null,
    skippedAt: new Date(),
    graceDeadline,
    reinserted: false
  });

  if (bookingToSkip) {
    bookingToSkip.status = 'skipped';
    await bookingToSkip.save();
    try { await notifySkipped(bookingToSkip); } catch (err) { /* non-blocking */ }
  }

  // Move to next token automatically
  queue.currentToken = queue.nextToken;
  queue.nextToken += 1;
  queue.lastUpdatedAt = new Date();

  await queue.save();

  // Mark new current token as in-consultation
  const currentBooking = await Booking.findOneAndUpdate(
    { slotId: queue.slotId, tokenNumber: queue.currentToken, bookingDate: queue.date },
    { status: 'in-consultation', checkedInAt: new Date() },
    { new: true }
  ).populate('patientId', 'name phone');

  // Notify next-in-line
  const nextBooking = await Booking.findOne({ 
    slotId: queue.slotId, tokenNumber: queue.nextToken, bookingDate: queue.date,
    status: { $in: ['confirmed', 'waiting'] }
  });
  if (nextBooking) {
    try { await notifyYouAreNext(nextBooking); } catch (err) { /* non-blocking */ }
  }

  emitQueueUpdate(queue.doctorId, queue.date, queue);
  
  return {
    queue,
    currentPatient: currentBooking
  };
};

const pauseQueue = async (queueId) => {
  const queue = await Queue.findByIdAndUpdate(
    queueId, 
    { status: 'paused', lastUpdatedAt: new Date() }, 
    { new: true }
  );
  if (queue) emitQueueUpdate(queue.doctorId, queue.date, queue);
  return queue;
};

const resumeQueue = async (queueId) => {
  const queue = await Queue.findByIdAndUpdate(
    queueId, 
    { status: 'active', lastUpdatedAt: new Date() }, 
    { new: true }
  );
  if (queue) emitQueueUpdate(queue.doctorId, queue.date, queue);
  return queue;
};

const getQueueState = async (doctorId, date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const queue = await Queue.findOne({ doctorId, date: targetDate }).populate('slotId');
  
  if (!queue) return null;

  // Get waiting list (bookings in current/active batches that are still waiting)
  const waitingBookings = await Booking.find({
    slotId: queue.slotId,
    bookingDate: targetDate,
    status: { $in: ['waiting', 'confirmed'] },
    tokenNumber: { $gt: queue.currentToken }
  }).populate('patientId', 'name phone avatar').sort({ tokenNumber: 1 }).limit(20);

  // Get current patient info
  const currentPatient = queue.currentToken > 0 ? await Booking.findOne({
    slotId: queue.slotId,
    bookingDate: targetDate,
    tokenNumber: queue.currentToken
  }).populate('patientId', 'name phone avatar') : null;

  return {
    ...queue.toObject(),
    waitingList: waitingBookings.map(b => ({
      id: b._id,
      tokenNumber: b.tokenNumber,
      patientName: b.patientId?.name || `Patient ${b.tokenNumber}`,
      patientPhone: b.patientId?.phone,
      status: b.status,
      batchNumber: b.batchNumber
    })),
    currentPatient: currentPatient ? {
      name: currentPatient.patientId?.name,
      phone: currentPatient.patientId?.phone,
      tokenNumber: currentPatient.tokenNumber
    } : null,
    completedCount: queue.completedTokens.length,
    skippedCount: queue.skippedTokens.filter(s => !s.reinserted).length,
    avgWaitTime: queue.avgWaitMinutes
  };
};

const getPatientPosition = async (doctorId, bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  const targetDate = new Date(booking.bookingDate);
  targetDate.setHours(0, 0, 0, 0);

  const queue = await Queue.findOne({ doctorId, date: targetDate, slotId: booking.slotId });
  
  if (!queue) {
    return {
      position: booking.tokenNumber,
      estimatedWaitMin: null,
      queueStatus: 'not_started',
      currentToken: 0,
      myToken: booking.tokenNumber,
      batchNumber: booking.batchNumber,
      isBatchActive: false
    };
  }

  const position = booking.tokenNumber - queue.currentToken;
  const avgConsultMin = queue.avgWaitMinutes || 10;
  const estimatedWaitMin = Math.max(0, position * avgConsultMin);
  const isBatchActive = booking.batchNumber <= queue.currentBatch;

  return {
    position: Math.max(0, position),
    estimatedWaitMin,
    queueStatus: queue.status,
    currentToken: queue.currentToken,
    myToken: booking.tokenNumber,
    batchNumber: booking.batchNumber,
    currentBatch: queue.currentBatch,
    isBatchActive,
    bookingStatus: booking.status,
    completedCount: queue.completedTokens.length,
    totalInQueue: queue.nextToken - 1
  };
};

module.exports = {
  startQueue,
  nextToken,
  skipToken,
  pauseQueue,
  resumeQueue,
  getQueueState,
  getPatientPosition
};
