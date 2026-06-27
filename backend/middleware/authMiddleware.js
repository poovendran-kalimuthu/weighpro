const SmsSettings = require('../models/SmsSettings');

exports.deviceAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized: Missing API Key' });
    }

    const settings = await SmsSettings.findOne() || await SmsSettings.create({});
    if (apiKey !== settings.mobileApiKey) {
      return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authentication Error' });
  }
};
