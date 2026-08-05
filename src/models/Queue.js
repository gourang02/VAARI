const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  currentToken: { type: Number, default: 0 },
  nextToken: { type: Number, default: 1 },
  currentBatch: { type: Number, default: 1 },
  status: { type: String, default: 'idle', enum: ['idle', 'active', 'paused', 'completed'] },
  skippedTokens: [{
    tokenNumber: Number,
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    skippedAt: Date,
    graceDeadline: Date,
    reinserted: { type: Boolean, default: false },
    reinsertedAt: Date
  }],
  completedTokens: [{ type: Number }],
  avgWaitMinutes: { type: Number, default: 0 },
  lastUpdatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

queueSchema.index({ doctorId: 1, date: 1, slotId: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
