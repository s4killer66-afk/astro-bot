// Astro Bot Client App
let isPolling = false;
let currentBotActive = true;

// DOM Elements
const connBadge = document.getElementById('connBadge');
const connStatusText = document.getElementById('connStatusText');
const botBadge = document.getElementById('botBadge');
const botStatusText = document.getElementById('botStatusText');

const pairFormSection = document.getElementById('pairFormSection');
const connectedSection = document.getElementById('connectedSection');
const connectedPhoneDisplay = document.getElementById('connectedPhoneDisplay');

const phoneNumberInput = document.getElementById('phoneNumber');
const btnGetCode = document.getElementById('btnGetCode');
const codeDisplayArea = document.getElementById('codeDisplayArea');
const pairingCodeValue = document.getElementById('pairingCodeValue');
const btnCopyCode = document.getElementById('btnCopyCode');

const btnToggleBot = document.getElementById('btnToggleBot');
const btnLogout = document.getElementById('btnLogout');
const logsTerminal = document.getElementById('logsTerminal');
const toast = document.getElementById('toast');

// Direct Test Feedback
const directTestFeedback = document.getElementById('directTestFeedback');

// Show notification toast
function showToast(message, duration = 3000) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// Copy Pairing Code
btnCopyCode.addEventListener('click', () => {
  const code = pairingCodeValue.textContent.trim();
  if (code && code !== '---- ----') {
    navigator.clipboard.writeText(code.replace('-', ''));
    showToast('✅ Pairing code copied to clipboard!');
  }
});

// Request Pairing Code
btnGetCode.addEventListener('click', async () => {
  const phone = phoneNumberInput.value.trim().replace(/[^0-9]/g, '');
  if (!phone || phone.length < 10) {
    showToast('⚠️ Please enter a valid number with country code (e.g. 923418109808)');
    return;
  }

  btnGetCode.disabled = true;
  btnGetCode.innerHTML = '<span>Requesting Code...</span> ⏳';

  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (data.success && data.code) {
      pairingCodeValue.textContent = data.code;
      codeDisplayArea.classList.remove('hidden');
      showToast('🎉 Pairing code generated! Enter it in WhatsApp now.');
    } else {
      showToast('❌ Error: ' + (data.message || 'Could not get code'));
    }
  } catch (err) {
    showToast('❌ Network error: ' + err.message);
  } finally {
    btnGetCode.disabled = false;
    btnGetCode.innerHTML = '<span>Get 8-Digit Pairing Code</span> <span class="btn-arrow">⚡</span>';
  }
});

// Toggle Bot ON/OFF
btnToggleBot.addEventListener('click', async () => {
  const targetState = !currentBotActive;
  btnToggleBot.disabled = true;

  try {
    const res = await fetch('/api/bot-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: targetState }),
    });
    const data = await res.json();
    if (data.success) {
      currentBotActive = data.botActive;
      updateBotBadge(currentBotActive);
      showToast(`Bot is now ${currentBotActive ? '🟢 ON' : '🔴 OFF'}`);
    }
  } catch (e) {
    showToast('Failed to toggle bot: ' + e.message);
  } finally {
    btnToggleBot.disabled = false;
  }
});

// Unpair / Logout
btnLogout.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to unpair and disconnect this WhatsApp account?')) {
    return;
  }

  btnLogout.disabled = true;
  btnLogout.textContent = 'Disconnecting...';

  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully.');
      codeDisplayArea.classList.add('hidden');
      fetchStatus();
    }
  } catch (e) {
    showToast('Logout error: ' + e.message);
  } finally {
    btnLogout.disabled = false;
    btnLogout.textContent = 'Unpair / Disconnect Session';
  }
});

// Update Bot Badge
function updateBotBadge(isActive) {
  currentBotActive = isActive;
  if (isActive) {
    botBadge.className = 'status-badge bot-active';
    botStatusText.textContent = 'Bot: ON';
    btnToggleBot.textContent = 'Turn Bot OFF';
    btnToggleBot.className = 'btn btn-danger btn-small';
  } else {
    botBadge.className = 'status-badge bot-inactive';
    botStatusText.textContent = 'Bot: OFF';
    btnToggleBot.textContent = 'Turn Bot ON';
    btnToggleBot.className = 'btn btn-primary btn-small';
  }
}

