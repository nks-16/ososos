import React, { useState } from 'react';
import Login from './components/Login';
import Terminal from './components/Terminal';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('oscape_token') || null);
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('oscape_workspace') || null);

  return (
    <div style={{ height: '100vh', display:'flex', flexDirection:'column' }}>
      {!token ? <Login onLogin={(t, ws)=>{ setToken(t); setWorkspaceId(ws); localStorage.setItem('oscape_token', t); localStorage.setItem('oscape_workspace', ws); }} /> : <Terminal token={token} workspaceId={workspaceId} />}
    </div>
  );
}
