const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  passkey: { type: String },
  phone: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  avatar: { type: String },
  savedLocations: [{
    label: String,
    lat: Number,
    lng: Number,
    address: String
  }],
  languagePreference: { type: String, default: 'en', enum: ['en', 'hi'] },
  fcmToken: { type: String },
  role: { type: String, default: 'patient' },
  isActive: { type: Boolean, default: true },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

// Assign fallback username before validation
userSchema.pre('validate', function(next) {
  if (!this.username && this.phone) {
    this.username = this.phone;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
