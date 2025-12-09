// Strict command parser (returns {name, args} or throws Error)
function parseCommand(raw) {
  const s = raw.trim();

  // Patterns
  const patterns = [
    { name: 'ls', re: /^ls(\s+-a)?(\s+(.+))?$/ },
    { name: 'cd', re: /^cd\s+(.+)$/ },
    { name: 'pwd', re: /^pwd$/ },
    { name: 'cat', re: /^cat\s+(.+)$/ },
    { name: 'diff', re: /^diff\s+(.+)\s+(.+)$/ },
    { name: 'tar', re: /^tar\s+-xvzf\s+(.+)$/ },
    { name: 'ps', re: /^ps\s+-ef(\s+--forest)?$/ },
    { name: 'lsof', re: /^lsof\s+-p\s+(\d+)$/ },
    { name: 'netstat', re: /^netstat\s+-tulpen$/ },
    { name: 'kill', re: /^kill\s+-9\s+(\d+)$/ },
    { name: 'cp', re: /^cp\s+(.+)\s+(.+)$/ },
    { name: 'chmod', re: /^chmod\s+\+x\s+(.+)$/ },
    { name: 'run', re: /^\.\/(.+)$/ },
    { name: 'rm', re: /^rm\s+(.+)$/ }
  ];

  for (const p of patterns) {
    const m = s.match(p.re);
    if (m) {
      return { name: p.name, rawMatch: m, text: s };
    }
  }
  throw new Error('Command not allowed or invalid syntax');
}

module.exports = { parseCommand };
