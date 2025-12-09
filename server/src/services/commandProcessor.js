const path = require('path');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');
const Workspace = require('../models/Workspace');
const mongoose = require('mongoose');

// helper: normalize path (very simple)
function normPath(base, p) {
  if (!p) return base;
  if (p.startsWith('/')) return path.posix.normalize(p);
  const combined = path.posix.join(base, p);
  return path.posix.normalize(combined);
}

// list children
async function cmd_ls(workspaceId, cwd, argsText) {
  // argsText might include -a and optional path
  const match = argsText.match(/^ls(\s+(-a))?(\s+(.+))?$/);
  const showAll = !!(match && match[2]);
  const requested = match && match[4] ? match[4] : null;
  const target = normPath(cwd, requested || '.');

  // find the directory node
  const dirPath = target;
  const children = await FileNode.find({ workspaceId, path: new RegExp(`^${dirPath}(/|$)`) });

  // We want to list direct children only
  const map = {};
  children.forEach(c => {
    const rel = c.path.slice(dirPath === '/' ? 1 : dirPath.length + 1);
    const first = rel.split('/')[0];
    if (first) map[first] = c;
  });

  // Build listing: directories have trailing /
  const names = Object.keys(map).sort();
  const lines = [];
  for (const n of names) {
    const node = children.find(c => c.path.endsWith(`/${n}`) || c.path === `${dirPath}/${n}` || c.path === `/${n}`);
    if (!node) continue;
    if (node.hidden && !showAll) continue;
    if (node.type === 'dir') lines.push(n + '/');
    else lines.push(n);
  }

  if (names.length === 0) return '(empty)';
  return lines.join('  ');
}

async function cmd_pwd(workspace) {
  return workspace.cwd || '/system/root';
}

async function cmd_cd(workspace, arg) {
  const base = workspace.cwd || '/system/root';
  const dest = normPath(base, arg);
  // check directory exists
  const node = await FileNode.findOne({ workspaceId: workspace._id, path: dest, type: 'dir' });
  if (!node) return `cd: ${arg}: No such directory`;
  workspace.cwd = dest;
  await workspace.save();
  return '';
}

async function cmd_cat(workspaceId, cwd, filePath) {
  const target = normPath(cwd, filePath);
  const node = await FileNode.findOne({ workspaceId, path: target, type: 'file' });
  if (!node) return `cat: ${filePath}: No such file`;
  return node.content;
}

async function cmd_diff(workspaceId, cwd, a, b) {
  const A = normPath(cwd, a);
  const B = normPath(cwd, b);
  const na = await FileNode.findOne({ workspaceId, path: A, type: 'file' });
  const nb = await FileNode.findOne({ workspaceId, path: B, type: 'file' });
  if (!na) return `diff: ${a}: No such file`;
  if (!nb) return `diff: ${b}: No such file`;
  if (na.content === nb.content) return 'Files are identical';
  // simple line diff
  const la = na.content.split(/\r?\n/);
  const lb = nb.content.split(/\r?\n/);
  const lines = [];
  const max = Math.max(la.length, lb.length);
  for (let i = 0; i < max; ++i) {
    const ra = la[i] || '';
    const rb = lb[i] || '';
    if (ra !== rb) lines.push(`${i + 1}c\n- ${ra}\n+ ${rb}`);
  }
  return lines.join('\n');
}

async function cmd_tar_extract(workspaceId, cwd, archive) {
  const target = normPath(cwd, archive);
  const node = await FileNode.findOne({ workspaceId, path: target, type: 'file' });
  if (!node) return `tar: ${archive}: Cannot open: No such file`;
  // Check metadata for simulated tar contents
  const meta = node.metadata || {};
  if (!meta.tar_extract) return 'tar: no files to extract';
  // meta.tar_extract is an array of { path, content, hidden?, exec? }
  const created = [];
  const session = await mongoose.startSession().catch(()=>null);
  let useTxn = !!session;
  if (useTxn) session.startTransaction();
  try {
    for (const item of meta.tar_extract) {
      const p = normPath(cwd, item.path);
      const name = p.split('/').pop();
      await FileNode.updateOne(
        { workspaceId, path: p },
        { $set: { workspaceId, path: p, name, type: 'file', content: item.content || '', hidden: !!item.hidden, exec: !!item.exec }, $inc: { version: 1 } },
        { upsert: true, session: session || undefined }
      );
      created.push(p);
    }
    if (useTxn) await session.commitTransaction();
    if (session) session.endSession();
    return `x ${created.join('\nx ')}`;
  } catch (err) {
    if (useTxn) await session.abortTransaction();
    if (session) session.endSession();
    return 'tar: extraction failed';
  }
}

