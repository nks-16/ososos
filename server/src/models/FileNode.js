const mongoose = require('mongoose');

const fileNodeSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Types.ObjectId, required: true, index: true },
  path: { type: String, required: true }, // normalized absolute path
  name: { type: String, required: true },
  type: { type: String, enum: ['file', 'dir'], required: true },
  content: { type: String, default: '' },
  hidden: { type: Boolean, default: false },
  exec: { type: Boolean, default: false },
  metadata: { type: mongoose.Mixed, default: {} },
  version: { type: Number, default: 1 }
});

fileNodeSchema.index({ workspaceId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('FileNode', fileNodeSchema);
