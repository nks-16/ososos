const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/authMiddleware');
const commandCtrl = require('../controllers/commandController');

router.post('/', authMiddleware, commandCtrl.runCommand);

module.exports = router;
