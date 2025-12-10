const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Round2State = require('../models/Round2State');
const Round3State = require('../models/Round3State');

// Get workspace score and details
router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({
      score: workspace.score || 0,
      flags: workspace.flags || {},
      cwd: workspace.cwd
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Get user progress across all rounds
router.get('/progress/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      round1Complete: user.round1Complete,
      round2Complete: user.round2Complete,
      round3Complete: user.round3Complete,
      round1Score: user.round1Score,
      round2Score: user.round2Score,
      round3Score: user.round3Score,
      totalScore: user.totalScore
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Mark round as complete and update user score
router.post('/complete-round', async (req, res) => {
  try {
    const { username, round, score } = req.body;
    
    if (!username || !round || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the appropriate round completion status and score
    if (round === 1) {
      user.round1Complete = true;
      user.round1Score = score;
    } else if (round === 2) {
      // Check if round 1 is complete
      if (!user.round1Complete) {
        return res.status(400).json({ error: 'Must complete Round 1 first' });
      }
      user.round2Complete = true;
      user.round2Score = score;
    } else if (round === 3) {
      // Check if round 2 is complete
      if (!user.round2Complete) {
        return res.status(400).json({ error: 'Must complete Round 2 first' });
      }
      user.round3Complete = true;
      user.round3Score = score;
    } else {
      return res.status(400).json({ error: 'Invalid round number' });
    }

    // Calculate total score
    user.totalScore = user.round1Score + user.round2Score + user.round3Score;

    await user.save();

    res.json({
      message: `Round ${round} completed successfully`,
      round1Complete: user.round1Complete,
      round2Complete: user.round2Complete,
      round3Complete: user.round3Complete,
      round1Score: user.round1Score,
      round2Score: user.round2Score,
      round3Score: user.round3Score,
      totalScore: user.totalScore
    });
  } catch (error) {
    console.error('Complete round error:', error);
    res.status(500).json({ error: 'Failed to complete round' });
  }
});

// Get workspace score
router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({
      score: workspace.score || 0,
      flags: workspace.flags || {},
      cwd: workspace.cwd
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Check if user can access a specific round
router.get('/can-access/:username/:round', async (req, res) => {
  try {
    const { username, round } = req.params;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let canAccess = false;
    const roundNum = parseInt(round);

    if (roundNum === 1) {
      canAccess = true; // Round 1 is always accessible
    } else if (roundNum === 2) {
      canAccess = user.round1Complete;
    } else if (roundNum === 3) {
      canAccess = user.round2Complete;
    }

    res.json({
      canAccess,
      reason: !canAccess ? `Must complete Round ${roundNum - 1} first` : 'Access granted'
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Get all user scores (leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: 'player' })
      .select('username totalScore round1Score round2Score round3Score round1Complete round2Complete round3Complete')
      .sort({ totalScore: -1 })
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