// Render Logs in Terminal
function renderLogs(logs) {
  if (!logs || !logs.length) return;
  logsTerminal.innerHTML = '';
  logs.forEach((log) => {
    const row = document.createElement('div');
    row.className = `log-row log-${log.type}`;
    row.textContent = `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`;
    logsTerminal.appendChild(row);
  });
}

// Fetch Status from Backend
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (!data.success) return;

    // Update Connection Badge
    if (data.connected) {
      connBadge.className = 'status-badge connected';
      connStatusText.textContent = `Connected (${data.phone || 'Ready'})`;
      pairFormSection.classList.add('hidden');
      connectedSection.classList.remove('hidden');
      connectedPhoneDisplay.textContent = `Linked Number: ${data.phone || 'Connected'}`;
    } else {
      connBadge.className = 'status-badge disconnected';
      connStatusText.textContent = 'Disconnected';
      pairFormSection.classList.remove('hidden');
      connectedSection.classList.add('hidden');

      if (data.lastPairingCode && codeDisplayArea.classList.contains('hidden')) {
        pairingCodeValue.textContent = data.lastPairingCode;
        codeDisplayArea.classList.remove('hidden');
      }
    }

    // Update Bot Active State
    updateBotBadge(data.botActive);

    // Update Logs
    renderLogs(data.logs);
  } catch (err) {
    connBadge.className = 'status-badge disconnected';
    connStatusText.textContent = 'Server Offline';
  }
}

// Poll status every 3 seconds
setInterval(fetchStatus, 3000);
fetchStatus();

// ==========================================
// SIMULATOR LOGIC
// ==========================================
const simMessages = document.getElementById('simMessages');
const simInput = document.getElementById('simInput');

function clearSimChat() {
  simMessages.innerHTML = '';
}

function scrollToBottom() {
  simMessages.scrollTop = simMessages.scrollHeight;
}

function appendUserBubble(text) {
  const msg = document.createElement('div');
  msg.className = 'msg user-msg';
  msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  simMessages.appendChild(msg);
  scrollToBottom();
}

function appendBotBubble(htmlContent) {
  const msg = document.createElement('div');
  msg.className = 'msg bot-msg';
  msg.innerHTML = `<div class="msg-bubble">${htmlContent}</div>`;
  simMessages.appendChild(msg);
  scrollToBottom();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatWhatsAppText(text) {
  let formatted = escapeHtml(text);
  // Bold *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Italic _text_
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  // Monospace `text`
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  // Newlines
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

async function runSimCommand(cmd) {
  appendUserBubble(cmd);

  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    });
    const data = await res.json();

    if (data.type === 'image') {
      appendBotBubble(`
        <small style="color: #00d2ff; font-weight: 600;">[Image Sent - No Mentions]</small><br>
        <img src="${data.imageUrl}" alt="${data.title}" />
      `);
    } else {
      appendBotBubble(formatWhatsAppText(data.response));
    }
  } catch (e) {
    appendBotBubble(`<em>Error: ${e.message}</em>`);
  }
}

function submitSim() {
  const cmd = simInput.value.trim();
  if (!cmd) return;
  simInput.value = '';
  runSimCommand(cmd);
}

// Send Real Test to WhatsApp Phone
async function sendRealTest(cmd) {
  directTestFeedback.style.color = '#ff9100';
  directTestFeedback.textContent = `Sending test ${cmd} to your WhatsApp...`;

  try {
    const res = await fetch('/api/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    });
    const data = await res.json();
    if (data.success) {
      directTestFeedback.style.color = '#00e676';
      directTestFeedback.textContent = `✅ ${data.message} Check your WhatsApp!`;
      showToast(`✅ ${data.message}`);
    } else {
      directTestFeedback.style.color = '#ff3366';
      directTestFeedback.textContent = `❌ ${data.message}`;
      showToast(`❌ ${data.message}`);
    }
  } catch (err) {
    directTestFeedback.style.color = '#ff3366';
    directTestFeedback.textContent = `❌ Failed: ${err.message}`;
  }
}

window.runSimCommand = runSimCommand;
window.submitSim = submitSim;
window.clearSimChat = clearSimChat;
window.sendRealTest = sendRealTest;
