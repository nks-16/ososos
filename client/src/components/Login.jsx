import React, { useState } from 'react';
import api from '../api';
import '../styles/auth.css';

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { username: user, password: pass });
        onLogin(res.token, res.workspaceId, res.username, res.sessionId, res.progress);
      } else {
        const res = await api.post('/auth/register', { username: user, password: pass });
        onLogin(res.token, res.workspaceId, res.username, res.sessionId, res.progress);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="terminal-box auth-box">
        {/* Terminal Header */}
        <div className="term-header">
          <div className="term-buttons">
            <div className="term-dot close" />
            <div className="term-dot min" />
            <div className="term-dot max" />
          </div>
          <div className="header-center">OSCAPE - {mode === 'login' ? 'Login' : 'Register'}</div>
        </div>

        {/* Terminal Content */}
        <div className="term-content auth-content">
          <div className="auth-welcome">
            <div className="ascii-art">
              {`   ___  ____                           
  / _ \/ ___|  ___ __ _ _ __   ___ 
 | | | \___ \ / __/ _\` | '_ \ / _ \\
 | |_| |___) | (_| (_| | |_) |  __/
  \___/|____/ \___\__,_| .__/ \___|
                                    |_|         `}
            </div>
            <p className="welcome-text">
              Welcome to OSCAPE! Master operating system concepts through interactive challenges.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">!</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="auth-form">
            <div className="terminal-prompt">
              {mode === 'login' ? 'user@oscape:~$' : 'new-user@oscape:~$'} authenticate
            </div>

            <div className="form-group">
              <label className="form-label">
                USERNAME
              </label>
              <input 
                type="text"
                value={user} 
                onChange={e=>setUser(e.target.value)} 
                placeholder="Enter username" 
                className="terminal-input"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                PASSWORD
              </label>
              <input 
                type="password" 
                value={pass} 
                onChange={e=>setPass(e.target.value)} 
                placeholder="Enter password" 
                className="terminal-input"
                required
                disabled={loading}
              />
            </div>

            <div className="auth-actions">
              <button type="submit" className="auth-button primary" disabled={loading}>
                {loading ? 'Processing...' : (mode === 'login' ? '> LOGIN' : '> REGISTER')}
              </button>
              <button 
                type="button" 
                onClick={()=>{setMode(mode==='login'?'register':'login'); setError('');}} 
                className="auth-button secondary"
                disabled={loading}
              >
                {mode==='login' ? 'Need an account?' : 'Already have account?'}
              </button>
            </div>
          </form>
        </div>

        {/* Terminal Footer */}
        <div className="term-footer">
          <div>Authentication Terminal</div>
          <div style={{ opacity: 0.8 }}>OScape v1.0</div>
        </div>
      </div>
    </div>
  );
}
