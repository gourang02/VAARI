require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/clinic-app',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  OTP_EXPIRY_MIN: parseInt(process.env.OTP_EXPIRY_MIN, 10) || 5,
  MOCK_OTP: process.env.MOCK_OTP === 'true',
  MOCK_OTP_CODE: process.env.MOCK_OTP_CODE || '123456',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'your-twilio-sid',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'your-twilio-token',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
