const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const { connectDB } = require('../config/db');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');
const Workspace = require('../models/Workspace');

async function doSeedForWorkspace(workspaceId) {
  // workspaceId is ObjectId or string
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw new Error('Workspace not found');

  const base = '/system/root';

  const nodes = [
    { path: `${base}`, name: 'root', type: 'dir' },
    { path: `${base}/tmp`, name: 'tmp', type: 'dir' },
    { path: `${base}/tmp/backup.tar.gz`, name: 'backup.tar.gz', type: 'file', content: '[tar archive placeholder]', metadata: { tar_extract: [{ path: 'fragment3.txt', content: 'FRAG-GAMMA' }] } },
    { path: `${base}/tmp/fragment3.txt`, name: 'fragment3.txt', type: 'file', content: 'FRAG-GAMMA', hidden: false },
    { path: `${base}/var`, name: 'var', type: 'dir' },
    { path: `${base}/var/system.log`, name: 'system.log', type: 'file', content: '2025-12-08T03:11:35Z INFO  Filesystem module experienced a crash.\n2025-12-08T03:11:40Z INFO  Backup stored in /tmp.' },
    { path: `${base}/modules`, name: 'modules', type: 'dir' },
    { path: `${base}/modules/fs`, name: 'fs', type: 'dir' },
    { path: `${base}/modules/fs/mount.conf`, name: 'mount.conf', type: 'file', content: '# mount.conf  (corrupted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\n\n# WARNING: missing mount_handler & safe_mode\n\n# MALICIOUS:\ninjector_flag=1\n' },
    { path: `${base}/modules/fs/mount.clean`, name: 'mount.clean', type: 'file', content: '# mount.clean  (trusted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\nmount_handler=v2.1\nsafe_mode=true\n\n# Internal note:\nFRAG-BETA\n' },
    { path: `${base}/modules/fs/.secret.part`, name: '.secret.part', type: 'file', content: 'FRAG-ALPHA', hidden: true },
    { path: `${base}/modules/proc`, name: 'proc', type: 'dir' },
    { path: `${base}/modules/proc/report.log`, name: 'report.log', type: 'file', content: '──────────────────────────────────────────────\nPROCESS MODULE REPORT\n──────────────────────────────────────────────\n\nA system scan detected unusual activity inside\nthe running processes.\n\nClues:\n\n • One process is a large malicious process \n   compared to normal system activity.\n\n • This suspicious process also spawned two\n   helper processes (children).\n\n • Your task is to identify and terminate the malicious process and then run the cleanup to restore.\n' },
    { path: `${base}/modules/proc/cleanup.sh`, name: 'cleanup.sh', type: 'file', content: '#!/bin/sh\necho Cleanup running', exec: false }
  ];

  // remove existing nodes and processes for workspace
  await FileNode.deleteMany({ workspaceId });
  await Process.deleteMany({ workspaceId });

  for (const n of nodes) {
    await FileNode.create({
      workspaceId,
      path: n.path,
      name: n.name,
      type: n.type,
      content: n.content || '',
      hidden: !!n.hidden,
      exec: !!n.exec,
      metadata: n.metadata || {}
    });
  }

  // processes (updater parent + workers)
  const procs = [
    { workspaceId, pid: 780, ppid: 1, name: 'updater.py', cpu: 92, metadata: { openFiles: ['/opt/updater/updater.py', '/tmp/keycache.db', '/etc/autorun/updater.start'] } },
    { workspaceId, pid: 781, ppid: 780, name: 'worker.py', cpu: 30, metadata: {} },
    { workspaceId, pid: 782, ppid: 780, name: 'worker.py', cpu: 29, metadata: {} }
  ];
  for (const p of procs) await Process.create(p);

  // set workspace flags
  ws.flags = { stage1Complete: false, stage2Complete: false };
  ws.cwd = '/system/root';
  await ws.save();
  console.log('Seeded workspace', workspaceId.toString());
}

// If run directly, create a new workspace and seed it
async function main() {
  await connect();
  const ws = await Workspace.create({ name: 'seeded-ws' });
  await doSeedForWorkspace(ws._id);
  console.log('Created workspace', ws._id.toString());
  process.exit(0);
}

let connected = false;
async function connect() {
  if (connected) return;
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/oscape', { useNewUrlParser: true, useUnifiedTopology: true });
  connected = true;
}

module.exports = { doSeedForWorkspace };

if (require.main === module) {
  (async () => {
    try {
      await connect();
      const ws = await Workspace.create({ name: 'seeded-ws' });
      await doSeedForWorkspace(ws._id);
      console.log('Seed complete:', ws._id.toString());
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
