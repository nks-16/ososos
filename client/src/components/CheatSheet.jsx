import React from 'react';

export default function CheatSheet({ onClose }) {
  return (
    <div style={{ padding:12 }}>
      <h3>Cheat-sheet</h3>
      <ul>
        <li><code>ls</code> — list files</li>
        <li><code>ls -a</code> — list all (hidden)</li>
        <li><code>cd &lt;dir&gt;</code></li>
        <li><code>pwd</code></li>
        <li><code>cat &lt;file&gt;</code></li>
        <li><code>diff file1 file2</code></li>
        <li><code>tar -xvzf file.tar.gz</code></li>
        <li><code>ps -ef</code> / <code>ps -ef --forest</code></li>
        <li><code>lsof -p &lt;pid&gt;</code></li>
        <li><code>kill -9 &lt;pid&gt;</code></li>
        <li><code>cp src dst</code></li>
        <li><code>chmod +x script.sh</code></li>
        <li><code>./cleanup.sh</code></li>
      </ul>
      <div style={{ marginTop:8 }}>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
