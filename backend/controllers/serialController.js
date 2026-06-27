const serialService = require('../services/serialService');
const SerialConfig = require('../models/SerialConfig');

// GET /api/serial/ports
exports.getPorts = async (req, res) => {
  try {
    const ports = await serialService.listPorts();
    res.json(ports);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list COM ports', error: error.message });
  }
};

// POST /api/serial/connect
exports.connectPort = async (req, res) => {
  try {
    let config = req.body;
    
    // If no config passed, load from DB
    if (!config || !config.comPort) {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        config = {
          comPort: 'DUMMY',
          baudRate: 2400,
          dataBits: 8,
          parity: 'none',
          stopBits: 1,
          flowControl: 'none',
          readMode: 'continuous'
        };
      } else {
        config = await SerialConfig.findOne();
        if (!config) {
          return res.status(404).json({ message: 'No stored configuration found. Please provide configuration details.' });
        }
      }
    }

    await serialService.connect(config);
    res.json({ message: `Successfully connected to port ${config.comPort}`, status: serialService.getStatus() });
  } catch (error) {
    res.status(400).json({ message: 'Failed to open serial port', error: error.message });
  }
};

// POST /api/serial/disconnect
exports.disconnectPort = async (req, res) => {
  try {
    await serialService.disconnect();
    res.json({ message: 'Successfully disconnected from serial port', status: serialService.getStatus() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to close serial port', error: error.message });
  }
};

// POST /api/serial/test
exports.testPort = async (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.comPort) {
      return res.status(400).json({ message: 'COM Port path is required for testing.' });
    }
    
    await serialService.testConnection(config);
    res.json({ message: `Connection test successful on ${config.comPort}` });
  } catch (error) {
    res.status(400).json({ message: `Connection test failed on ${req.body.comPort}`, error: error.message });
  }
};

// GET /api/serial/status
exports.getStatus = (req, res) => {
  res.json(serialService.getStatus());
};

// GET /api/serial/current-weight
exports.getCurrentWeight = (req, res) => {
  res.json(serialService.getCurrentWeight());
};

// GET /api/serial/logs
exports.getLogs = (req, res) => {
  res.json(serialService.getLogs());
};

// GET /api/serial/configuration
exports.getConfiguration = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        comPort: 'DUMMY',
        baudRate: 2400,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'none',
        readMode: 'continuous',
        _isOfflineFallback: true
      });
    }
    let config = await SerialConfig.findOne();
    if (!config) {
      // Create default configuration on first load
      config = await SerialConfig.create({
        comPort: 'COM3',
        baudRate: 2400,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: 'none',
        readMode: 'continuous'
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve configuration', error: error.message });
  }
};

// PUT /api/serial/configuration
exports.updateConfiguration = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.json({ message: 'Configuration simulated successfully (Offline Mode)', config: req.body });
    }
    let config = await SerialConfig.findOne();
    if (!config) {
      config = new SerialConfig();
    }
    
    Object.assign(config, req.body);
    await config.save();
    
    res.json({ message: 'Configuration saved successfully', config });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save configuration', error: error.message });
  }
};
