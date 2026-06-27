require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/weighments', require('./routes/weighmentRoutes'));
app.use('/api/sms', require('./routes/smsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/serial', require('./routes/serialRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WeighBridge API is running on MongoDB' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const http = require('http');
const { Server } = require('socket.io');
const serialService = require('./services/serialService');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Socket in Serial Service
serialService.initSocket(io);

// Auto-connect to serial port with saved configuration
serialService.startWithSavedConfig();

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  // Push initial status and weight values
  socket.emit('connection:status', serialService.getStatus());
  socket.emit('weight:update', serialService.getCurrentWeight());
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
