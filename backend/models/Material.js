const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, trim: true },
  rate: { type: Number, default: 0 }, // Standard rate per unit
  unit: { type: String, default: 'Ton', trim: true }, // e.g., Ton, Bag, kg
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Material', MaterialSchema);
