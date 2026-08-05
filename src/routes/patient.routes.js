const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createBookingSchema, patientProfileSchema } = require('../utils/validators');

// Public routes
router.get('/clinics/search', patientController.searchClinics);
router.get('/clinics/:doctorId', patientController.getDoctorProfile);

// Protected routes
router.use(authenticate, authorize('patient'));
router.put('/profile', validate(patientProfileSchema), patientController.updateProfile);
router.post('/bookings', validate(createBookingSchema), patientController.createBooking);
router.get('/bookings/my', patientController.getMyBookings);
router.patch('/bookings/:id/cancel', patientController.cancelBooking);

module.exports = router;
