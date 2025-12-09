import React, { useState } from 'react';
import api from '../api';

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState('login');
  async function submit(e) {
    e.preventDefault();
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { username: user, password: pass });
        onLogin(res.token, res.workspaceId);
      } else {
        const res = await api.post('/auth/register', { username: user, password: pass });
        onLogin(res.token, res.workspaceId);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }
  return (
    <div style={{ margin:'auto', width:420, padding:20, background:'#0f1724', borderRadius:8 }}>
      <h2 style={{ margin:0, marginBottom:12 }}>OScape — Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom:8 }}>
          <input value={user} onChange={e=>setUser(e.target.value)} placeholder="username" style={{ width:'100%', padding:8 }} />
        </div>
        <div style={{ marginBottom:12 }}>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="password" style={{ width:'100%', padding:8 }} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" style={{ flex:1 }}>{mode === 'login' ? 'Login' : 'Register'}</button>
          <button type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Switch to Register':'Switch to Login'}</button>
        </div>
      </form>
    </div>
  );
}
