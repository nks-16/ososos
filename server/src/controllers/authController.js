const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const workspaceService = require('../services/workspaceService');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function register(req, res) {
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: 'username exists' });
  const ws = await Workspace.create({ name: `${username}-ws` });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash: hash, role: role || 'player', workspaceId: ws._id });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, workspaceId: ws._id, username: user.username, role: user.role });
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, workspaceId: user.workspaceId, username: user.username, role: user.role });
}

module.exports = { register, login };
