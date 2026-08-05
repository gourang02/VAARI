const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  permissions: {
    manageQueue: { type: Boolean, default: true },
    manageSlots: { type: Boolean, default: false },
    viewBookings: { type: Boolean, default: true },
    manageBilling: { type: Boolean, default: false }
  },
  role: { type: String, default: 'staff' },
  isActive: { type: Boolean, default: true },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
