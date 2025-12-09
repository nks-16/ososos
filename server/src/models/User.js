const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['player', 'facilitator'], default: 'player' },
  workspaceId: { type: mongoose.Types.ObjectId, ref: 'Workspace' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
