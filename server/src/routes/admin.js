const express = require('express');
const router = express.Router();
const { authMiddleware, facilitatorOnly } = require('../utils/authMiddleware');
const adminCtrl = require('../controllers/adminController');

router.post('/reset', authMiddleware, facilitatorOnly, adminCtrl.resetWorkspace);
router.get('/state/:workspaceId', authMiddleware, facilitatorOnly, adminCtrl.getState);

module.exports = router;
