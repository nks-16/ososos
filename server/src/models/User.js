const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['player', 'facilitator'], default: 'player' },
  workspaceId: { type: mongoose.Types.ObjectId, ref: 'Workspace' },
  // Round progression tracking
  round1Complete: { type: Boolean, default: false },
  round2Complete: { type: Boolean, default: false },
  round3Complete: { type: Boolean, default: false },
  // Scores for each round
  round1Score: { type: Number, default: 0 },
  round2Score: { type: Number, default: 0 },
  round3Score: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
