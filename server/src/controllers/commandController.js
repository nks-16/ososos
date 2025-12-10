const { parseCommand } = require('../utils/parseCommand');
const cpService = require('../services/commandProcessor');
const workspaceService = require('../services/workspaceService');
const FileNode = require('../models/FileNode');
const Process = require('../models/Process');
const Workspace = require('../models/Workspace');


async function runCommand(req, res) {
  const raw = req.body.command;
  if (!raw) return res.status(400).json({ error: 'command required' });

  const user = req.user || null;

  // Resolve workspaceId: prefer req.workspace (attached by middleware) then user.workspaceId then body
  const workspaceId = (req.workspace && req.workspace._id) ? req.workspace._id.toString()
                    : (user && user.workspaceId) ? user.workspaceId.toString()
                    : (req.body && req.body.workspaceId) ? req.body.workspaceId : null;

  if (!workspaceId) return res.status(400).json({ output: '(empty)', error: 'No workspace' });

  // Load workspace (use req.workspace if already present to avoid extra DB hit)
  let workspace = req.workspace || await Workspace.findById(workspaceId);
  if (!workspace) return res.status(400).json({ output: '(empty)', error: 'Workspace not found' });

  // parse with our parser (now workspace is available for logging)
  let parsed;
  try {
    parsed = parseCommand(raw);
  } catch (err) {
    await workspaceService.logAction(workspace._id, user ? user._id : null, raw, err.message);
    return res.json({ output: `Error: ${err.message}`, newPrompt: workspace.cwd, newScore: workspace.score });
  }

  const wId = workspace._id;
  let output = '';
  const prevStage1 = !!workspace.flags && !!workspace.flags.stage1Complete;
  const prevStage2 = !!workspace.flags && !!workspace.flags.stage2Complete;

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
        output = await cpService.cmd_cd(workspace, m ? m[1] : '');
        break;
      }
      case 'cat': {
        const m = raw.match(/^cat\s+(.+)$/);
        output = await cpService.cmd_cat(wId, workspace.cwd, m ? m[1] : '');
        break;
      }
      case 'diff': {
        const m = raw.match(/^diff\s+(.+)\s+(.+)$/);
        output = await cpService.cmd_diff(wId, workspace.cwd, m ? m[1] : '', m ? m[2] : '');
        break;
      }
      case 'tar': {
        const m = raw.match(/^tar\s+-xvzf\s+(.+)$/);
        output = await cpService.cmd_tar_extract(wId, workspace.cwd, m ? m[1] : '');
        break;
      }
      case 'cp': {
        const m = raw.match(/^cp\s+(.+)\s+(.+)$/);
        output = await cpService.cmd_cp(wId, workspace.cwd, m ? m[1] : '', m ? m[2] : '');

        // Specific rule: detect cp mount.clean -> mount.conf and set flag that cp was done
       try {
  const src = m && m[1] ? m[1].trim() : '';
  const dst = m && m[2] ? m[2].trim() : '';

  // resolve full dst path
  const resolvePath = (p) => {
    if (!p) return '';
    if (p.startsWith('/')) return p;
    return (workspace.cwd === '/' ? `/${p}` : `${workspace.cwd}/${p}`);
  };
  const dstFull = resolvePath(dst);

  const isMountDst = dstFull.endsWith('/mount.conf') || dstFull === '/system/root/modules/fs/mount.conf';
  const inFsDir = workspace.cwd.includes('/modules/fs') || dstFull.includes('/modules/fs');

  // If user did cp to mount.conf, set a flag
  if (isMountDst && inFsDir) {
    workspace.flags = workspace.flags || {};
    workspace.flags.cpDone = true;
    console.log('✓ CP command executed to mount.conf');
  }
} catch (e) {
  // ignore detection errors
}
        break;
      }
      case 'chmod': {
        const m = raw.match(/^chmod\s+\+x\s+(.+)$/);
        output = await cpService.cmd_chmod(wId, workspace.cwd, m ? m[1] : '');
        break;
      }
      case 'run': {
        const m = raw.match(/^\.\/(.+)$/);
        output = await cpService.cmd_run(workspace, workspace.cwd, m ? m[1] : '');
        break;
      }
      case 'ps': {
        const forest = /--forest/.test(raw);
        output = await cpService.cmd_ps(wId, forest);
        break;
      }
      case 'lsof': {
        const m = raw.match(/^lsof\s+-p\s+(\d+)$/);
        output = await cpService.cmd_lsof(wId, parseInt(m ? m[1] : '0', 10));
        break;
      }
      case 'kill': {
        const m = raw.match(/^kill\s+-9\s+(\d+)$/);
        output = await cpService.cmd_kill(wId, parseInt(m ? m[1] : '0', 10));
        break;
      }
      case 'rm': {
        const m = raw.match(/^rm\s+(.+)$/);
        output = await cpService.cmd_rm(wId, workspace.cwd, m ? m[1] : '');
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
    workspace.score = (workspace.score || 0) - 1;
    console.log(`Command executed: "${raw}", New score: ${workspace.score}`);

    // Check Stage 1 completion after every command (if cp was done and all fragments collected)
    const prevStage1 = !!(workspace.flags && workspace.flags.stage1Complete);
    if (!prevStage1) {
      // Check if all fragments have been collected
      const fragAlpha = await FileNode.findOne({ workspaceId: wId, path: '/system/root/modules/fs/.secret.part' });
      const fragBetaNode = await FileNode.findOne({ workspaceId: wId, path: '/system/root/modules/fs/mount.clean' });
      const fragGamma = await FileNode.findOne({ workspaceId: wId, path: '/system/root/tmp/fragment3.txt' });
      const mountConf = await FileNode.findOne({ workspaceId: wId, path: '/system/root/modules/fs/mount.conf' });
      
      const hasAlpha = !!fragAlpha;
      const hasBeta = !!(fragBetaNode && fragBetaNode.content && fragBetaNode.content.includes('FRAG-BETA'));
      const hasGamma = !!fragGamma;
      const confRestored = !!(mountConf && mountConf.content && mountConf.content.includes('FRAG-BETA'));
      const cpDone = !!(workspace.flags && workspace.flags.cpDone);
      
      console.log('=== Stage 1 Check ===');
      console.log('Flags:', { hasAlpha, hasBeta, hasGamma, confRestored, cpDone, alreadyComplete: prevStage1 });
      console.log('=====================');
      
      if (hasAlpha && hasBeta && hasGamma && confRestored && cpDone) {
        console.log('✓✓✓ Stage 1 COMPLETING NOW! ✓✓✓');
        workspace.flags.stage1Complete = true;
        workspace.score = (workspace.score || 0) + 50;
        output = (output ? output + '\n' : '') + '\n[SUCCESS] Filesystem configuration restored.\nFragments collected successfully.\nStage 2 unlocked: Process Module - navigate to /modules/proc.\n';
      }
    }

    // After possible modifications above (stage1 awarding), check stage2 awarding:
    if (!prevStage2 && workspace.flags && workspace.flags.stage2Complete) {
      console.log('✓ Stage 2 COMPLETED! Round 1 finished.');
      workspace.score = (workspace.score || 0) + 50;
      if (!output.includes('[STAGE 2 COMPLETE]')) {
        output = (output ? output + '\n' : '') + '\n' + '='.repeat(60) + '\n[STAGE 2 COMPLETE] System fully restored!\n' + '='.repeat(60) + '\n\n✓ Malicious processes cleaned\n✓ +50 points awarded\n\n✓ ROUND 1 COMPLETE!\nTotal Score: ' + workspace.score + '\n\nReturning to main menu...\n';
      }
    }
    await workspace.save();
    
    // Update User's round1Score and totalScore in real-time
    if (user) {
      user.round1Score = workspace.score;
      user.totalScore = user.round1Score + user.round2Score + user.round3Score;
      await user.save();
      console.log(`Real-time score update for ${user.username}: round1=${user.round1Score}, total=${user.totalScore}`);
    }
  } catch (err) {
    console.error('Failed updating score:', err);
  }

  await workspaceService.logAction(workspace._id, user ? user._id : null, raw, output || '');
  const refreshed = await Workspace.findById(workspace._id);
  const completed = !!(refreshed.flags && refreshed.flags.stage2Complete);
  
  // Fetch updated user to get current totalScore
  let totalScore = 0;
  if (user) {
    const updatedUser = await require('../models/User').findById(user._id);
    totalScore = updatedUser ? updatedUser.totalScore : 0;
  }
  
  return res.json({ 
    output: output || '', 
    newPrompt: refreshed.cwd, 
    newScore: refreshed.score, 
    flags: refreshed.flags, 
    completed,
    totalScore // Include total score in response
  });
}

module.exports = { runCommand };
