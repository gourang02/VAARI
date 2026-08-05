const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { sendOtpSchema, verifyOtpSchema, registerDoctorSchema, registerPatientSchema } = require('../utils/validators');

router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/register-doctor', validate(registerDoctorSchema), authController.registerDoctor);
router.post('/register-patient', validate(registerPatientSchema), authController.registerPatient);
router.post('/login', authController.loginWithPassword);
router.post('/reset-password-passkey', authController.resetPasswordPasskey);
router.post('/send-reset-otp', authController.sendResetOtp);
router.post('/reset-password-otp', authController.resetPasswordOtp);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
