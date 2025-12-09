const Workspace = require('../models/Workspace');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');
const seed = require('../seed/seed');

async function resetWorkspace(req, res) {
  const { workspaceId } = req.body;
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });
  // delete file nodes and processes for workspace
  await FileNode.deleteMany({ workspaceId });
  await Process.deleteMany({ workspaceId });
  // seed
  await seed.doSeedForWorkspace(workspaceId);
  return res.json({ ok: true });
}

async function getState(req, res) {
  const { workspaceId } = req.params;
  const files = await FileNode.find({ workspaceId });
  const procs = await Process.find({ workspaceId });
  return res.json({ files, procs });
}

module.exports = { resetWorkspace, getState };
