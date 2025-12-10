import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import '../styles/terminal.css';
import logo from '../nisb-logo-white.png';

export default function Terminal({ token, username, onComplete, onScoreUpdate }) {
  const [lines, setLines] = useState([
    'Welcome to OScape v1',
    'Incident ID: FS-CRASH-8842',
    'A crash damaged the filesystem configuration.',
    'Explore the filesystem, inspect the FS directory, check the temporary folder for backups, and restore the configuration to proceed.',
    '',
    '/system/root$ '
  ]);
  const [cmd, setCmd] = useState('');
  const [cwd, setCwd] = useState('/system/root$');
  const [showCheat, setShowCheat] = useState(true);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]); // array of past commands
  const [historyIndex, setHistoryIndex] = useState(null); // null means not navigating
  const [completed, setCompleted] = useState(false);
  const areaRef = useRef();

  useEffect(()=>{ areaRef.current?.scrollTo(0, areaRef.current.scrollHeight); }, [lines]);

  // Fetch initial score from workspace on mount
  useEffect(() => {
    const fetchWorkspaceScore = async () => {
      try {
        const workspaceId = localStorage.getItem('oscape_workspace');
        if (workspaceId && token) {
          console.log('Fetching workspace score for:', workspaceId);
          const response = await fetch(`http://localhost:4000/api/progress/workspace/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          console.log('Workspace score data:', data);
          if (data.score !== undefined) {
            setScore(data.score);
          }
        }
      } catch (error) {
        console.error('Failed to fetch workspace score:', error);
      }
    };
    fetchWorkspaceScore();
  }, [token]);

  async function sendCmd(c) {
    if (typeof c !== 'string') return;
    const trimmed = c.trim();
    if (trimmed === '') {
      // still append blank command to mimic shell
      setLines(l => [...l, `$ ${c}`]);
      return;
    }

    // push to history
    setHistory(h => {
      const nh = [...h, c];
      // limit history length
      if (nh.length > 200) nh.shift();
      return nh;
    });
    setHistoryIndex(null);

    setLines(l => [...l, `$ ${c}`]);
    try {
      const res = await api.post('/commands', { command: c }, token);
      const out = res.output || '';
      if (out) setLines(l => [...l, out]);
      if (res.newPrompt) setCwd(res.newPrompt);
      if (typeof res.newScore !== 'undefined' && res.newScore !== null) {
        setScore(res.newScore);
        
        // Update total score in parent component if provided
        if (res.totalScore !== undefined && onScoreUpdate) {
          onScoreUpdate(res.totalScore);
        }
        
        // Check if round is completed (Stage 2 complete = Round 1 done)
        const roundCompleted = res.completed || (res.flags && res.flags.stage2Complete);
        console.log('Completion check:', { roundCompleted, completed: completed, flags: res.flags });
        if (roundCompleted && !completed) {
          console.log('✓ Round 1 completed! Triggering onComplete callback...');
          setCompleted(true);
          // Server already sent nice completion message, just trigger callback
          if (onComplete) {
            setTimeout(() => {
              console.log('→ Executing onComplete callback now');
              onComplete(res.newScore);
            }, 3000);
          }
        }
      }
    } catch (err) {
      setLines(l => [...l, `Error: ${err.response?.data?.error || err.message}`]);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      const value = cmd;
      setCmd('');
      sendCmd(value);
      e.preventDefault();
      return;
    }

    // Up arrow / Down arrow for history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(idx => {
        const h = history;
        if (h.length === 0) return null;
        const newIndex = (idx === null) ? (h.length - 1) : Math.max(0, idx - 1);
        setCmd(h[newIndex] || '');
        return newIndex;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(idx => {
        const h = history;
        if (h.length === 0) return null;
        if (idx === null) return null;
        const newIndex = Math.min(h.length - 1, idx + 1);
        const val = h[newIndex] || '';
        setCmd(val);
        // If we've moved past last, clear
        if (newIndex === h.length - 1) {
          // keep it
        }
        return newIndex;
      });
    }
  }

  const cheatSheetCommands = [
    { cat: 'Navigation', cmds: [
      { cmd: 'ls', desc: 'list files' },
      { cmd: 'ls -a', desc: 'list all (hidden)' },
      { cmd: 'cd <dir>', desc: 'to change directory' },
      { cmd: 'pwd', desc: 'Print working directory' }
    ]},
    { cat: 'File Operations', cmds: [
      { cmd: 'cat <file>', desc: 'read the contents of file' },
      { cmd: 'diff file1 file2', desc: 'to compare difference between 2 files' },
      { cmd: 'tar -xvzf file.tar.gz', desc: 'to extract from archives' },
      { cmd: 'cp src dst', desc: 'to copy the src file to dst file - can be used for restoration' }
    ]},
    { cat: 'Process Management', cmds: [
      { cmd: 'ps -ef', desc: 'to check the status of running processes' },
      { cmd: 'ps -ef --forest', desc: 'see the hierarchical relationship between processes' },
      { cmd: 'lsof -p <pid>', desc: 'To identify which processes have a specific file open' },
      { cmd: 'kill -9 <pid>', desc: 'To terminate or kill the process' }
    ]},
    { cat: 'Permissions', cmds: [
      { cmd: 'chmod +x <filename>', desc: 'to add executable permissions to the file' }
    ]},
    { cat: 'Execution', cmds: [
      { cmd: './<script>', desc: 'to run the script' }
    ]}
  ];

  return (
    <div className="terminal-page-container">
      <div className="terminal-main">
        <div className="terminal-box">
          <div className="term-header">
            <div className="term-buttons">
              <div className="term-dot close"></div>
              <div className="term-dot min"></div>
              <div className="term-dot max"></div>
            </div>
            <img src={logo} alt="NISB Logo" style={{ height: '24px', marginLeft: '10px' }} />
            <div className="header-center">Round 1: File System Navigation</div>
            <div className="header-right">
              <span className="username">{username || 'user'}</span>
              {completed && <span className="completed-badge">COMPLETED</span>}
              <span className="score">Score: {score === null ? 0 : score}</span>
            </div>
          </div>

          <div ref={areaRef} className="terminal-output">
            {lines.map((l,i) => <pre key={i} style={{ margin:0 }}>{l}</pre>)}
          </div>

          <div className="terminal-input-panel">
            <div className="terminal-prompt">{cwd}</div>
            <input
              value={cmd}
              onChange={e=>setCmd(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a command..."
              className="terminal-input"
              disabled={completed}
            />
            <button 
              onClick={async ()=>{ await sendCmd(cmd); setCmd(''); }} 
              className="terminal-enter-btn"
              disabled={completed}
            >
              Enter
            </button>
          </div>
        </div>
      </div>

      {showCheat && (
        <div className="cheatsheet-panel">
          <div className="cheatsheet-panel-header">
            <h3>Command Reference</h3>
          </div>
          <div className="cheatsheet-panel-content">
            {cheatSheetCommands.map((section, idx) => (
              <div key={idx} className="cheat-section">
                <div className="cheat-category">{section.cat}</div>
                {section.cmds.map((c, i) => (
                  <div key={i} className="cheat-item">
                    <code className="cheat-cmd">$ {c.cmd}</code>
                    <div className="cheat-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            ))}
            <div className="cheat-tip">
              <strong>Tip:</strong> Use arrow keys to navigate command history
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
