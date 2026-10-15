const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.post('/', historyController.saveHistory);
router.get('/', historyController.getHistories);

module.exports = router;
