import { useState } from 'react';
import '../styles/auth.css';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful - call parent callback
        if (onRegister) {
          onRegister(data);
        }
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Server connection failed. Please try again later.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="term-header">
          <div className="term-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="term-title">register.sh</div>
        </div>

        <div className="term-content auth-content">
          <div className="auth-welcome">
            <pre className="ascii-art">{`
 ╔═══════════════════════════════════════╗
 ║   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   ║
 ║   █░░░░░░░░░░░ SYSTEM INIT ░░░░░░█   ║
 ║   █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█   ║
 ╚═══════════════════════════════════════╝
            `}</pre>
            <p className="welcome-text">
              Initialize new user account for OSCAPE training system
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                Username
              </label>
              <input
                type="text"
                className="terminal-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (min 3 characters)"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                className="terminal-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                className="terminal-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="terminal-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="auth-actions">
              <button 
                type="submit" 
                className="auth-button primary"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="term-footer">
          <span>STATUS: {loading ? 'REGISTERING...' : 'READY'}</span>
          <span>MODE: USER_INIT</span>
        </div>
      </div>
    </div>
  );
}

export default Register;
