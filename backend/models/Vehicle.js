const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true, trim: true, uppercase: true },
  type: { type: String, trim: true },
  emptyWeight: { type: Number, default: 0 }, // Tare weight in kg
  ownerName: { type: String, trim: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  status: { type: String, enum: ['Inside', 'Outside'], default: 'Outside' },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
