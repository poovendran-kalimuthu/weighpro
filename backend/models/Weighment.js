const mongoose = require('mongoose');

const WeighmentSchema = new mongoose.Schema({
  ticketNo: { type: String, unique: true },
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName: { type: String }, // denormalized for quick display
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  materialName: { type: String },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driverName: { type: String },
  grossWeight: { type: Number, default: 0 }, // kg
  tareWeight: { type: Number, default: 0 },  // kg
  netWeight: { type: Number, default: 0 },   // kg
  firstWeightTime: { type: Date },
  secondWeightTime: { type: Date },
  remarks: { type: String },
  status: {
    type: String,
    enum: ['First Weight', 'Completed', 'Cancelled'],
    default: 'First Weight',
  },
}, { timestamps: true });

// Auto-generate ticket number before save
WeighmentSchema.pre('save', async function () {
  if (!this.ticketNo) {
    const count = await mongoose.model('Weighment').countDocuments();
    this.ticketNo = `WB-${String(count + 1001).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('Weighment', WeighmentSchema);
