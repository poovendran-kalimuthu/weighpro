const { SerialPort } = require('serialport');
const SerialConfig = require('../models/SerialConfig');

let io = null;
let portInstance = null;
let currentPortName = null;
let currentStatus = 'Disconnected'; // 'Connected', 'Disconnected', 'Error'
let lastError = null;

let currentWeight = {
  weight: 0,
  stable: false,
  timestamp: new Date()
};

let lastWeightVal = null;
let consecutiveCount = 0;

const logs = [];
let lastLogTime = 0;
let lastLoggedWeight = null;
let lastLoggedStable = null;

let reconnectTimeout = null;
let autoReconnectEnabled = false;
let activeConfig = null;

// Initialize Socket.IO instance
function initSocket(socketIo) {
  io = socketIo;
}

// Add a log entry (limit 500)
function addLog(weight, status, error = null) {
  const now = Date.now();
  const isDifferent = lastLoggedWeight === null || Math.abs(weight - lastLoggedWeight) > 5 || status !== lastLoggedStable;
  
  if (isDifferent || now - lastLogTime > 3000 || error) {
    const logEntry = {
      timestamp: new Date(),
      comPort: currentPortName || 'N/A',
      weight: weight,
      status: status,
      error: error ? error.message || error : null
    };
    
    logs.unshift(logEntry);
    if (logs.length > 500) logs.pop();
    
    lastLogTime = now;
    lastLoggedWeight = weight;
    lastLoggedStable = status;
    
    if (io) {
      io.emit('serial:log', logEntry);
    }
  }
}

// Update status and broadcast
function setStatus(status, error = null) {
  currentStatus = status;
  lastError = error ? error.message || error : null;
  
  console.log(`[Serial Service] Status: ${status}${error ? ` - Error: ${error.message}` : ''}`);
  
  if (io) {
    io.emit('connection:status', {
      status,
      port: currentPortName,
      error: lastError
    });
    if (error) {
      io.emit('connection:error', { error: lastError });
    }
  }
}

// Broadcast weight
function broadcastWeight() {
  if (io) {
    io.emit('weight:update', currentWeight);
  }
}

let lastRawLogTime = 0;
function addRawLog(rawText) {
  const now = Date.now();
  if (now - lastRawLogTime > 3000) {
    lastRawLogTime = now;
    // Clean non-printable chars for terminal display
    const cleanRaw = rawText.replace(/[^\x20-\x7E]/g, '.');
    const logEntry = {
      timestamp: new Date(),
      comPort: currentPortName || 'N/A',
      weight: currentWeight.weight,
      status: 'RAW STREAM',
      error: `Raw Stream: "${cleanRaw.trim()}"`
    };
    logs.unshift(logEntry);
    if (logs.length > 500) logs.pop();
    if (io) {
      io.emit('serial:log', logEntry);
    }
  }
}

// Process incoming line
function handleParsedLine(line) {
  const cleanLine = line.trim();
  if (!cleanLine) return;

  // Find all number sequences (including decimals and signs)
  const matches = cleanLine.match(/[-+]?[0-9]+(?:\.[0-9]+)?/g);
  if (!matches || matches.length === 0) return;

  let chosenMatch = matches[0];

  // Heuristic 1: If there's a number followed closely by "kg", "t", "g", or "lb"
  const unitMatch = cleanLine.match(/([-+]?[0-9]+(?:\.[0-9]+)?)\s*(?:kg|t|g|lb)/i);
  if (unitMatch) {
    chosenMatch = unitMatch[1];
  } else if (matches.length > 1) {
    // Heuristic 2: If multiple numbers, pick the longest sequence of digits
    // (This filters out scale IDs like "01" or status codes in favor of the weight value "0024560")
    let maxDigitsLen = 0;
    for (const m of matches) {
      const digitOnlyLen = m.replace(/[^0-9]/g, '').length;
      if (digitOnlyLen > maxDigitsLen) {
        maxDigitsLen = digitOnlyLen;
        chosenMatch = m;
      }
    }
  }

  const weightVal = Math.round(parseFloat(chosenMatch));
  if (!isNaN(weightVal)) {
    // Stable Weight Detection
    if (weightVal === lastWeightVal) {
      consecutiveCount++;
      if (consecutiveCount >= 5) {
        currentWeight.stable = true;
      }
    } else {
      consecutiveCount = 1;
      currentWeight.stable = false;
      lastWeightVal = weightVal;
    }
    
    currentWeight.weight = weightVal;
    currentWeight.timestamp = new Date();
    
    broadcastWeight();
    addLog(weightVal, currentWeight.stable ? 'STABLE' : 'UNSTABLE');
  }
}

