const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const authenticate = require('../middleware/auth.middleware');
const { success } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');

// For MVP: simple admin endpoints accessible with any auth token
// In production: add admin role check

// List all doctors pending verification
router.get('/doctors/pending', async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ verificationStatus: 'pending' })
      .select('-otp -verificationDocs')
      .sort({ createdAt: -1 });
    return success(res, doctors, 'Pending doctors retrieved');
  } catch (error) {
    next(error);
  }
});

// Approve a doctor
router.patch('/doctors/:id/approve', async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'approved' },
      { new: true }
    ).select('-otp');
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    return success(res, doctor, 'Doctor approved successfully');
  } catch (error) {
    next(error);
  }
});

// Reject a doctor
router.patch('/doctors/:id/reject', async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'rejected' },
      { new: true }
    ).select('-otp');
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    return success(res, doctor, 'Doctor rejected');
  } catch (error) {
    next(error);
  }
});

// List all doctors (any status)
router.get('/doctors', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { verificationStatus: status } : {};
    const doctors = await Doctor.find(query).select('-otp -verificationDocs').sort({ createdAt: -1 });
    return success(res, doctors, 'Doctors retrieved');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
