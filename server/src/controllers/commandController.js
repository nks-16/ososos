const { parseCommand } = require('../utils/parseCommand');
const cpService = require('../services/commandProcessor');
const workspaceService = require('../services/workspaceService');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');

async function runCommand(req, res) {
  const raw = req.body.command;
  if (!raw) return res.status(400).json({ error: 'command required' });
  const user = req.user;
  const workspace = req.workspace;
  if (!workspace) return res.status(400).json({ error: 'workspace not found' });

  // parse with our parser
  let parsed;
  try {
    parsed = parseCommand(raw);
  } catch (err) {
    await workspaceService.logAction(workspace._id, user._id, raw, err.message);
    return res.json({ output: `Error: ${err.message}`, newPrompt: workspace.cwd, newScore: workspace.score });
  }

  const wId = workspace._id;
  let output = '';
  const prevStage1 = !!workspace.flags.stage1Complete;
  const prevStage2 = !!workspace.flags.stage2Complete;

  try {
    switch (parsed.name) {
      case 'ls': {
        output = await cpService.cmd_ls(wId, workspace.cwd, raw);
        break;
      }
      case 'pwd': {
        output = await cpService.cmd_pwd(workspace);
        break;
      }
      case 'cd': {
        const m = raw.match(/^cd\s+(.+)$/);
        output = await cpService.cmd_cd(workspace, m[1]);
        break;
      }
      case 'cat': {
        const m = raw.match(/^cat\s+(.+)$/);
        output = await cpService.cmd_cat(wId, workspace.cwd, m[1]);
        break;
      }
      case 'diff': {
        const m = raw.match(/^diff\s+(.+)\s+(.+)$/);
        output = await cpService.cmd_diff(wId, workspace.cwd, m[1], m[2]);
        break;
      }
      case 'tar': {
        const m = raw.match(/^tar\s+-xvzf\s+(.+)$/);
        output = await cpService.cmd_tar_extract(wId, workspace.cwd, m[1]);
        break;
      }
      case 'cp': {
        const m = raw.match(/^cp\s+(.+)\s+(.+)$/);
        output = await cpService.cmd_cp(wId, workspace.cwd, m[1], m[2]);

        // Specific rule: if they run cp mount.clean mount.conf in the fs dir, mark stage1 complete
        // We check the args to see if they match mount.clean -> mount.conf (absolute or relative)
        try {
          const src = m[1].trim();
          const dst = m[2].trim();
          const normalizedSrc = src.endsWith('mount.clean') || src.endsWith('/mount.clean') || src === 'mount.clean';
          const normalizedDst = dst.endsWith('mount.conf') || dst.endsWith('/mount.conf') || dst === 'mount.conf';
          if (normalizedSrc && normalizedDst && !workspace.flags.stage1Complete) {
            workspace.flags.stage1Complete = true;
            workspace.score = (workspace.score || 0) + 50; // award +50
            await workspace.save();
            output = (output ? output + '\n' : '') + '[SUCCESS] Filesystem configuration restored.\nFragments collected successfully.\nStage 2 unlocked: Process Module.';
          }
        } catch (e) {
          // ignore detection errors
        }
        break;
      }
      case 'chmod': {
        const m = raw.match(/^chmod\s+\+x\s+(.+)$/);
        output = await cpService.cmd_chmod(wId, workspace.cwd, m[1]);
        break;
      }
      case 'run': {
        const m = raw.match(/^\.\/(.+)$/);
        // cmd_run modifies workspace flags for stage2 when cleanup runs
        output = await cpService.cmd_run(workspace, workspace.cwd, m[1]);
        // If cmd_run returned stage2 complete message or workspace.flags changed, handle awarding below
        break;
      }
      case 'ps': {
        const forest = /--forest/.test(raw);
        output = await cpService.cmd_ps(wId, forest);
        break;
      }
      case 'lsof': {
        const m = raw.match(/^lsof\s+-p\s+(\d+)$/);
        output = await cpService.cmd_lsof(wId, parseInt(m[1], 10));
        break;
      }
      case 'kill': {
        const m = raw.match(/^kill\s+-9\s+(\d+)$/);
        output = await cpService.cmd_kill(wId, parseInt(m[1], 10));
        break;
      }
      case 'rm': {
        const m = raw.match(/^rm\s+(.+)$/);
        output = await cpService.cmd_rm(wId, workspace.cwd, m[1]);
        break;
      }
      default:
        output = 'Command parsed but not implemented';
    }
  } catch (err) {
    output = `Error: ${err.message}`;
  }

  // Deduct -1 point for this command execution (apply to all parsed commands)
  try {
    // ensure score exists
    workspace.score = (workspace.score || 0) - 1;
    // After possible modifications above (stage1 awarding), check stage2 awarding:
    if (!prevStage2 && workspace.flags.stage2Complete) {
      workspace.score = (workspace.score || 0) + 50;
      // append message if not already present
      if (!output.includes('[STAGE 2 COMPLETE]')) {
        output = (output ? output + '\n' : '') + '[STAGE 2 COMPLETE] System fully restored.';
      }
    }
    await workspace.save();
  } catch (err) {
    // If saving score fails, ignore for now but include debug
    console.error('Failed updating score:', err);
  }

  await workspaceService.logAction(workspace._id, user._id, raw, output || '');
  // fetch workspace again to get updated cwd and score
  const refreshed = await workspace.constructor.findById(workspace._id);
  return res.json({ output: output || '', newPrompt: refreshed.cwd, newScore: refreshed.score, flags: refreshed.flags });
}

module.exports = { runCommand };