async function cmd_cp(workspaceId, cwd, src, dst) {
  const S = normPath(cwd, src);
  const D = normPath(cwd, dst);
  const srcNode = await FileNode.findOne({ workspaceId, path: S });
  if (!srcNode) return `cp: ${src}: No such file or directory`;
  // copy content & metadata to dst (file only)
  const name = D.split('/').pop();
  await FileNode.updateOne({ workspaceId, path: D }, { $set: { workspaceId, path: D, name, type: srcNode.type, content: srcNode.content, hidden: srcNode.hidden, exec: srcNode.exec, metadata: srcNode.metadata }, $inc: { version: 1 } }, { upsert: true });
  return '';
}

async function cmd_chmod(workspaceId, cwd, target) {
  const T = normPath(cwd, target);
  const node = await FileNode.findOne({ workspaceId, path: T });
  if (!node) return `chmod: ${target}: No such file`;
  node.exec = true;
  node.version = (node.version || 1) + 1;
  await node.save();
  return '';
}

async function cmd_run(workspace, cwd, scriptName) {
  const T = normPath(cwd, `./${scriptName}`);
  const node = await FileNode.findOne({ workspaceId: workspace._id, path: T });
  if (!node) return `${scriptName}: No such file`;
  if (!node.exec) return `${scriptName}: Permission denied`;
  // Simulated script behaviors: we implement cleanup.sh specifically
  if (scriptName === 'cleanup.sh') {
    // Remove updater files and mark stage2 complete
    // Remove /opt/updater/* simulated by removing FileNodes with metadata.updaterFile true
    await FileNode.deleteMany({ workspaceId: workspace._id, 'metadata.updaterFile': true });
    // Clean processes: remove any processes with name updater.py or worker.py
    await Process.deleteMany({ workspaceId: workspace._id, name: { $in: ['updater.py', 'worker.py'] } });
    workspace.flags.stage2Complete = true;
    await workspace.save();
    return '[CLEANUP] Removing /opt/updater/*\n[CLEANUP] updater removed.\n[STAGE 2 COMPLETE] System fully restored.';
  }
  return `${scriptName}: (script runs, but nothing special happened)`;
}

async function cmd_ps(workspaceId, forest) {
  const procs = await Process.find({ workspaceId }).sort({ pid: 1 });
  if (!forest) {
    const lines = procs.map(p => `${p.name.padEnd(10)} ${p.pid.toString().padStart(5)} ${p.ppid.toString().padStart(5)} ${p.cpu}%`);
    return lines.join('\n');
  } else {
    // simple tree print
    const byPid = {};
    procs.forEach(p => byPid[p.pid] = p);
    const roots = procs.filter(p => !byPid[p.ppid]);
    const lines = [];
    function walk(p, prefix = '') {
      lines.push(`${prefix}${p.pid} ${p.name}`);
      const children = procs.filter(q => q.ppid === p.pid);
      for (let i = 0; i < children.length; ++i) {
        walk(children[i], prefix + ' ├─ ');
      }
    }
    roots.forEach(r => walk(r));
    return lines.join('\n');
  }
}

async function cmd_lsof(workspaceId, pid) {
  const p = await Process.findOne({ workspaceId, pid });
  if (!p) return `lsof: process ${pid} not found`;
  const open = p.metadata && p.metadata.openFiles ? p.metadata.openFiles : [];
  if (open.length === 0) return '(no files open)';
  return open.join('\n');
}

async function cmd_kill(workspaceId, pid) {
  const p = await Process.findOne({ workspaceId, pid });
  if (!p) return `kill: ${pid}: No such process`;
  // Remove children automatically
  await Process.deleteMany({ workspaceId, $or: [{ pid }, { ppid: pid }] });
  return `[OK] Terminated process ${pid}\n[OK] Child processes stopped`;
}

async function cmd_rm(workspaceId, cwd, target) {
  const T = normPath(cwd, target);
  const res = await FileNode.deleteOne({ workspaceId, path: T });
  if (res.deletedCount === 0) return `rm: cannot remove '${target}': No such file or directory`;
  return '';
}

module.exports = {
  normPath,
  cmd_ls,
  cmd_pwd,
  cmd_cd,
  cmd_cat,
  cmd_diff,
  cmd_tar_extract,
  cmd_cp,
  cmd_chmod,
  cmd_run,
  cmd_ps,
  cmd_lsof,
  cmd_kill,
  cmd_rm
};
