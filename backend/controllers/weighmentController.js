const { Weighment, Customer, Vehicle, Material, Driver } = require('../models');

// GET /api/weighments
exports.getAllWeighments = async (req, res) => {
  try {
    const { status, search, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { ticketNo: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    const weighments = await Weighment.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(weighments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/weighments/stats
exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, activeVehicles, totalCustomers, completedToday] = await Promise.all([
      Weighment.countDocuments({ createdAt: { $gte: today } }),
      Vehicle.countDocuments({ status: 'Inside' }),
      Customer.countDocuments({ status: 'Active' }),
      Weighment.find({ status: 'Completed', createdAt: { $gte: today } }),
    ]);

    const totalNetToday = completedToday.reduce((sum, w) => sum + (w.netWeight || 0), 0);

    res.json({
      todayWeighments: todayCount,
      activeVehicles,
      totalCustomers,
      totalNetTodayTons: (totalNetToday / 1000).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/weighments/:id
exports.getWeighmentById = async (req, res) => {
  try {
    const weighment = await Weighment.findById(req.params.id);
    if (!weighment) return res.status(404).json({ message: 'Weighment not found' });
    res.json(weighment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/weighments - Create first weight entry
exports.createWeighment = async (req, res) => {
  try {
    const { customerId, materialId, driverId, vehicleNumber, grossWeight, remarks } = req.body;

    // Get denormalized names
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let materialName = '';
    if (materialId) {
      const material = await Material.findById(materialId);
      materialName = material ? material.name : '';
    }

    let driverName = '';
    if (driverId) {
      const driver = await Driver.findById(driverId);
      driverName = driver ? driver.name : '';
    }

    // Update vehicle status to Inside
    if (vehicleNumber) {
      await Vehicle.findOneAndUpdate({ number: vehicleNumber.toUpperCase() }, { status: 'Inside' });
    }

    const weighment = new Weighment({
      vehicleNumber: vehicleNumber?.toUpperCase(),
      customerId,
      customerName: customer.name,
      materialId,
      materialName,
      driverId,
      driverName,
      grossWeight: parseFloat(grossWeight) || 0,
      firstWeightTime: new Date(),
      remarks,
      status: 'First Weight',
    });

    await weighment.save();
    res.status(201).json(weighment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/weighments/:id/second-weight - Record second weight and complete
exports.recordSecondWeight = async (req, res) => {
  try {
    const { tareWeight } = req.body;
    const weighment = await Weighment.findById(req.params.id);
    if (!weighment) return res.status(404).json({ message: 'Weighment not found' });
    if (weighment.status !== 'First Weight') {
      return res.status(400).json({ message: 'Weighment is not in First Weight status' });
    }

    weighment.tareWeight = parseFloat(tareWeight) || 0;
    weighment.netWeight = Math.abs(weighment.grossWeight - weighment.tareWeight);
    weighment.secondWeightTime = new Date();
    weighment.status = 'Completed';

    // Update vehicle status back to Outside
    if (weighment.vehicleNumber) {
      await Vehicle.findOneAndUpdate({ number: weighment.vehicleNumber }, { status: 'Outside' });
    }

    await weighment.save();

    // PHASE 3: Generate SMS using Settings
    const SmsSettings = require('../models/SmsSettings');
    const settings = await SmsSettings.findOne() || await SmsSettings.create({});
    
    if (settings.isSmsEnabled && settings.autoSend) {
      const customer = await Customer.findById(weighment.customerId);
      if (customer && customer.phone) {
        const SmsQueue = require('../models/SmsQueue');
        
        let msg = settings.messageTemplate;
        msg = msg.replace(/{vehicleNo}/g, weighment.vehicleNumber || '');
        msg = msg.replace(/{grossWeight}/g, weighment.grossWeight || 0);
        msg = msg.replace(/{tareWeight}/g, weighment.tareWeight || 0);
        msg = msg.replace(/{netWeight}/g, weighment.netWeight || 0);
        msg = msg.replace(/{ticketNo}/g, weighment.ticketNo || '');
        
        // Ensure proper format based on settings.defaultCountryCode
        let mobile = customer.phone;
        if (!mobile.startsWith('+') && settings.defaultCountryCode) {
          mobile = `${settings.defaultCountryCode}${mobile}`;
        }
        
        const smsRecord = await SmsQueue.create({
          ticketNo: weighment.ticketNo,
          vehicleNo: weighment.vehicleNumber,
          customerName: weighment.customerName,
          mobileNumber: mobile,
          grossWeight: weighment.grossWeight,
          tareWeight: weighment.tareWeight,
          netWeight: weighment.netWeight,
          message: msg,
          status: settings.smsProvider === 'twilio' ? 'PROCESSING' : 'PENDING'
        });

        if (settings.smsProvider === 'twilio') {
          // Send via Twilio immediately in a background promise
          (async () => {
            try {
              const twilioSid = settings.twilioSid;
              const twilioAuthToken = settings.twilioAuthToken;
              const twilioPhoneNumber = settings.twilioPhoneNumber;
              if (!twilioSid || !twilioAuthToken || !twilioPhoneNumber) {
                throw new Error('Twilio settings incomplete.');
              }
              const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
              const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
              const params = new URLSearchParams();
              params.append('To', mobile);
              params.append('From', twilioPhoneNumber);
              params.append('Body', msg);
              
              const resTwilio = await fetch(url, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${auth}`,
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              });
              const resData = await resTwilio.json();
              if (!resTwilio.ok) {
                throw new Error(resData.message || `HTTP ${resTwilio.status}`);
              }
              smsRecord.status = 'SENT';
              smsRecord.sentAt = new Date();
              await smsRecord.save();
            } catch (err) {
              smsRecord.status = 'FAILED';
              smsRecord.failureReason = err.message;
              smsRecord.retryCount += 1;
              await smsRecord.save();
            }
          })();
        }
      }
    }

    res.json(weighment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/weighments/:id - General update
exports.updateWeighment = async (req, res) => {
  try {
    const weighment = await Weighment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!weighment) return res.status(404).json({ message: 'Weighment not found' });
    res.json(weighment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/weighments/:id
exports.deleteWeighment = async (req, res) => {
  try {
    const weighment = await Weighment.findByIdAndDelete(req.params.id);
    if (!weighment) return res.status(404).json({ message: 'Weighment not found' });
    res.json({ message: 'Weighment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
