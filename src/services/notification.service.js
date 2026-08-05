const NotificationLog = require('../models/NotificationLog');
const User = require('../models/User');
const Booking = require('../models/Booking');
const env = require('../config/env');

// Core notification sender
const sendNotification = async (recipientId, recipientType, channel, type, content, metadata = {}) => {
  try {
    console.log(`[NOTIFICATION] To ${recipientId} (${recipientType}) via ${channel}: ${content}`);
    
    // In production, integrate real SMS/WhatsApp/Push here
    if (!env.MOCK_OTP && channel === 'sms') {
      // Twilio SMS integration placeholder
      // const twilioClient = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      // await twilioClient.messages.create({ body: content, from: env.TWILIO_PHONE_NUMBER, to: metadata.phone });
      console.log(`[TWILIO] Would send SMS to ${metadata.phone}: ${content}`);
    }
    
    await NotificationLog.create({
      recipientId,
      recipientType,
      channel,
      type,
      content,
      status: 'sent',
      metadata
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    // Log failed notification
    try {
      await NotificationLog.create({
        recipientId, recipientType, channel, type, content,
        status: 'failed',
        metadata: { ...metadata, error: error.message }
      });
    } catch (logErr) {
      console.error('Failed to log notification error:', logErr);
    }
  }
};

// Get patient phone from booking
const getPatientPhone = async (booking) => {
  try {
    const populated = booking.patientId?.phone 
      ? booking 
      : await Booking.findById(booking._id).populate('patientId', 'phone name');
    return populated?.patientId?.phone || null;
  } catch {
    return null;
  }
};

const notifyBookingConfirmed = async (booking) => {
  const phone = await getPatientPhone(booking);
  await sendNotification(
    booking.patientId._id || booking.patientId,
    'patient',
    'sms',
    'booking_confirmed',
    `✅ Booking confirmed! Your token number is ${booking.tokenNumber} (Batch ${booking.batchNumber}). You'll be notified when your batch goes live.`,
    { bookingId: booking._id, phone }
  );
};

const notifyYouAreNext = async (booking) => {
  const phone = await getPatientPhone(booking);
  await sendNotification(
    booking.patientId._id || booking.patientId,
    'patient',
    'sms',
    'you_are_next',
    `🔔 You're next! Token #${booking.tokenNumber} — please proceed to the doctor's room.`,
    { bookingId: booking._id, phone }
  );
};

const notifySkipped = async (booking) => {
  const phone = await getPatientPhone(booking);
  await sendNotification(
    booking.patientId._id || booking.patientId,
    'patient',
    'sms',
    'skipped',
    `⏭ Token #${booking.tokenNumber} was skipped. Don't worry — you'll be re-inserted into the next available slot. Please stay nearby.`,
    { bookingId: booking._id, phone }
  );
};

const notifyBatchActive = async (booking) => {
  const phone = await getPatientPhone(booking);
  await sendNotification(
    booking.patientId._id || booking.patientId,
    'patient',
    'sms',
    'batch_active',
    `🏥 Your batch is now active! Token #${booking.tokenNumber} — please head to the clinic. We'll notify you when you're next.`,
    { bookingId: booking._id, phone }
  );
};

const notifyCancelled = async (booking) => {
  const phone = await getPatientPhone(booking);
  await sendNotification(
    booking.patientId._id || booking.patientId,
    'patient',
    'sms',
    'cancelled',
    `❌ Your booking (Token #${booking.tokenNumber}) has been cancelled.`,
    { bookingId: booking._id, phone }
  );
};

module.exports = {
  sendNotification,
  notifyBookingConfirmed,
  notifyYouAreNext,
  notifySkipped,
  notifyBatchActive,
  notifyCancelled
};
