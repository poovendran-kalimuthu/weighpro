const express = require('express');
const router = express.Router();
const c = require('../controllers/driverController');

router.get('/', c.getAllDrivers);
router.get('/:id', c.getDriverById);
router.post('/', c.createDriver);
router.put('/:id', c.updateDriver);
router.delete('/:id', c.deleteDriver);

module.exports = router;
