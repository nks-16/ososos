const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, default: 'workspace' },
  createdAt: { type: Date, default: Date.now },
  flags: { type: Object, default: { stage1Complete: false, stage2Complete: false } },
  cwd: { type: String, default: '/system/root' },
  score: { type: Number, default: 0 } // scoring: decrements per command, +50 on stage completions
});

module.exports = mongoose.model('Workspace', workspaceSchema);
