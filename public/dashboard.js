/* global toggleAdmin, adminLogin, openPasswordModal, changePassword, restartBot, clearLogs, logout, closeAdminModal, closePasswordModal */

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours  }h ${  minutes  }m`;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

// Admin state management
let isAdminLoggedIn = false;

// Check auth status on page load
window.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  loadStats();
});

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (data.authenticated) {
      isAdminLoggedIn = true;
      updateAdminUI();
      loadProtectedData();
    } else {
      isAdminLoggedIn = false;
      updateAdminUI();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    isAdminLoggedIn = false;
    updateAdminUI();
  }
}

function toggleAdmin() {
  if (isAdminLoggedIn) {
    logout();
  } else {
    document.getElementById('admin-modal').style.display = 'flex';
  }
}

async function adminLogin(event) {
  event.preventDefault();
  const password = document.getElementById('admin-password').value;
  const statusDiv = document.getElementById('login-status');
  
  if (!password) {
    statusDiv.innerHTML = '<div class="error">Please enter password</div>';
    return;
  }
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      isAdminLoggedIn = true;
      updateAdminUI();
      closeAdminModal();
      loadProtectedData();
      statusDiv.innerHTML = '';
    } else {
      statusDiv.innerHTML = `<div class="error">${data.error || 'Login failed'}</div>`;
    }
  } catch (error) {
    console.error('Login error:', error);
    statusDiv.innerHTML = '<div class="error">Login failed</div>';
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    isAdminLoggedIn = false;
    updateAdminUI();
    document.getElementById('admin-controls').style.display = 'none';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function openPasswordModal() {
  document.getElementById('password-modal').style.display = 'flex';
}

function closePasswordModal() {
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('password-form').reset();
  document.getElementById('password-status').innerHTML = '';
}

async function changePassword(event) {
  event.preventDefault();
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const statusDiv = document.getElementById('password-status');
  
  if (newPassword !== confirmPassword) {
    statusDiv.innerHTML = '<div class="error">Passwords do not match</div>';
    return;
  }
  
  if (newPassword.length < 8) {
    statusDiv.innerHTML = '<div class="error">Password must be at least 8 characters</div>';
    return;
  }
  
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      statusDiv.innerHTML = '<div class="success">Password changed successfully. Please login again.</div>';
      setTimeout(() => {
        closePasswordModal();
        logout();
      }, 2000);
    } else {
      statusDiv.innerHTML = `<div class="error">${data.message || 'Password change failed'}</div>`;
    }
  } catch (error) {
    console.error('Change password error:', error);
    statusDiv.innerHTML = '<div class="error">Password change failed</div>';
  }
}

function closeAdminModal() {
  document.getElementById('admin-modal').style.display = 'none';
  document.getElementById('login-form').reset();
  document.getElementById('login-status').innerHTML = '';
}

function updateAdminUI() {
  const toggleBtn = document.getElementById('admin-toggle-btn');
  const changePasswordBtn = document.getElementById('change-password-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const statusSpan = document.getElementById('admin-status');
  const adminControls = document.getElementById('admin-controls');
  
  if (isAdminLoggedIn) {
    toggleBtn.style.display = 'none';
    changePasswordBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'inline-block';
    statusSpan.textContent = '✅ Admin';
    statusSpan.className = 'admin-status logged-in';
    if (adminControls) adminControls.style.display = 'block';
  } else {
    toggleBtn.style.display = 'inline-block';
    changePasswordBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
    statusSpan.textContent = '';
    statusSpan.className = 'admin-status';
    if (adminControls) adminControls.style.display = 'none';
  }
}

function loadProtectedData() {
  loadCommands();
  loadRSS();
  loadLogs();
}

async function restartBot() {
  if (!confirm('Are you sure you want to restart the bot? This will cause a brief interruption in service.')) {
    return;
  }
  
  const statusDiv = document.getElementById('admin-actions-status');
  statusDiv.innerHTML = '<div style="color: orange;">Restarting bot...</div>';
  
  try {
    const response = await fetch('/api/admin/restart', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      statusDiv.innerHTML = '<div style="color: green;">Bot restart initiated successfully</div>';
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 5000);
    } else {
      statusDiv.innerHTML = `<div style="color: red;">Restart failed: ${data.error}</div>`;
    }
  } catch (error) {
    statusDiv.innerHTML = '<div style="color: red;">Restart request failed</div>';
    console.error('Restart error:', error);
  }
}

async function clearLogs() {
  if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
    return;
  }
  
  const statusDiv = document.getElementById('admin-actions-status');
  statusDiv.innerHTML = '<div style="color: orange;">Clearing logs...</div>';
  
  try {
    const response = await fetch('/api/admin/clear-logs', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      statusDiv.innerHTML = '<div style="color: green;">Logs cleared successfully</div>';
      loadLogs(); // Refresh logs display
      setTimeout(() => {
        statusDiv.innerHTML = '';
      }, 3000);
    } else {
      statusDiv.innerHTML = `<div style="color: red;">Clear failed: ${data.error}</div>`;
    }
  } catch (error) {
    statusDiv.innerHTML = '<div style="color: red;">Clear logs request failed</div>';
    console.error('Clear logs error:', error);
  }
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