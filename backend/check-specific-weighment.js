const mongoose = require('mongoose');
require('dotenv').config();
const Weighment = require('./models/Weighment');

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const w = await Weighment.findById('6a3eb6346bf84ec28f5d3daf');
    if (!w) {
      console.log('Weighment not found!');
    } else {
      console.log('Weighment details:', {
        id: w._id,
        ticketNo: w.ticketNo,
        vehicleNumber: w.vehicleNumber,
        status: w.status,
        grossWeight: w.grossWeight,
        tareWeight: w.tareWeight,
        netWeight: w.netWeight,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
