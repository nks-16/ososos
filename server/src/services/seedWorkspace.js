// src/services/seedWorkspace.js
const FileNode = require('../models/FileNode');
const Workspace = require('../models/Workspace');
const ProcessModel= require('../models/Process');

async function seedWorkspace(name = 'workspace') {
  // create workspace
  const ws = await Workspace.create({
    name,
    cwd: '/system/root',
    flags: { stage1Complete: false, stage2Complete: false },
    score: 0
  });

  const base = '/system/root';
  const nodes = [
    { workspaceId: ws._id, path: `${base}`, name: 'root', type: 'dir', content: '', hidden: false, exec: false, meta: {}, children: ['/system/root/modules','/system/root/var','/system/root/tmp','/system/root/readme.txt'] },
    { workspaceId: ws._id, path: `${base}/readme.txt`, name: 'readme.txt', type: 'file', content: 'Welcome to SysBox simulation\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/tmp`, name: 'tmp', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/tmp/backup.tar.gz`] },
    { workspaceId: ws._id, path: `${base}/tmp/backup.tar.gz`, name: 'backup.tar.gz', type: 'file', content: '', hidden: false, exec: false, meta: { tar_extract: [{ path: 'fragment3.txt', content: 'FRAG-GAMMA' }] } },
    { workspaceId: ws._id, path: `${base}/modules`, name: 'modules', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/fs`,`${base}/modules/proc`] },
    { workspaceId: ws._id, path: `${base}/modules/fs`, name: 'fs', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/fs/mount.conf`,`${base}/modules/fs/mount.clean`,`${base}/modules/fs/.secret.part`] },
    { workspaceId: ws._id, path: `${base}/modules/fs/mount.conf`, name: 'mount.conf', type: 'file', content: '# mount.conf  (corrupted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\n\n# WARNING: missing mount_handler & safe_mode\n\n# MALICIOUS:\ninjector_flag=1\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/fs/mount.clean`, name: 'mount.clean', type: 'file', content: '# mount.clean  (trusted)\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/fs/.secret.part`, name: '.secret.part', type: 'file', content: 'FRAG-ALPHA', hidden: true, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/proc`, name: 'proc', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/proc/report.log`, `${base}/modules/proc/cleanup.sh`] },
    { workspaceId: ws._id, path: `${base}/modules/proc/report.log`, name: 'report.log', type: 'file', content: 'PROCESS MODULE REPORT\n\nA system scan detected unusual activity...', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/proc/cleanup.sh`, name: 'cleanup.sh', type: 'file', content: '#!/bin/sh\necho Cleanup', hidden: false, exec: false }
  ];

  // insert nodes
  await FileNode.insertMany(nodes);

  // after inserting nodes in seedWorkspace, also seed the simulated processes for this workspace
  // seed default processes for this workspace (if none exist)
  const anyProc = await ProcessModel.findOne({ workspaceId: wsDoc._id });
  if (!anyProc) {
    const procs = [
      { workspaceId: wsDoc._id, pid: 780, ppid: 1, name: 'updater.py', cpu: 92, user: 'user', metadata: { openFiles: ['/opt/updater/updater.py','/tmp/keycache.db','/etc/autorun/updater.start'] } },
      { workspaceId: wsDoc._id, pid: 781, ppid: 780, name: 'worker.py', cpu: 30, user: 'user', metadata: {} },
      { workspaceId: wsDoc._id, pid: 782, ppid: 780, name: 'worker.py', cpu: 29, user: 'user', metadata: {} }
    ];
    await ProcessModel.insertMany(procs);
  }

  return ws;
}



module.exports = { seedWorkspace };
