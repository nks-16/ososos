// controllers/authController.js  (overwrite register)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const workspaceService = require('../services/workspaceService');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function register(req, res) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username & password required' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'username exists' });

    // Create workspace AND seed it using createAndSeed (atomic for our use case)
    const ws = await workspaceService.createAndSeed(`${username}-ws`);

    // now create user and attach workspaceId
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash: hash, role: role || 'player', workspaceId: ws._id });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ 
      token, 
      workspaceId: ws._id, 
      username: user.username, 
      role: user.role,
      sessionId: user._id.toString(),
      progress: {
        round1Complete: user.round1Complete,
        round2Complete: user.round2Complete,
        round3Complete: user.round3Complete,
        round1Score: user.round1Score,
        round2Score: user.round2Score,
        round3Score: user.round3Score,
        totalScore: user.totalScore
      }
    });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'registration failed' });
  }
}


async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'invalid credentials' });

  // ensure user has a workspace
  let ws = null;
  if (!user.workspaceId) {
    ws = await Workspace.create({ name: `${username}-ws`, cwd: '/system/root' });
    await workspaceService.seedWorkspace(ws);
    user.workspaceId = ws._id;
    await user.save();
  } else {
    ws = await Workspace.findById(user.workspaceId);
    // if workspace exists but seems unseeded, ensure seeding
    await workspaceService.seedWorkspace(ws);
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '8h' });
  
  console.log(`User ${username} logged in with progress:`, {
    round1Score: user.round1Score,
    round2Score: user.round2Score,
    round3Score: user.round3Score,
    totalScore: user.totalScore
  });
  
  return res.json({ 
    token, 
    workspaceId: user.workspaceId, 
    username: user.username, 
    role: user.role,
    sessionId: user._id.toString(),
    progress: {
      round1Complete: user.round1Complete,
      round2Complete: user.round2Complete,
      round3Complete: user.round3Complete,
      round1Score: user.round1Score,
      round2Score: user.round2Score,
      round3Score: user.round3Score,
      totalScore: user.totalScore
    }
  });
}

module.exports = { register, login };
