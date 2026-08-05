const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  amount: { type: Number, required: true },
  processingFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  status: { type: String, default: 'pending', enum: ['pending', 'completed', 'failed', 'refunded'] }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
