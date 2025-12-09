const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const secret = process.env.JWT_SECRET || 'changeme';

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    if (user.workspaceId) {
      const ws = await Workspace.findById(user.workspaceId);
      if (ws) req.workspace = ws;
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function facilitatorOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'facilitator') return res.status(403).json({ error: 'Admin only' });
  next();
}

module.exports = { authMiddleware, facilitatorOnly };
