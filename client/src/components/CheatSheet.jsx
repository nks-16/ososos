import React from 'react';
import '../styles/cheatsheet.css';

export default function CheatSheet({ onClose }) {
  const commands = [
    { cmd: 'ls', desc: 'List files in current directory', category: 'Navigation' },
    { cmd: 'ls -a', desc: 'List all files including hidden ones', category: 'Navigation' },
    { cmd: 'cd <dir>', desc: 'Change to specified directory', category: 'Navigation' },
    { cmd: 'pwd', desc: 'Print working directory', category: 'Navigation' },
    { cmd: 'cat <file>', desc: 'Display file contents', category: 'File Operations' },
    { cmd: 'diff file1 file2', desc: 'Compare two files', category: 'File Operations' },
    { cmd: 'tar -xvzf file.tar.gz', desc: 'Extract compressed archive', category: 'File Operations' },
    { cmd: 'grep <pattern> <file>', desc: 'Search for pattern in file', category: 'File Operations' },
    { cmd: 'ps -ef', desc: 'List all running processes', category: 'Process Management' },
    { cmd: 'ps -ef --forest', desc: 'Show process tree', category: 'Process Management' },
    { cmd: 'lsof -p <pid>', desc: 'List open files by process', category: 'Process Management' },
    { cmd: 'kill -9 <pid>', desc: 'Force kill a process', category: 'Process Management' },
    { cmd: 'cp src dst', desc: 'Copy file from source to destination', category: 'File Operations' },
    { cmd: 'chmod +x script.sh', desc: 'Make file executable', category: 'Permissions' },
    { cmd: './cleanup.sh', desc: 'Execute script in current directory', category: 'Execution' }
  ];

  const categories = [...new Set(commands.map(c => c.category))];

  return (
    <div className="cheatsheet-overlay" onClick={onClose}>
      <div className="cheatsheet-box" onClick={e => e.stopPropagation()}>
        {/* Terminal Header */}
        <div className="term-header">
          <div className="term-buttons">
            <div className="term-dot close" onClick={onClose} />
            <div className="term-dot min" />
            <div className="term-dot max" />
          </div>
          <div className="header-center">Command Reference</div>
          <div className="header-right">
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="term-content cheatsheet-content">
          <div className="cheatsheet-intro">
            <span className="prompt">user@os-escape:~$</span> help
            <p>Available commands for Round 1: File System Navigation</p>
          </div>

          {categories.map(category => (
            <div key={category} className="command-category">
              <h3 className="category-title">{category}</h3>
              <div className="command-grid">
                {commands.filter(c => c.category === category).map((item, idx) => (
                  <div key={idx} className="command-item">
                    <div className="command-syntax">
                      <span className="prompt-icon">$</span>
                      <code className="command-code">{item.cmd}</code>
                    </div>
                    <div className="command-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="cheatsheet-tip">
            <span className="tip-icon">💡</span>
            <strong>Tip:</strong> Type commands exactly as shown. Use Tab for auto-completion where supported.
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="term-footer">
          <div>Command Reference Guide</div>
          <div>Press ESC or click outside to close</div>
        </div>
      </div>
    </div>
  );
}
