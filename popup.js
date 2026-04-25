// Popup script for VoxFlow settings & history

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('apiKey');
  const statusMessage = document.getElementById('status-message');
  const autoInsertToggle = document.getElementById('autoInsert');
  const livePreviewToggle = document.getElementById('livePreview');
  const lightModeToggle = document.getElementById('lightMode');
  const modeLabel = document.getElementById('mode-label');
  const modeDesc = document.getElementById('mode-desc');
  
  // ── Tab Navigation ──
  document.querySelectorAll('.vpr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.vpr-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.vpr-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'history') loadHistory();
    });
  });

  // ── Load Settings ──
  chrome.storage.sync.get(['groqApiKey', 'selectedTemplate', 'autoInsert', 'livePreview', 'lightMode'], (result) => {
    if (result.groqApiKey) apiKeyInput.value = result.groqApiKey;
    
    const template = result.selectedTemplate || 'ai-prompt';
    document.querySelectorAll('.vpr-template-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.template === template);
    });
    
    autoInsertToggle.checked = result.autoInsert || false;
    livePreviewToggle.checked = result.livePreview || false;
    lightModeToggle.checked = result.lightMode || false;
    
    updateModeLabel(result.lightMode || false);
    if (result.lightMode) document.body.classList.add('vpr-light');
  });

  // ── Template Selection ──
  document.querySelectorAll('.vpr-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vpr-template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── Mode Toggle ──
  function updateModeLabel(isLight) {
    if (isLight) {
      modeLabel.textContent = 'Dark Mode';
      modeDesc.textContent = 'Switch to dark appearance';
    } else {
      modeLabel.textContent = 'Light Mode';
      modeDesc.textContent = 'Switch to light appearance';
    }
  }

  lightModeToggle.addEventListener('change', () => {
    const isLight = lightModeToggle.checked;
    document.body.classList.toggle('vpr-light', isLight);
    updateModeLabel(isLight);
  });

  // ── Save Settings ──
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) { showStatus('Please enter an API key', 'error'); return; }
    if (!apiKey.startsWith('gsk_')) { showStatus('Key should start with "gsk_"', 'error'); return; }
    
    const activeTemplate = document.querySelector('.vpr-template-btn.active');
    const selectedTemplate = activeTemplate ? activeTemplate.dataset.template : 'ai-prompt';
    
    chrome.storage.sync.set({
      groqApiKey: apiKey,
      selectedTemplate,
      autoInsert: autoInsertToggle.checked,
      livePreview: livePreviewToggle.checked,
      lightMode: lightModeToggle.checked
    }, () => {
      showStatus('✓ Settings saved!', 'success');
      setTimeout(() => window.close(), 1500);
    });
  });

  // ── Test Recording ──
  document.getElementById('test-recording-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleRecording" }, (response) => {
          if (chrome.runtime.lastError) {
            showStatus('Navigate to a website first', 'error');
          } else {
            window.close();
          }
        });
      }
    });
  });

  // ── History ──
  function loadHistory() {
    chrome.storage.local.get(['voxflowHistory'], (result) => {
      const history = result.voxflowHistory || [];
      const listEl = document.getElementById('history-list');
      const clearBtn = document.getElementById('clear-history-btn');
      
      if (history.length === 0) {
        listEl.innerHTML = `<div class="vpr-history-empty"><p>No recordings yet</p><p class="vpr-hint">Your refined prompts will appear here</p></div>`;
        clearBtn.style.display = 'none';
        return;
      }
      
      clearBtn.style.display = 'block';
      
      listEl.innerHTML = history.map(entry => {
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const words = entry.refined.trim().split(/\s+/).length;
        const preview = entry.refined.length > 80 ? entry.refined.substring(0, 80) + '...' : entry.refined;
        
        return `
          <div class="vpr-history-item">
            <div class="vpr-history-meta">
              <span class="vpr-history-time">${timeStr}</span>
              <span class="vpr-history-words">${words}w</span>
            </div>
            <div class="vpr-history-text">${escapeHtml(preview)}</div>
            <div class="vpr-history-actions">
              <button class="vpr-history-copy" data-text="${escapeAttr(entry.refined)}">Copy</button>
              <button class="vpr-history-delete" data-id="${entry.id}">Delete</button>
            </div>
          </div>`;
      }).join('');
      
      listEl.querySelectorAll('.vpr-history-copy').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.text).then(() => {
            btn.textContent = '✓';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
          });
        });
      });
      
      listEl.querySelectorAll('.vpr-history-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.id);
          chrome.storage.local.get(['voxflowHistory'], (result) => {
            const updated = (result.voxflowHistory || []).filter(e => e.id !== id);
            chrome.storage.local.set({ voxflowHistory: updated }, () => loadHistory());
          });
        });
      });
    });
  }
  
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    chrome.storage.local.set({ voxflowHistory: [] }, () => {
      loadHistory();
      showStatus('History cleared', 'success');
    });
  });

  // ── Helpers ──
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 4000);
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
});
