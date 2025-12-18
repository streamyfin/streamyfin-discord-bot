function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours  }h ${  minutes  }m`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    document.getElementById('stats-content').innerHTML = `
      <div class="stat"><span>Status:</span><span class="stat-value">🟢 ${data.status}</span></div>
      <div class="stat"><span>Uptime:</span><span class="stat-value">${formatUptime(data.uptime)}</span></div>
      <div class="stat"><span>Commands Executed:</span><span class="stat-value">${data.commandsExecuted}</span></div>
      <div class="stat"><span>Errors Count:</span><span class="stat-value">${data.errorsCount}</span></div>
      <div class="stat"><span>RSS Items Processed:</span><span class="stat-value">${data.rssItemsProcessed}</span></div>
      <div class="stat"><span>RSS Feeds:</span><span class="stat-value">${data.rssFeeds}</span></div>
      <div class="stat"><span>Last Activity:</span><span class="stat-value">${formatDate(data.lastActivity)}</span></div>
    `;
  } catch {
    document.getElementById('stats-content').innerHTML = '<div style="color: red;">Failed to load stats</div>';
  }
}

async function loadCommands() {
  try {
    const response = await fetch('/api/commands');
    const data = await response.json();
    
    const content = data.slice(0, 10).map(cmd => 
      `<div class="stat"><span>/${cmd.name}</span><span class="stat-value">${cmd.count} uses</span></div>`
    ).join('');
    
    document.getElementById('commands-content').innerHTML = content || '<div>No commands executed yet</div>';
  } catch {
    document.getElementById('commands-content').innerHTML = '<div style="color: red;">Failed to load commands</div>';
  }
}

async function loadRSS() {
  try {
    const response = await fetch('/api/rss');
    const data = await response.json();
    
    const content = data.slice(0, 5).map(feed => 
      `<div class="stat">
         <span>${feed.type}</span>
         <span class="stat-value">${feed.status}</span>
       </div>`
    ).join('');
    
    document.getElementById('rss-content').innerHTML = content || '<div>No RSS feeds configured</div>';
  } catch {
    document.getElementById('rss-content').innerHTML = '<div style="color: red;">Failed to load RSS feeds</div>';
  }
}

async function loadLogs() {
  try {
    const response = await fetch('/api/logs?limit=5');
    const data = await response.json();
    
    const content = data.map(log => 
      `<div class="log-entry log-level-${log.level}">
         <strong>[${formatDate(log.timestamp)}]</strong> ${log.message}
       </div>`
    ).join('');
    
    document.getElementById('logs-content').innerHTML = content || '<div>No logs available</div>';
  } catch {
    document.getElementById('logs-content').innerHTML = '<div style="color: red;">Failed to load logs</div>';
  }
}

// Auto-refresh every 30 seconds
setInterval(() => {
  loadStats();
  loadCommands();
  loadRSS();
  loadLogs();
}, 30000);

// Load initial data
loadStats();
loadCommands();
loadRSS();
loadLogs();