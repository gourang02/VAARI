const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  passkey: { type: String },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  photo: { type: String },
  specialization: { type: String, required: true },
  qualifications: [{ type: String }],
  registrationNumber: { type: String, required: true },
  experience: { type: Number },
  consultationFee: { type: Number, required: true },
  avgConsultationMin: { type: Number, default: 10 },
  clinic: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  verificationStatus: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  verificationDocs: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  fcmToken: { type: String },
  role: { type: String, default: 'doctor' },
  subscriptionStatus: { type: String, default: 'trial' },
  subscriptionExpiry: { type: Date },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  qrCodeUrl: { type: String, default: '' },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

doctorSchema.index({ specialization: 1, verificationStatus: 1 });
doctorSchema.index({ 'clinic.city': 1 });

// Assign fallback username before validation
doctorSchema.pre('validate', function(next) {
  if (!this.username && this.phone) {
    this.username = this.phone;
  }
  next();
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
