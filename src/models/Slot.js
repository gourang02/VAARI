const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  batchSize: { type: Number, default: 10 },
  bufferSlots: { type: Number, default: 2 },
  totalBatches: { type: Number, default: 1 },
  maxTokens: { type: Number },
  bookedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

slotSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
