const express = require('express');
const router = express.Router();
const c = require('../controllers/weighmentController');

router.get('/stats', c.getStats);
router.get('/', c.getAllWeighments);
router.get('/:id', c.getWeighmentById);
router.post('/', c.createWeighment);
router.put('/:id/second-weight', c.recordSecondWeight);
router.put('/:id', c.updateWeighment);
router.delete('/:id', c.deleteWeighment);

module.exports = router;
