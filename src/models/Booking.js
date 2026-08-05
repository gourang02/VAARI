const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  tokenNumber: { type: Number, required: true },
  batchNumber: { type: Number, default: 1 },
  status: { type: String, default: 'confirmed', enum: ['confirmed', 'waiting', 'active', 'in-consultation', 'completed', 'skipped', 'cancelled', 'no-show'] },
  bookingDate: { type: Date, required: true },
  paymentStatus: { type: String, default: 'free', enum: ['pending', 'paid', 'refunded', 'free'] },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  cancellationReason: { type: String },
  checkedInAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

bookingSchema.index({ doctorId: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
