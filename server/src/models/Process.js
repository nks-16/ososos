const mongoose = require('mongoose');

const procSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Types.ObjectId, required: true, index: true },
  pid: { type: Number, required: true },
  ppid: { type: Number, default: 1 },
  name: { type: String, required: true },
  cpu: { type: Number, default: 0 },
  metadata: { type: mongoose.Mixed, default: {} }
});

procSchema.index({ workspaceId: 1, pid: 1 }, { unique: true });

module.exports = mongoose.model('Process', procSchema);
