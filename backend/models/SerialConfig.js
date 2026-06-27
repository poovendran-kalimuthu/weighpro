const mongoose = require('mongoose');

const SerialConfigSchema = new mongoose.Schema({
  comPort: { type: String, default: 'COM3' },
  baudRate: { type: Number, default: 2400 },
  dataBits: { type: Number, default: 8 },
  parity: { type: String, enum: ['none', 'even', 'odd', 'mark', 'space'], default: 'none' },
  stopBits: { type: Number, default: 1 },
  flowControl: { type: String, enum: ['none', 'rtscts', 'xonxoff'], default: 'none' },
  readMode: { type: String, enum: ['continuous', 'demand'], default: 'continuous' },
}, { timestamps: true });

module.exports = mongoose.model('SerialConfig', SerialConfigSchema);
