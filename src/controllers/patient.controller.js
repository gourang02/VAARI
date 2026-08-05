const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { success, created } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const { notifyBookingConfirmed } = require('../services/notification.service');

const searchClinics = async (req, res, next) => {
  try {
    const { city, specialization, q } = req.query;
    let query = { 
      isAvailable: true, 
      verificationStatus: 'approved',
      subscriptionStatus: { $ne: 'expired' }
    };
    
    if (city) query['clinic.city'] = new RegExp(city, 'i');
    if (specialization) query.specialization = new RegExp(specialization, 'i');
    if (q) {
      query.$or = [
        { name: new RegExp(q, 'i') },
        { specialization: new RegExp(q, 'i') },
        { 'clinic.name': new RegExp(q, 'i') },
        { qualifications: new RegExp(q, 'i') }
      ];
    }

    const doctors = await Doctor.find(query).select('-otp -verificationDocs');
    return success(res, doctors, 'Clinics retrieved');
  } catch (error) {
    next(error);
  }
};

const getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).select('-otp -verificationDocs');
    if (!doctor) throw new ApiError(404, 'Doctor not found');

    // Get future active slots with availability info
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const slots = await Slot.find({ 
      doctorId: req.params.doctorId, 
      date: { $gte: today },
      isActive: true 
    }).sort({ date: 1, startTime: 1 });

    // Attach available count for each slot
    const slotsWithAvailability = slots.map(slot => ({
      ...slot.toObject(),
      availableTokens: (slot.maxTokens || 50) - (slot.bookedCount || 0)
    }));

    return success(res, { doctor, slots: slotsWithAvailability }, 'Doctor profile retrieved');
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { doctorId, slotId, bookingDate } = req.body;
    
    // Atomic increment to prevent race conditions
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, doctorId, isActive: true, $expr: { $lt: ["$bookedCount", "$maxTokens"] } },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!slot) {
      throw new ApiError(400, 'Slot is full or unavailable');
    }

    // Calculate batch number based on token position
    const tokenNumber = slot.bookedCount;
    const batchNumber = Math.ceil(tokenNumber / (slot.batchSize || 10));

    const booking = new Booking({
      patientId: req.user.id,
      doctorId,
      slotId,
      bookingDate: new Date(bookingDate),
      tokenNumber,
      batchNumber,
      status: 'confirmed'
    });

    await booking.save();

    // Send booking confirmation notification
    try {
      await notifyBookingConfirmed(booking);
    } catch (notifError) {
      console.error('Notification failed (non-blocking):', notifError.message);
    }

    // Return enriched response
    const doctor = await Doctor.findById(doctorId).select('name specialization clinic consultationFee');
    
    return created(res, {
      booking,
      doctor,
      slot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      }
    }, 'Booking created successfully');
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { patientId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization clinic photo consultationFee avgConsultationMin rating')
      .populate('slotId', 'date startTime endTime batchSize')
      .sort({ bookingDate: -1 });
    return success(res, bookings, 'My bookings retrieved');
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!booking) throw new ApiError(404, 'Booking not found');
    
    if (['completed', 'cancelled', 'in-consultation'].includes(booking.status)) {
      throw new ApiError(400, `Cannot cancel booking with status: ${booking.status}`);
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by patient';
    await booking.save();

    // Decrement slot booked count
    await Slot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -1 } });
    
    return success(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-otp');
    if (!user) throw new ApiError(404, 'User not found');
    return success(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchClinics,
  getDoctorProfile,
  createBooking,
  getMyBookings,
  cancelBooking,
  updateProfile
};