// List COM ports
async function listPorts() {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (err) {
    console.error('Error listing ports:', err);
    throw err;
  }
}

// Disconnect port
async function disconnect() {
  autoReconnectEnabled = false;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (!portInstance) {
    setStatus('Disconnected');
    return;
  }

  return new Promise((resolve) => {
    portInstance.close((err) => {
      if (err) {
        console.error('Error closing serial port:', err);
      }
      portInstance = null;
      currentPortName = null;
      setStatus('Disconnected');
      resolve();
    });
  });
}

// Connect using specific configuration
async function connect(config) {
  // Close existing port first
  await disconnect();
  
  activeConfig = config;
  currentPortName = config.comPort;
  autoReconnectEnabled = true;

  return new Promise((resolve, reject) => {
    try {
      setStatus('Connecting...');
      
      const options = {
        path: config.comPort,
        baudRate: config.baudRate,
        dataBits: config.dataBits,
        parity: config.parity,
        stopBits: config.stopBits,
        autoOpen: false
      };

      // Flow control mappings
      if (config.flowControl === 'rtscts') {
        options.rtscts = true;
      } else if (config.flowControl === 'xonxoff') {
        options.xonxoff = true;
      }

      portInstance = new SerialPort(options);

      let buffer = '';
      portInstance.on('data', (chunk) => {
        const rawString = chunk.toString();
        addRawLog(rawString);

        buffer += rawString;
        // Split by STX, ETX, \r, \n to support all standard indicators
        const lines = buffer.split(/[\r\n\x02\x03]+/);
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          handleParsedLine(line);
        }
      });

      portInstance.on('error', (err) => {
        console.error('Serial port error:', err);
        setStatus('Error', err);
        addLog(0, 'ERROR', err);
        scheduleReconnect();
      });

      portInstance.on('close', () => {
        console.log('Serial port closed.');
        if (autoReconnectEnabled) {
          setStatus('Error', new Error('Port closed unexpectedly.'));
          scheduleReconnect();
        } else {
          setStatus('Disconnected');
        }
      });

      portInstance.open((err) => {
        if (err) {
          setStatus('Error', err);
          addLog(0, 'ERROR', err);
          scheduleReconnect();
          return reject(err);
        }

        setStatus('Connected');
        addLog(0, 'CONNECTED');
        resolve();
      });

    } catch (err) {
      setStatus('Error', err);
      scheduleReconnect();
      reject(err);
    }
  });
}

// Reconnection scheduler
function scheduleReconnect() {
  if (!autoReconnectEnabled || !activeConfig) return;
  
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  
  reconnectTimeout = setTimeout(async () => {
    console.log(`[Serial Service] Reconnecting to ${activeConfig.comPort}...`);
    try {
      await connect(activeConfig);
    } catch (err) {
      console.log(`[Serial Service] Reconnection failed: ${err.message}`);
      // Reconnection failure will trigger another close/error which schedules retry
    }
  }, 5000);
}

// Autostart on boot (load config and connect)
async function startWithSavedConfig() {
  try {
    const config = await SerialConfig.findOne();
    if (config && config.comPort) {
      console.log(`[Serial Service] Found saved config. Autostarting on ${config.comPort}...`);
      await connect(config);
    } else {
      console.log('[Serial Service] No saved configuration found. Standing by.');
    }
  } catch (err) {
    console.error('[Serial Service] Autostart failed:', err.message);
  }
}

// Test connection (temporarily open, verify, and close)
async function testConnection(config) {
  return new Promise((resolve, reject) => {
    const options = {
      path: config.comPort,
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      parity: config.parity,
      stopBits: config.stopBits,
      autoOpen: false
    };
    
    const tempPort = new SerialPort(options);
    
    tempPort.open((err) => {
      if (err) {
        return reject(err);
      }
      
      // Successfully opened, now close
      tempPort.close(() => {
        resolve();
      });
    });
  });
}

module.exports = {
  initSocket,
  listPorts,
  connect,
  disconnect,
  testConnection,
  startWithSavedConfig,
  getStatus: () => ({
    status: currentStatus,
    port: currentPortName,
    error: lastError
  }),
  getLogs: () => logs,
  getCurrentWeight: () => currentWeight
};
