const SmsQueue = require('../models/SmsQueue');

// GET /api/sms/pending
// Called by the Android App to fetch SMS to send
exports.getPendingSms = async (req, res) => {
  try {
    // Only get pending or failed with retries left (< 3)
    const pendingSms = await SmsQueue.find({
      $or: [
        { status: 'PENDING' },
        { status: 'FAILED', retryCount: { $lt: 3 } }
      ]
    }).sort({ createdAt: 1 }).limit(20); // Batch of 20
    
    res.json(pendingSms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/sms/update-status
// Called by the Android App after attempting to send
exports.updateSmsStatus = async (req, res) => {
  try {
    const { id, status, failureReason, deviceId } = req.body;
    
    const sms = await SmsQueue.findById(id);
    if (!sms) return res.status(404).json({ message: 'SMS record not found' });

    sms.status = status;
    sms.deviceId = deviceId || sms.deviceId;
    
    if (status === 'SENT') {
      sms.sentAt = new Date();
    } else if (status === 'FAILED') {
      sms.failureReason = failureReason;
      sms.retryCount += 1;
    }

    await sms.save();
    res.json(sms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/sms/history
// Called by the ERP frontend to view SMS logs
exports.getSmsHistory = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const history = await SmsQueue.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/sms/dashboard
// Called by the ERP frontend to populate SMS Dashboard
exports.getSmsDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, sentToday, failedToday] = await Promise.all([
      SmsQueue.countDocuments({ status: 'PENDING' }),
      SmsQueue.countDocuments({ status: 'SENT', sentAt: { $gte: today } }),
      SmsQueue.countDocuments({ status: 'FAILED', updatedAt: { $gte: today } }),
    ]);

    res.json({
      pending,
      sentToday,
      failedToday,
      lastSyncTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/sms/retry/:id
// Manual retry from ERP
exports.retrySms = async (req, res) => {
  try {
    const sms = await SmsQueue.findById(req.params.id);
    if (!sms) return res.status(404).json({ message: 'SMS not found' });
    
    if (req.body.mobileNumber) {
      sms.mobileNumber = req.body.mobileNumber;
    }
    
    const SmsSettings = require('../models/SmsSettings');
    const settings = await SmsSettings.findOne();
    
    if (settings && settings.smsProvider === 'twilio') {
      sms.status = 'PROCESSING';
      sms.failureReason = null;
      await sms.save();
      
      try {
        const { twilioSid, twilioAuthToken, twilioPhoneNumber } = settings;
        if (!twilioSid || !twilioAuthToken || !twilioPhoneNumber) {
          throw new Error('Twilio settings incomplete.');
        }
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', sms.mobileNumber);
        params.append('From', twilioPhoneNumber);
        params.append('Body', sms.message);
        
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
        sms.status = 'SENT';
        sms.sentAt = new Date();
        await sms.save();
      } catch (err) {
        sms.status = 'FAILED';
        sms.failureReason = err.message;
        sms.retryCount += 1;
        await sms.save();
        return res.status(400).json({ message: `Twilio manual retry failed: ${err.message}`, sms });
      }
    } else {
      sms.status = 'PENDING';
      sms.failureReason = null;
      await sms.save();
    }
    
    res.json(sms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
