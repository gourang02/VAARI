const Joi = require('joi');

const sendOtpSchema = Joi.object({
  phone: Joi.string().required(),
  role: Joi.string().valid('patient', 'doctor', 'staff').required()
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().required(),
  role: Joi.string().valid('patient', 'doctor', 'staff').required()
});

const registerDoctorSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().required(),
  specialization: Joi.string().required(),
  registrationNumber: Joi.string().required(),
  consultationFee: Joi.number().required(),
  avgConsultationMin: Joi.number().default(10),
  experience: Joi.number().optional(),
  qualifications: Joi.array().items(Joi.string()).optional(),
  clinic: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional()
  }).optional(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  passkey: Joi.string().required()
});

const doctorProfileSchema = Joi.object({
  name: Joi.string(),
  specialization: Joi.string(),
  registrationNumber: Joi.string(),
  consultationFee: Joi.number(),
  avgConsultationMin: Joi.number(),
  experience: Joi.number(),
  photo: Joi.string(),
  qualifications: Joi.array().items(Joi.string()),
  clinic: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    lat: Joi.number(),
    lng: Joi.number()
  }),
  bankDetails: Joi.object({
    accountNumber: Joi.string().allow(''),
    ifscCode: Joi.string().allow(''),
    bankName: Joi.string().allow(''),
    upiId: Joi.string().allow('')
  }),
  qrCodeUrl: Joi.string().allow('')
});

const createSlotSchema = Joi.object({
  date: Joi.date().iso().required(),
  startTime: Joi.string().required(),
  endTime: Joi.string().required(),
  batchSize: Joi.number().default(10),
  bufferSlots: Joi.number().default(2)
});

const createBookingSchema = Joi.object({
  doctorId: Joi.string().required(),
  slotId: Joi.string().required(),
  bookingDate: Joi.date().iso().required()
});

const patientProfileSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email().allow(''),
  avatar: Joi.string(),
  languagePreference: Joi.string().valid('en', 'hi'),
  savedLocations: Joi.array().items(Joi.object({
    label: Joi.string(),
    lat: Joi.number(),
    lng: Joi.number(),
    address: Joi.string()
  }))
});

const registerPatientSchema = Joi.object({
  phone: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().allow('').optional(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  passkey: Joi.string().required()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  registerDoctorSchema,
  registerPatientSchema,
  doctorProfileSchema,
  createSlotSchema,
  createBookingSchema,
  patientProfileSchema
};
