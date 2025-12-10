// utils/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const workspaceService = require('../services/workspaceService');
const secret = process.env.JWT_SECRET || 'changeme';

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // ensure workspace exists and is seeded; attach to req
    let ws = null;
    if (user.workspaceId) {
      ws = await Workspace.findById(user.workspaceId);
      if (!ws) {
        // workspace record missing: create+seed and attach
        ws = await workspaceService.createAndSeed(`${user.username}-ws`);
        user.workspaceId = ws._id;
        await user.save();
      } else {
        // ensure seed exists (idempotent)
        await workspaceService.seedWorkspace(ws);
      }
    } else {
      // user has no workspace: create and seed one, save to user
      ws = await workspaceService.createAndSeed(`${user.username}-ws`);
      user.workspaceId = ws._id;
      await user.save();
    }

    req.user = user;
    req.workspace = ws;
    next();
  } catch (err) {
    console.error('authMiddleware err', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function facilitatorOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'facilitator') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { authMiddleware, facilitatorOnly };
