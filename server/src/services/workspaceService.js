const Workspace = require('../models/Workspace');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');
const ActionLog = require('../models/ActionLog');

async function createWorkspace(name = 'workspace') {
  const ws = await Workspace.create({ name });
  return ws;
}

async function getCwd(workspace) {
  return workspace.cwd || '/system/root';
}

async function setCwd(workspace, cwd) {
  workspace.cwd = cwd;
  await workspace.save();
}

async function logAction(workspaceId, userId, command, output) {
  await ActionLog.create({ workspaceId, userId, command, output });
}

module.exports = { createWorkspace, getCwd, setCwd, logAction };
