import React, { useState, useEffect } from 'react';
import '../styles/bankers.css'; 

export default function BankersAlgorithm({ sessionId, username, onComplete }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [request, setRequest] = useState([]);
  const [safetyResult, setSafetyResult] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeGame();
  }, [sessionId]);

  const initializeGame = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/bankers/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await response.json();
      setState(data.state);
      setRequest(new Array(data.state.resources.length).fill(0));
      setMessage(data.message);
      setLoading(false);
    } catch (error) {
      setMessage('Error initializing Round 2: ' + error.message);
      setLoading(false);
    }
  };

  const handleCheckSafety = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/bankers/check-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const result = await response.json();
      setSafetyResult(result);
      
      // Refresh complete state
      const stateResponse = await fetch(`http://localhost:4000/api/bankers/state/${sessionId}`);
      const updatedState = await stateResponse.json();
      setState(updatedState);
      
      setMessage(result.safe 
        ? `SAFE STATE detected. Sequence: [${(result.safeSequence || []).join(' -> ')}]` 
        : `UNSAFE STATE detected. No safe sequence found.`);
    } catch (error) {
      setMessage('Error checking safety: ' + error.message);
    }
  };

  const handleRequestResources = async () => {
    if (selectedProcess === null) {
      setMessage('ERROR: Please select a process first.');
      return;
    }

    const requestInts = request.map(val => parseInt(val) || 0);
    const hasValidRequest = requestInts.some(val => val > 0);
    if (!hasValidRequest) {
      setMessage('ERROR: Request must be greater than zero for at least one resource.');
      return;
    }

    const exceedsAvailable = requestInts.some((val, idx) => val > state.available[idx]);
    if (exceedsAvailable) {
      setMessage('ERROR: Request exceeds available resources.');
      return;
    }

    const need = calculateNeed(selectedProcess);
    const exceedsNeed = requestInts.some((val, idx) => val > need[idx]);
    if (exceedsNeed) {
      setMessage('ERROR: Request exceeds process maximum need.');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/bankers/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, processIndex: selectedProcess, request: requestInts })
      });
      const result = await response.json();
      
      // Refresh state
      const stateResponse = await fetch(`http://localhost:4000/api/bankers/state/${sessionId}`);
      const updatedState = await stateResponse.json();
      setState(updatedState);
      
      if (result.granted) {
        setSafetyResult(result.safetyCheck);

        if (updatedState.completed) {
          setMessage(`ALL PROCESSES COMPLETED. Final Score: ${updatedState.score}. Round 2 terminated.`);
          if (onComplete) onComplete(2, updatedState.score);
        } else {
          setMessage(`Request granted for ${state.processes[selectedProcess]}. System remains safe.`);
        }
        setRequest(new Array(updatedState.resources.length).fill(0));
      } else {
        setMessage(`Request denied for ${state.processes[selectedProcess]}: ${result.reason}`);
        setSafetyResult(result.safetyCheck);
      }
    } catch (error) {
      setMessage('ERROR: ' + error.message);
    }
  };

  const calculateNeed = (processIndex) => {
    if (!state) return [];
    const resourcesLen = Array.isArray(state.resources) ? state.resources.length : 0;
    const need = new Array(resourcesLen).fill(0);
    if (!Array.isArray(state.maxDemand) || !Array.isArray(state.allocation)) return need;
    const maxRow = state.maxDemand[processIndex] || new Array(resourcesLen).fill(0);
    const allocRow = state.allocation[processIndex] || new Array(resourcesLen).fill(0);
    for (let j = 0; j < resourcesLen; j++) {
      need[j] = (maxRow[j] || 0) - (allocRow[j] || 0);
    }
    return need;
  };

  if (loading) {
    return (
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="traffic-lights">
            <span className="red"></span>
            <span className="yellow"></span>
            <span className="green"></span>
          </div>
          <div className="header-title">Round 2: Banker's Algorithm</div>
        </div>
        <div className="terminal-content">
          <div className="loading">Loading Round 2...</div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="traffic-lights">
            <span className="red"></span>
            <span className="yellow"></span>
            <span className="green"></span>
          </div>
          <div className="header-title">Round 2: Banker's Algorithm</div>
        </div>
        <div className="terminal-content">
          <div className="error">FATAL ERROR: Failed to load Round 2</div>
        </div>
      </div>
    );
  }

  const formatArray = (arr) => {
    if (!Array.isArray(arr)) return '[]';
    return `[${arr.join(', ')}]`;
  };

  const getMessageClass = (msg) => {
    if (!msg) return 'info-text';
    const lower = msg.toLowerCase();
    if (lower.includes('error') || lower.includes('denied')) return 'error-text';
    if (lower.includes('granted') || lower.includes('completed') || lower.includes('safe')) return 'success-text';
    return 'info-text';
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="traffic-lights">
          <span className="red"></span>
          <span className="yellow"></span>
          <span className="green"></span>
        </div>
        <div className="header-title">Round 2: Banker's Algorithm</div>
        <div className="score-info">
          User: {username} | Score: {state.score}
          {state.completed && <span className="completed-badge"> | <span className="green-text">COMPLETED</span></span>}
        </div>
      </div>
      
      <div className="terminal-content">
        <div className="terminal-prompt">
          /system/banker$ <span className="command-output">
            {state.completed ? 'COMPLETED: All processes finished.' : 'Connected'}
          </span>
        </div>
        
        <div className="terminal-section">
          <span className="prompt-label">SYSTEM STATE:</span>
          <table className="terminal-table">
            <thead>
              <tr>
                <th className="table-header">Process</th>
                <th className="table-header">Allocated ({(state.resources || []).join(', ')})</th>
                <th className="table-header">Max Demand ({(state.resources || []).join(', ')})</th>
              </tr>
            </thead>
            <tbody>
              {(state.processes || []).map((proc, i) => {
                const need = calculateNeed(i);
                const isSelected = selectedProcess === i;
                const allocRow = (state.allocation && state.allocation[i]) || [];
                const isCompleted = need.every(n => n === 0) && allocRow.some(a => a > 0);

                return (
                  <tr 
                    key={proc} 
                    className={`terminal-row ${isSelected ? 'selected-row' : ''} ${isCompleted ? 'completed-row' : ''}`}
                    onClick={() => setSelectedProcess(i)}
                  >
                    <td className="process-cell">
                      <span className={`process-name-cmd ${isSelected ? 'blink' : ''}`}>{proc}</span>
                    </td>
                    <td>{formatArray(allocRow)}</td>
                    <td>{formatArray((state.maxDemand && state.maxDemand[i]) || [])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="terminal-section resource-status">
          <span className="prompt-label">AVAILABLE RESOURCES:</span>
          {(state.resources || []).map((res, j) => (
            <span key={res} className="resource-stat">
              <span className="resource-name-cmd">{res}:</span> <span className="resource-value">{state.available[j]}</span> 
            </span>
          ))}
        </div>

        <div className="terminal-command-panel">
          <div className="terminal-prompt-input">
            /system/banker$ request <span className="info-text">{selectedProcess !== null ? state.processes[selectedProcess] : '<SELECT_PROCESS>'}</span>
          </div>
          
          <div className="request-inputs-cmd">
            {(state.resources || []).map((res, j) => (
              <div key={res} className="input-group-cmd">
                <label className="input-label-cmd">{res}=</label>
                <input
                  type="number"
                  min="0"
                  value={request[j] || 0}
                  onChange={(e) => {
                    const newRequest = [...request];
                    newRequest[j] = parseInt(e.target.value) || 0;
                    setRequest(newRequest);
                  }}
                  disabled={selectedProcess === null}
                  className="terminal-input"
                />
              </div>
            ))}
          </div>
          
          <button 
            className="terminal-action-button primary-cmd"
            onClick={handleRequestResources}
            disabled={selectedProcess === null || state.completed}
          >
            EXECUTE REQUEST
          </button>

          {message && (
            <div className={`message-output request-alert ${getMessageClass(message)}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
