const mongoose = require('mongoose');

const SmsSettingsSchema = new mongoose.Schema({
  isSmsEnabled: { type: Boolean, default: true },
  autoSend: { type: Boolean, default: true },
  smsProvider: { type: String, default: 'android' }, // 'android' or 'twilio'
  twilioSid: { type: String, default: '' },
  twilioAuthToken: { type: String, default: '' },
  twilioPhoneNumber: { type: String, default: '' },
  maxRetryCount: { type: Number, default: 3 },
  retryIntervalMins: { type: Number, default: 5 },
  defaultCountryCode: { type: String, default: '+91' },
  messageTemplate: { 
    type: String, 
    default: 'Vehicle : {vehicleNo}\nGross : {grossWeight} Kg\nTare : {tareWeight} Kg\nNet : {netWeight} Kg\nTicket : {ticketNo}'
  },
  mobileApiKey: { type: String, default: 'antigravity-mobile-secret-123' }, // For Device Auth
}, { timestamps: true });

module.exports = mongoose.model('SmsSettings', SmsSettingsSchema);
