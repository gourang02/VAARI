const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  plan: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  paymentHistory: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    date: Date,
    amount: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
