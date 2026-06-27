const mongoose = require('mongoose');

const SmsQueueSchema = new mongoose.Schema({
  ticketNo: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  customerName: { type: String },
  mobileNumber: { type: String, required: true },
  grossWeight: { type: Number },
  tareWeight: { type: Number },
  netWeight: { type: Number },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  retryCount: { type: Number, default: 0 },
  sentAt: { type: Date },
  failureReason: { type: String },
  deviceId: { type: String }, // To track which device processed it
}, { timestamps: true });

module.exports = mongoose.model('SmsQueue', SmsQueueSchema);
