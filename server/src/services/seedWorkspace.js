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
    { workspaceId: ws._id, path: `${base}/readme.txt`, name: 'readme.txt', type: 'file', content: 'Welcome to SysBox simulation\nStage 1: FileSystems\n A config file inside the filesystem module was corrupted\nduring a crash. Your goal is to:\n • Explore the filesystem\n  • Inspect the config files inside filesystem modules\n • Extract any backups found in /tmp\n• Compare files if needed\n• Restore a correct config to complete Stage 1', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/tmp`, name: 'tmp', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/tmp/backup.tar.gz`, `${base}/tmp/fragment3.txt`] },
    { workspaceId: ws._id, path: `${base}/tmp/backup.tar.gz`, name: 'backup.tar.gz', type: 'file', content: '', hidden: false, exec: false, meta: { tar_extract: [{ path: 'fragment3.txt', content: 'FRAG-GAMMA' }] } },
    { workspaceId: ws._id, path: `${base}/tmp/fragment3.txt`, name: 'fragment3.txt', type: 'file', content: 'FRAG-GAMMA', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/var`, name: 'var', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/var/system.log`] },
    { workspaceId: ws._id, path: `${base}/var/system.log`, name: 'system.log', type: 'file', content: '2025-12-08T03:11:35Z INFO  Filesystem module experienced a crash.\n[This is not the folder you are looking for]', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules`, name: 'modules', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/fs`,`${base}/modules/proc`] },
    { workspaceId: ws._id, path: `${base}/modules/fs`, name: 'fs', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/fs/mount.conf`,`${base}/modules/fs/mount.clean`,`${base}/modules/fs/note.txt`,`${base}/modules/fs/.secret.part`] },
    { workspaceId: ws._id, path: `${base}/modules/fs/mount.conf`, name: 'mount.conf', type: 'file', content: '# mount.conf  (corrupted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\n\n# WARNING: missing mount_handler & safe_mode\n\n# MALICIOUS:\ninjector_flag=1\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/fs/mount.clean`, name: 'mount.clean', type: 'file', content: '# mount.clean  (trusted)\ntype=ext4\nflags=rw\nprimary_mount=/dev/sda1\nmount_handler=v2.1\nsafe_mode=true\n\n# Internal note:\nFRAG-BETA\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/fs/note.txt`, name: 'note.txt', type: 'file', content: '# The config broke after the crash.\nOne clean copy is nearby,\nand another clue sleeps hidden.\n\nIf you\'re stuck, try looking more closely.\nNot everything shows up at first glance.\n\n', hidden: false, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/fs/.secret.part`, name: '.secret.part', type: 'file', content: 'FRAG-ALPHA', hidden: true, exec: false },
    { workspaceId: ws._id, path: `${base}/modules/proc`, name: 'proc', type: 'dir', content: '', hidden: false, exec: false, children: [`${base}/modules/proc/report.log`, `${base}/modules/proc/cleanup.sh`] },
    { workspaceId: ws._id, path: `${base}/modules/proc/report.log`, name: 'report.log', type: 'file', content: '──────────────────────────────────────────────\nPROCESS MODULE REPORT\n──────────────────────────────────────────────\n\nA system scan detected unusual activity inside\nthe running processes.\n\nClues:\n\n • One process is a large malicious process \n   compared to normal system activity.\n\n • This suspicious process also spawned two\n   helper processes (children).\n\n • Your task is to identify and terminate the malicious process and then run the cleanup to restore.\n', hidden: false, exec: false },
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
