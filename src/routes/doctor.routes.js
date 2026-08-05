const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { doctorProfileSchema, createSlotSchema } = require('../utils/validators');

router.use(authenticate, authorize('doctor', 'staff'));

router.put('/profile', validate(doctorProfileSchema), doctorController.updateProfile);
router.post('/slots', validate(createSlotSchema), doctorController.createSlot);
router.get('/slots', doctorController.getSlots);
router.patch('/slots/:id', doctorController.updateSlot);
router.delete('/slots/:id', doctorController.deleteSlot);
router.patch('/availability', doctorController.toggleAvailability);
router.get('/bookings', doctorController.getBookings);
router.post('/subscription', doctorController.purchaseSubscription);
router.get('/analytics', doctorController.getAnalytics);

module.exports = router;
