import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import '../styles/terminal.css';

export default function Terminal({ token, username, onComplete }) {
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
          const response = await fetch(`http://localhost:4000/api/progress/workspace/${workspaceId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
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
        // Check if round is completed
        if (res.completed && !completed) {
          setCompleted(true);
          setLines(l => [...l, '', 'Round 1 Complete!', `Final Score: ${res.newScore}`, '']);
          if (onComplete) {
            setTimeout(() => onComplete(res.newScore), 2000);
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
      { cmd: 'ls', desc: 'List directory contents' },
      { cmd: 'cd <path>', desc: 'Change directory' },
      { cmd: 'pwd', desc: 'Print working directory' }
    ]},
    { cat: 'File Operations', cmds: [
      { cmd: 'touch <file>', desc: 'Create new file' },
      { cmd: 'cat <file>', desc: 'Display file contents' },
      { cmd: 'mkdir <dir>', desc: 'Create directory' },
      { cmd: 'rm <path>', desc: 'Remove file/directory' }
    ]},
    { cat: 'Process', cmds: [
      { cmd: 'ps', desc: 'List processes' },
      { cmd: 'kill <pid>', desc: 'Terminate process' }
    ]},
    { cat: 'Permissions', cmds: [
      { cmd: 'chmod <mode> <file>', desc: 'Change permissions' }
    ]},
    { cat: 'Execution', cmds: [
      { cmd: './script.sh', desc: 'Execute script' }
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
