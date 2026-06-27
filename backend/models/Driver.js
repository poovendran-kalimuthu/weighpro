const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  licenseNo: { type: String, trim: true, uppercase: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Driver', DriverSchema);
