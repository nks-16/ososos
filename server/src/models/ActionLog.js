const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User' },
  command: { type: String, required: true },
  inputAt: { type: Date, default: Date.now },
  output: { type: String }
});

module.exports = mongoose.model('ActionLog', actionLogSchema);
