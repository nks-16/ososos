const path = require('path');
const pathLib = require('path');            // if not already present
const FileNode = require('../models/FileNode'); // keep if used in file
const ProcessModel = require('../models/Process'); 
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

async function cmd_tar_extract(workspaceId, cwd, tarname) {
  // normalize tar path (absolute or relative)
  const tarPath = tarname && tarname.startsWith('/') ? tarname : (cwd === '/' ? `/${tarname}` : `${cwd}/${tarname}`);
  const tarNode = await FileNode.findOne({ workspaceId, path: tarPath });
  if (!tarNode) return `tar: ${tarname}: Cannot open: No such file or directory`;

  // We're simplifying: running tar on any backup.tar.gz will create fragment3.txt
  // in the same directory for that workspace if it doesn't already exist.
  const outPath = pathLib.posix.join(pathLib.posix.dirname(tarPath), 'fragment3.txt');

  // If file already exists in this workspace, indicate nothing to extract (idempotent)
  const exists = await FileNode.findOne({ workspaceId, path: outPath });
  if (exists) {
    return 'Nothing to extract (files already present)';
  }

  // Create the fragment file in the DB for this workspace
  const node = {
    workspaceId,
    path: outPath,
    name: pathLib.posix.basename(outPath),
    type: 'file',
    content: 'FRAG-GAMMA\n#VALID',
    hidden: false,
    exec: false,
    meta: {}
  };

  await FileNode.create(node);

  // Return tar-like output
  return `x ${node.name}`;
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
    workspace.markModified('flags');
    await workspace.save();
    return '[CLEANUP] Removing /opt/updater/*\n[CLEANUP] Malicious processes and files removed.';
  }
  return `${scriptName}: (script runs, but nothing special happened)`;
}

// show processes (non-forest or forest tree view)
async function cmd_ps(workspaceId, forest = false) {
  // support being called with raw string options too (e.g., '-ef --forest' or '--forest')
  if (typeof forest === 'string') {
    forest = /--forest/.test(forest) || /-f/.test(forest) && /-e/.test(forest);
  }

  const procs = await ProcessModel.find({ workspaceId }).lean();
  if (!procs || procs.length === 0) return '(no processes)';

  if (!forest) {
    // simple table-ish output: user pid ppid cpu% name
    return procs.map(p => `${p.user || 'user'}\t${p.pid}\t${p.ppid}\t${p.cpu || 0}%\t${p.name}`).join('\n');
  } else {
    // build pid->node map for tree rendering
    const byPid = {};
    procs.forEach(p => byPid[p.pid] = { ...p, children: [] });
    procs.forEach(p => {
      if (byPid[p.ppid]) byPid[p.ppid].children.push(byPid[p.pid]);
    });

    // find roots: ppid missing or ppid === 1
    const roots = Object.values(byPid).filter(n => !byPid[n.ppid] || n.ppid === 1);

    function render(node, prefix = '') {
      // display pid name (cpu%)
      let line = `${prefix}${node.pid} ${node.name} (${node.cpu || 0}%)`;
      // children lines
      const kids = node.children.map((c, i) => {
        const branch = (i === node.children.length - 1) ? ' └─ ' : ' ├─ ';
        const childPrefix = prefix + branch;
        // for deeper levels, use same branch char — simple visual
        return render(c, childPrefix);
      });
      return [line, ...kids].join('\n');
    }

    // if multiple roots, join with newline
    return roots.map(r => render(r)).join('\n');
  }
}

// list open files for a pid (workspace-scoped)
async function cmd_lsof(workspaceId, pid) {
  if (!pid || isNaN(pid)) return `lsof: pid ${pid} not found`;
  const proc = await ProcessModel.findOne({ workspaceId, pid }).lean();
  if (!proc) return `lsof: pid ${pid} not found`;
  const files = (proc.metadata && (proc.metadata.openFiles || proc.metadata.open_files)) || proc.openFiles || [];
  return (files.length === 0) ? '(no open files)' : files.join('\n');
}

// kill a process (workspace-scoped)
async function cmd_kill(workspaceId, pid) {
  if (!pid || isNaN(pid)) return `kill: ${pid}: invalid pid`;
  // remove the parent and any children (ppid == pid) in this workspace only
  await ProcessModel.deleteMany({ workspaceId, $or: [{ pid }, { ppid: pid }] });

  return `[OK] Terminated process ${pid} and its children.`;
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
