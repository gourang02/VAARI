const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

// Public routes for patients to view live queue
router.get('/:doctorId/live', queueController.getLiveQueue);
router.get('/:doctorId/position/:bookingId', queueController.getPatientPosition);

// Protected routes for doctor/staff to control queue
router.use(authenticate, authorize('doctor', 'staff'));
router.post('/start', queueController.startQueue);
router.post('/next', queueController.nextPatient);
router.post('/skip', queueController.skipPatient);
router.post('/pause', queueController.pauseQueue);
router.post('/resume', queueController.resumeQueue);

module.exports = router;
