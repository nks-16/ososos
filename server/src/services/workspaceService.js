// src/services/workspaceService.js
const Workspace = require('../models/Workspace');
const FileNode = require('../models/FileNode');
const ProcessModel = require('../models/Process');
const ActionLog = require('../models/ActionLog');
const mongoose = require('mongoose');

async function ensureWorkspaceDoc(wsOrId) {
  if (!wsOrId) throw new Error('workspace id or doc required');
  if (typeof wsOrId === 'string' || wsOrId instanceof mongoose.Types.ObjectId) {
    const ws = await Workspace.findById(wsOrId);
    if (ws) return ws;
    // create if missing
    return await Workspace.create({ name: `ws-${String(wsOrId)}`, cwd: '/system/root', flags: { stage1Complete: false, stage2Complete: false }, score: 0 });
  }
  // assume document
  return wsOrId;
}

async function seedWorkspace(wsOrId) {
  const wsDoc = await ensureWorkspaceDoc(wsOrId);
  const wsId = wsDoc._id;

  console.log(`[seedWorkspace] start for workspace ${wsId}`);

  // If readme exists for this workspace, assume already seeded
  const already = await FileNode.findOne({ workspaceId: wsId, path: '/system/root/readme.txt' });
  if (already) {
    console.log(`[seedWorkspace] workspace ${wsId} already seeded (readme present)`);
    return wsDoc;
  }

  const base = '/system/root';
  const nodes = [
    { workspaceId: wsId, path: `${base}`, name: 'root', type: 'dir', children: ['/system/root/modules','/system/root/var','/system/root/tmp','/system/root/readme.txt'], hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/readme.txt`, name: 'readme.txt', type: 'file', content: 'Welcome to SysBox simulation\n', hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/tmp`, name: 'tmp', type: 'dir', children: [`${base}/tmp/backup.tar.gz`], hidden: false, exec: false },
    // backup.tar.gz with tar_extract meta
    { workspaceId: wsId, path: `${base}/tmp/backup.tar.gz`, name: 'backup.tar.gz', type: 'file', content: '', hidden: false, exec: false, meta: { tar_extract: [{ path: 'fragment3.txt', content: 'FRAG-GAMMA' }] } },
    { workspaceId: wsId, path: `${base}/modules`, name: 'modules', type: 'dir', children: [`${base}/modules/fs`,`${base}/modules/proc`], hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/fs`, name: 'fs', type: 'dir', children: [`${base}/modules/fs/mount.conf`,`${base}/modules/fs/mount.clean`,`${base}/modules/fs/.secret.part`], hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/fs/mount.conf`, name: 'mount.conf', type: 'file', content: '# mount.conf  (corrupted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\n\n# WARNING: missing mount_handler & safe_mode\n\n# MALICIOUS:\ninjector_flag=1\n', hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/fs/mount.clean`, name: 'mount.clean', type: 'file', content: '# mount.clean  (trusted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\nmount_handler=v2.1\nsafe_mode=true\n\n# Internal note:\nFRAG-BETA\n', hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/fs/.secret.part`, name: '.secret.part', type: 'file', content: 'FRAG-ALPHA', hidden: true, exec: false },
    { workspaceId: wsId, path: `${base}/modules/proc`, name: 'proc', type: 'dir', children: [`${base}/modules/proc/report.log`, `${base}/modules/proc/cleanup.sh`], hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/proc/report.log`, name: 'report.log', type: 'file', content: 'PROCESS MODULE REPORT\n\nA system scan detected unusual activity inside the running processes.\n\nClues: ...', hidden: false, exec: false },
    { workspaceId: wsId, path: `${base}/modules/proc/cleanup.sh`, name: 'cleanup.sh', type: 'file', content: '#!/bin/sh\necho Cleanup', hidden: false, exec: false }
  ];

  try {
    // insert nodes but avoid duplicates using upsert per path
    const bulk = nodes.map(n => ({
      updateOne: {
        filter: { workspaceId: wsId, path: n.path },
        update: { $setOnInsert: n },
        upsert: true
      }
    }));
    if (bulk.length) await FileNode.bulkWrite(bulk);
    console.log(`[seedWorkspace] inserted/ensured ${nodes.length} file nodes for ${wsId}`);
  } catch (err) {
    console.error('[seedWorkspace] insert nodes failed', err);
    throw err;
  }

  // seed processes if none exist
  const existingProc = await ProcessModel.findOne({ workspaceId: wsId });
  if (!existingProc) {
    try {
      await ProcessModel.insertMany([
        { workspaceId: wsId, pid: 780, ppid: 1, name: 'updater.py', cpu: 92, user: 'user', metadata: { openFiles: ['/opt/updater/updater.py','/tmp/keycache.db','/etc/autorun/updater.start'] } },
        { workspaceId: wsId, pid: 781, ppid: 780, name: 'worker.py', cpu: 30, user: 'user', metadata: {} },
        { workspaceId: wsId, pid: 782, ppid: 780, name: 'worker.py', cpu: 29, user: 'user', metadata: {} }
      ]);
      console.log(`[seedWorkspace] seeded processes for ${wsId}`);
    } catch (err) {
      console.error('[seedWorkspace] insert processes failed', err);
      throw err;
    }
  } else {
    console.log(`[seedWorkspace] processes already present for ${wsId}`);
  }

  console.log(`[seedWorkspace] completed for workspace ${wsId}`);
  return wsDoc;
}

async function createAndSeed(name = 'workspace') {
  const ws = await Workspace.create({ name, cwd: '/system/root', flags: { stage1Complete:false, stage2Complete:false }, score: 0 });
  await seedWorkspace(ws._id);
  return ws;
}


async function logAction(workspaceId, userId, command, output) {
  try {
    await ActionLog.create({ workspaceId, userId: userId || null, command: command || '', output: output || '', ts: new Date() });
  } catch (err) {
    console.error('workspaceService.logAction error', err);
  }
}

module.exports = { seedWorkspace, createAndSeed, logAction };
