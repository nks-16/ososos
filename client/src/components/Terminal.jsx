import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import CheatSheet from './CheatSheet';

export default function Terminal({ token }) {
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
  const [showCheat, setShowCheat] = useState(false);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]); // array of past commands
  const [historyIndex, setHistoryIndex] = useState(null); // null means not navigating
  const areaRef = useRef();

  useEffect(()=>{ areaRef.current?.scrollTo(0, areaRef.current.scrollHeight); }, [lines]);

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
      if (typeof res.newScore !== 'undefined' && res.newScore !== null) setScore(res.newScore);
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

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'monospace' }}>
      <div style={{ width:280, background:'#071029', color:'#cbd5e1', padding:12 }}>
        <div style={{ marginBottom:12 }}>
          <button onClick={()=>setShowCheat(s=>!s)} style={{ padding:8 }}>{showCheat ? 'Hide' : 'Show'} Cheat-sheet</button>
        </div>
        {showCheat ? <CheatSheet onClose={()=>setShowCheat(false)} /> : <div style={{ fontSize:12 }}>Toggle cheat-sheet</div>}
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:12, color:'#9ca3af' }}>Score</div>
          <div style={{ fontSize:20, color:'#22c55e', marginTop:6 }}>{score === null ? '—' : score}</div>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div ref={areaRef} style={{ background:'#000', color:'#cbd5e1', padding:16, flex:1, overflowY:'auto', fontFamily:'monospace' }}>
          {lines.map((l,i) => <pre key={i} style={{ margin:0 }}>{l}</pre>)}
        </div>

        <div style={{ padding:12, display:'flex', gap:8, alignItems:'center', background:'#071029' }}>
          <div style={{ fontFamily:'monospace', color:'#cbd5e1' }}>{cwd}</div>
          <input
            value={cmd}
            onChange={e=>setCmd(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command..."
            style={{ flex:1, padding:8, background:'#0b1220', color:'#cbd5e1', border:'1px solid #253045' }}
          />
          <button onClick={async ()=>{ await sendCmd(cmd); setCmd(''); }}>Enter</button>
        </div>
      </div>
    </div>
  );
}
