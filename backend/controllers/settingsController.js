const SmsSettings = require('../models/SmsSettings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await SmsSettings.findOne();
    if (!settings) {
      settings = await SmsSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await SmsSettings.findOne();
    if (!settings) {
      settings = new SmsSettings();
    }
    
    Object.assign(settings, req.body);
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
