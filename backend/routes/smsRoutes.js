const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const { deviceAuth } = require('../middleware/authMiddleware');

// Mobile App Routes (Protected with device authentication API Key)
router.get('/pending', deviceAuth, smsController.getPendingSms);
router.post('/update-status', deviceAuth, smsController.updateSmsStatus);

// ERP Dashboard Routes
router.get('/history', smsController.getSmsHistory);
router.get('/dashboard', smsController.getSmsDashboardStats);
router.post('/retry/:id', smsController.retrySms);

module.exports = router;
