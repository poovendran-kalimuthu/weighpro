const express = require('express');
const router = express.Router();
const c = require('../controllers/materialController');

router.get('/', c.getAllMaterials);
router.get('/:id', c.getMaterialById);
router.post('/', c.createMaterial);
router.put('/:id', c.updateMaterial);
router.delete('/:id', c.deleteMaterial);

module.exports = router;
