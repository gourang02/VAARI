const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const { success } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');

// Helper: parse "HH:mm" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const updateProfile = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.body.doctorId;
    const doctor = await Doctor.findByIdAndUpdate(
      doctorId,
      req.body,
      { new: true, runValidators: true }
    ).select('-otp');
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    return success(res, doctor, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const createSlot = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.body.doctorId;
    
    // Get doctor's avg consultation time
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    
    const avgMin = doctor.avgConsultationMin || 10;
    const { date, startTime, endTime, batchSize = 10, bufferSlots = 2 } = req.body;
    
    // Calculate max tokens from time range and avg consultation time
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      throw new ApiError(400, 'End time must be after start time');
    }
    
    const totalMinutes = endMinutes - startMinutes;
    const maxTokens = Math.floor(totalMinutes / avgMin);
    const totalBatches = Math.ceil(maxTokens / batchSize);
    
    const slot = new Slot({
      doctorId,
      date: new Date(date),
      startTime,
      endTime,
      batchSize,
      bufferSlots,
      maxTokens,
      totalBatches
    });
    
    await slot.save();
    return success(res, slot, 'Slot created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A slot already exists for this date and time'));
    }
    next(error);
  }
};

const getSlots = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
    const { date } = req.query;
    
    let query = { doctorId };
    
    if (date) {
      // If specific date requested, get slots for that date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: targetDate, $lt: nextDate };
    } else {
      // Default: get future slots
      query.date = { $gte: new Date() };
    }
    
    const slots = await Slot.find(query).sort({ date: 1, startTime: 1 });
    return success(res, slots, 'Slots retrieved');
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    if (!slot) throw new ApiError(404, 'Slot not found');
    return success(res, slot, 'Slot updated');
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const activeBookings = await Booking.countDocuments({ 
      slotId: req.params.id, 
      status: { $in: ['confirmed', 'waiting', 'active', 'in-consultation'] } 
    });
    if (activeBookings > 0) {
      throw new ApiError(400, 'Cannot delete slot with active bookings');
    }
    await Slot.findByIdAndDelete(req.params.id);
    return success(res, null, 'Slot deleted successfully');
  } catch (error) {
    next(error);
  }
};

const toggleAvailability = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();
    return success(res, { isAvailable: doctor.isAvailable }, `Availability toggled to ${doctor.isAvailable}`);
  } catch (error) {
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const doctorId = req.user.role === 'doctor' ? req.user.id : req.query.doctorId;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      doctorId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('patientId', 'name phone avatar').sort({ tokenNumber: 1 });
    
    return success(res, bookings, 'Bookings retrieved');
  } catch (error) {
    next(error);
  }
};

const purchaseSubscription = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { plan } = req.body; // 'monthly' or 'yearly'

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new ApiError(404, 'Doctor not found');

    const durationDays = plan === 'yearly' ? 365 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    doctor.subscriptionStatus = plan;
    doctor.subscriptionExpiry = expiryDate;
    await doctor.save();

    return success(res, {
      subscriptionStatus: doctor.subscriptionStatus,
      subscriptionExpiry: doctor.subscriptionExpiry
    }, `Plan upgraded to ${plan} successfully.`);
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    // Total Bookings count
    const totalBookings = await Booking.countDocuments({ doctorId });

    // Completed Bookings (served)
    const servedBookings = await Booking.countDocuments({ doctorId, status: 'served' });
    const pendingBookings = await Booking.countDocuments({ doctorId, status: 'pending' });

    // Calculate revenue
    const doctor = await Doctor.findById(doctorId);
    const consultationFee = doctor?.consultationFee || 500;
    const totalRevenue = servedBookings * consultationFee;

    return success(res, {
      totalBookings,
      servedBookings,
      pendingBookings,
      totalRevenue,
      subscriptionStatus: doctor?.subscriptionStatus || 'trial',
      subscriptionExpiry: doctor?.subscriptionExpiry || null
    }, 'Analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  createSlot,
  getSlots,
  updateSlot,
  deleteSlot,
  toggleAvailability,
  getBookings,
  purchaseSubscription,
  getAnalytics
};
