const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType: { type: String, enum: ['patient', 'doctor', 'staff'] },
  channel: { type: String, enum: ['push', 'sms', 'whatsapp'] },
  type: { type: String, enum: ['booking_confirmed', 'batch_active', 'you_are_next', 'skipped', 'leave_now', 'cancelled'] },
  content: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'failed'] },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
