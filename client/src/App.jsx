import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Terminal from './components/Terminal';
import BankersAlgorithm from './components/BankersAlgorithm';
import Round3Quiz from './components/Round3Quiz';
import logo from './nisb-logo-white.png';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('oscape_token') || null);
  const [workspaceId, setWorkspaceId] = useState(localStorage.getItem('oscape_workspace') || null);
  const [username, setUsername] = useState(localStorage.getItem('oscape_username') || null);
  const [sessionId, setSessionId] = useState(localStorage.getItem('oscape_session') || null);
  const [currentRound, setCurrentRound] = useState(localStorage.getItem('oscape_round') || 'menu');
  const [progress, setProgress] = useState({
    round1Complete: false,
    round2Complete: false,
    round3Complete: false,
    round1Score: 0,
    round2Score: 0,
    round3Score: 0,
    totalScore: 0
  });

  useEffect(() => {
    if (username && token) {
      console.log('Fetching progress on mount for user:', username);
      fetchProgress();
    }
  }, [username, token]);
  
  // Also fetch progress when component mounts if already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('oscape_token');
    const storedUsername = localStorage.getItem('oscape_username');
    if (storedToken && storedUsername && !progress.totalScore) {
      console.log('Refreshing progress from localStorage on initial mount');
      fetchProgress();
    }
  }, []);
  
  // Update total score from command responses (no polling needed)
  const handleScoreUpdate = (newTotalScore) => {
    setProgress(prev => ({
      ...prev,
      totalScore: newTotalScore
    }));
  };

  const fetchProgress = async () => {
    try {
      const API_URL = 'https://ososos.onrender.com';
      const response = await fetch(`${API_URL}/api/progress/progress/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  const handleLogin = (t, ws, user, sid, prog) => {
    setToken(t);
    setWorkspaceId(ws);
    setUsername(user);
    setSessionId(sid);
    setProgress(prog || progress);
    localStorage.setItem('oscape_token', t);
    localStorage.setItem('oscape_workspace', ws);
    localStorage.setItem('oscape_username', user);
    localStorage.setItem('oscape_session', sid);
  };

  const handleLogout = () => {
    setToken(null);
    setWorkspaceId(null);
    setUsername(null);
    setSessionId(null);
    setCurrentRound('menu');
    localStorage.removeItem('oscape_token');
    localStorage.removeItem('oscape_workspace');
    localStorage.removeItem('oscape_username');
    localStorage.removeItem('oscape_session');
    localStorage.removeItem('oscape_round');
  };

  const selectRound = async (round) => {
    setCurrentRound(round);
    localStorage.setItem('oscape_round', round);
    // Refresh progress when returning to menu to show updated total score
    if (round === 'menu') {
      console.log('Returning to menu, refreshing progress...');
      await fetchProgress();
    }
  };

  const handleRoundComplete = async (round, score) => {
    console.log('handleRoundComplete called:', { round, score, username });
    try {
      const API_URL = 'https://ososos.onrender.com';
      const response = await fetch(`${API_URL}/api/progress/complete-round`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, round, score })
      });
      const data = await response.json();
      console.log('Round completion response:', data);
      
      // Update progress state immediately with the response data
      setProgress(data);
      console.log('Progress updated - Total Score:', data.totalScore);
      console.log('Redirecting to menu in 3 seconds...');
      
      // Redirect to menu after 3 seconds to show next round is unlocked
      setTimeout(() => {
        console.log('Redirecting to menu now');
        selectRound('menu');
      }, 3000);
    } catch (error) {
      console.error('Failed to complete round:', error);
    }
  };

  if (!token) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#071019' }}>
        <Login onLogin={(t, ws, user, sid, prog) => {
          handleLogin(t, ws, user, sid, prog);
        }} />
      </div>
    );
  }

  if (currentRound === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: '#071019', color: '#d6e1e8', padding: '40px 20px', position: 'relative' }}>
        <img src={logo} alt="NISB Logo" style={{ position: 'absolute', top: '20px', left: '20px', height: '40px' }} />
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ color: '#7dd3fc', fontSize: '3em', marginBottom: '10px' }}>OScape</h1>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: '#9fb7c3' }}>Welcome, {username}!</span>
              <span style={{ background: '#0ea5a4', color: '#012', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold' }}>
                Total Score: {progress.totalScore}
              </span>
              <button onClick={handleLogout} style={{ background: '#ff5f56', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {/* Round 1 Card */}
            <div 
              onClick={() => selectRound('round1')}
              style={{ 
                background: 'linear-gradient(180deg, #04121a, #021017)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px', 
                padding: '30px', 
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h2 style={{ color: '#7dd3fc', marginBottom: '10px' }}>Round 1</h2>
              <h3 style={{ color: '#9fb7c3', marginBottom: '15px', fontWeight: 'normal' }}>File System Navigation</h3>
              <p style={{ color: '#cfe6ee', lineHeight: '1.6', marginBottom: '20px' }}>
                Master Linux terminal commands and navigate through a virtual file system
              </p>
              {progress.round1Complete && (
                <div style={{ background: '#0ea5a4', color: '#012', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9em' }}>
                  COMPLETED - Score: {progress.round1Score}
                </div>
              )}
              <button style={{ marginTop: '15px', background: '#0ea5a4', color: '#012', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                Enter Round 1
              </button>
            </div>

            {/* Round 2 Card */}
            <div 
              onClick={() => progress.round1Complete && selectRound('round2')}
              style={{ 
                background: 'linear-gradient(180deg, #04121a, #021017)', 
                border: `1px solid ${progress.round1Complete ? 'rgba(255,255,255,0.1)' : 'rgba(255,95,86,0.3)'}`, 
                borderRadius: '8px', 
                padding: '30px', 
                cursor: progress.round1Complete ? 'pointer' : 'not-allowed',
                opacity: progress.round1Complete ? 1 : 0.6,
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => progress.round1Complete && (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {!progress.round1Complete && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff5f56', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' }}>
                  LOCKED
                </div>
              )}
              <h2 style={{ color: '#7dd3fc', marginBottom: '10px' }}>Round 2</h2>
              <h3 style={{ color: '#9fb7c3', marginBottom: '15px', fontWeight: 'normal' }}>Banker's Algorithm</h3>
              <p style={{ color: '#cfe6ee', lineHeight: '1.6', marginBottom: '20px' }}>
                Experiment with resource allocation and understand deadlock avoidance
              </p>
              {!progress.round1Complete && (
                <p style={{ color: '#ff5f56', fontSize: '0.9em', fontStyle: 'italic' }}>
                  Complete Round 1 to unlock
                </p>
              )}
              {progress.round2Complete && (
                <div style={{ background: '#0ea5a4', color: '#012', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9em' }}>
                  COMPLETED - Score: {progress.round2Score}
                </div>
              )}
              <button 
                disabled={!progress.round1Complete}
                style={{ 
                  marginTop: '15px', 
                  background: progress.round1Complete ? '#0ea5a4' : '#555', 
                  color: progress.round1Complete ? '#012' : '#999', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px', 
                  cursor: progress.round1Complete ? 'pointer' : 'not-allowed', 
                  fontWeight: 'bold', 
                  width: '100%' 
                }}
              >
                Enter Round 2
              </button>
            </div>

            {/* Round 3 Card */}
            <div 
              onClick={() => progress.round2Complete && selectRound('round3')}
              style={{ 
                background: 'linear-gradient(180deg, #04121a, #021017)', 
                border: `1px solid ${progress.round2Complete ? 'rgba(255,255,255,0.1)' : 'rgba(255,95,86,0.3)'}`, 
                borderRadius: '8px', 
                padding: '30px', 
                cursor: progress.round2Complete ? 'pointer' : 'not-allowed',
                opacity: progress.round2Complete ? 1 : 0.6,
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => progress.round2Complete && (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {!progress.round2Complete && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff5f56', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' }}>
                  LOCKED
                </div>
              )}
              <h2 style={{ color: '#7dd3fc', marginBottom: '10px' }}>Round 3</h2>
              <h3 style={{ color: '#9fb7c3', marginBottom: '15px', fontWeight: 'normal' }}>Comprehension Quiz</h3>
              <p style={{ color: '#cfe6ee', lineHeight: '1.6', marginBottom: '20px' }}>
                Test your understanding of concurrency and threading concepts
              </p>
              {!progress.round2Complete && (
                <p style={{ color: '#ff5f56', fontSize: '0.9em', fontStyle: 'italic' }}>
                  Complete Round 2 to unlock
                </p>
              )}
              {progress.round3Complete && (
                <div style={{ background: '#0ea5a4', color: '#012', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.9em' }}>
                  COMPLETED - Score: {progress.round3Score}
                </div>
              )}
              <button 
                disabled={!progress.round2Complete}
                style={{ 
                  marginTop: '15px', 
                  background: progress.round2Complete ? '#0ea5a4' : '#555', 
                  color: progress.round2Complete ? '#012' : '#999', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '4px', 
                  cursor: progress.round2Complete ? 'pointer' : 'not-allowed', 
                  fontWeight: 'bold', 
                  width: '100%' 
                }}
              >
                Enter Round 3
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRound === 'round1') {
    return (
      <div style={{ height: '100vh', background: '#071019' }}>
        <div style={{ background: '#333', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#7dd3fc' }}>Round 1: File System</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => selectRound('menu')} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              ← Back to Menu
            </button>
            <button onClick={handleLogout} style={{ background: '#ff5f56', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <Terminal 
          token={token} 
          workspaceId={workspaceId}
          username={username}
          onComplete={(score) => handleRoundComplete(1, score)}
          onScoreUpdate={handleScoreUpdate}
        />
      </div>
    );
  }

  if (currentRound === 'round2') {
    return (
      <div style={{ minHeight: '100vh', background: '#071019', padding: '20px' }}>
        <div style={{ background: '#333', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, color: '#7dd3fc' }}>Round 2: Banker's Algorithm</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => selectRound('menu')} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              ← Back to Menu
            </button>
            <button onClick={handleLogout} style={{ background: '#ff5f56', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <BankersAlgorithm 
          sessionId={sessionId} 
          username={username}
          onComplete={handleRoundComplete}
        />
      </div>
    );
  }

  if (currentRound === 'round3') {
    return (
      <div style={{ minHeight: '100vh', background: '#071019', padding: '20px' }}>
        <div style={{ background: '#333', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderRadius: '8px' }}>
          <h2 style={{ margin: 0, color: '#7dd3fc' }}>Round 3: Comprehension Quiz</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => selectRound('menu')} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              ← Back to Menu
            </button>
            <button onClick={handleLogout} style={{ background: '#ff5f56', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <Round3Quiz 
          sessionId={sessionId} 
          username={username}
          onComplete={handleRoundComplete}
        />
      </div>
    );
  }

  return null;
}
