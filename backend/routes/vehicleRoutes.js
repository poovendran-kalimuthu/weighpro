const express = require('express');
const router = express.Router();
const c = require('../controllers/vehicleController');

router.get('/', c.getAllVehicles);
router.get('/:id', c.getVehicleById);
router.post('/', c.createVehicle);
router.put('/:id', c.updateVehicle);
router.delete('/:id', c.deleteVehicle);

module.exports = router;
