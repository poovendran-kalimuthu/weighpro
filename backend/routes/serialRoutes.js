const express = require('express');
const router = express.Router();
const serialController = require('../controllers/serialController');

router.get('/ports', serialController.getPorts);
router.post('/connect', serialController.connectPort);
router.post('/disconnect', serialController.disconnectPort);
router.post('/test', serialController.testPort);
router.get('/status', serialController.getStatus);
router.get('/current-weight', serialController.getCurrentWeight);
router.get('/logs', serialController.getLogs);
router.get('/configuration', serialController.getConfiguration);
router.put('/configuration', serialController.updateConfiguration);

module.exports = router;
