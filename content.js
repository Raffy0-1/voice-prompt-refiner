// Content script injected into all webpages — VoxFlow

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let overlayElement = null;
let activeInputElement = null;
let recognition = null;
let recordingTimer = null;
let recordingStartTime = null;

// Drag state
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleRecording") {
    toggleRecording();
  }
});

// Initialize
function init() {
  document.addEventListener('focusin', (e) => {
    if (isInputElement(e.target)) activeInputElement = e.target;
  });
  document.addEventListener('click', (e) => {
    if (isInputElement(e.target)) activeInputElement = e.target;
  });
}

function isInputElement(element) {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  const type = element.type?.toLowerCase();
  return (
    (tagName === 'input' && (type === 'text' || type === 'search' || type === 'email' || !type)) ||
    tagName === 'textarea' ||
    element.contentEditable === 'true' ||
    element.getAttribute('role') === 'textbox'
  );
}

// ── Recording Timer ──
function startTimer() {
  recordingStartTime = Date.now();
  updateTimerDisplay();
  recordingTimer = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  const elapsed = Date.now() - recordingStartTime;
  const seconds = Math.floor(elapsed / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timerEl = document.getElementById('vpr-timer');
  if (timerEl) timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function stopTimer() {
  if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null; }
}

// ── Live Transcription (opt-in) ──
function startLiveTranscription() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript + ' ';
      else interim += transcript;
    }
    const liveTextEl = document.getElementById('vpr-live-text');
    if (liveTextEl) {
      const displayText = (final + interim).trim();
      liveTextEl.textContent = displayText || 'Listening...';
    }
  };
  
  recognition.onerror = () => {};
  try { recognition.start(); } catch (e) {}
}

function stopLiveTranscription() {
  if (recognition) { try { recognition.stop(); } catch (e) {} recognition = null; }
}

// ── Toggle ──
function toggleRecording() {
  if (isRecording) stopRecording();
  else startRecording();
}

// ── Start Recording ──
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];
    
    mediaRecorder.addEventListener('dataavailable', (event) => audioChunks.push(event.data));
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await processAudio(audioBlob);
      stream.getTracks().forEach(track => track.stop());
    });
    
    mediaRecorder.start();
    isRecording = true;
    
    // Check if live preview is enabled
    const settings = await new Promise(r => chrome.storage.sync.get(['livePreview'], r));
    showOverlay('recording', '', settings.livePreview || false);
    startTimer();
    if (settings.livePreview) startLiveTranscription();
    
  } catch (error) {
    let errorMessage = 'Microphone access denied.';
    if (error.name === 'NotAllowedError') errorMessage = 'Microphone permission denied. Allow it in site settings.';
    else if (error.name === 'NotFoundError') errorMessage = 'No microphone found.';
    showOverlay('error', errorMessage);
  }
}

// ── Stop Recording ──
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    stopTimer();
    stopLiveTranscription();
    showOverlay('processing');
  }
}

// ── Process Audio ──
async function processAudio(audioBlob) {
  try {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      chrome.runtime.sendMessage(
        { action: 'transcribeAudio', audioBlob: reader.result },
        async (response) => {
          if (chrome.runtime.lastError) {
            showOverlay('error', 'Connection error: ' + chrome.runtime.lastError.message);
            return;
          }
          if (response && response.success) {
            const settings = await new Promise(r => chrome.storage.sync.get(['autoInsert'], r));
            if (settings.autoInsert && activeInputElement) {
              doInsertText(response.text);
              showNotification('✨ Refined & inserted!', 'success');
            } else {
              showOverlay('completed', response.text);
            }
          } else {
            showOverlay('error', response ? response.error : 'No response');
          }
        }
      );
    };
  } catch (error) {
    showOverlay('error', error.message);
  }
}

// ── Word/Char count ──
function getWordCount(text) { return text.trim().split(/\s+/).filter(w => w.length > 0).length; }

// ── Draggable Logic ──
function makeDraggable(overlayEl) {
  const handle = overlayEl.querySelector('.vpr-drag-handle');
  if (!handle) return;
  
  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = overlayEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    overlayEl.style.transition = 'none';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !overlayElement) return;
    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;
    overlayElement.style.left = x + 'px';
    overlayElement.style.top = y + 'px';
    overlayElement.style.right = 'auto';
    overlayElement.style.bottom = 'auto';
    overlayElement.style.transform = 'none';
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    if (overlayElement) overlayElement.style.transition = '';
  });
}

// ── Overlay UI ──
function showOverlay(state, text = '', showPreview = false) {
  if (overlayElement) overlayElement.remove();
  
  overlayElement = document.createElement('div');
  overlayElement.className = 'vpr-overlay';
  overlayElement.id = 'vpr-overlay';
  
  let content = '';
  
  if (state === 'recording') {
    content = `
      <div class="vpr-overlay-content vpr-compact">
        <div class="vpr-drag-handle">⋮⋮</div>
        <div class="vpr-close-icon" id="vpr-close-overlay">×</div>
        <div class="vpr-compact-row">
          <div class="vpr-recording-dot"></div>
          <span class="vpr-overlay-title">Recording</span>
          <span class="vpr-timer-badge" id="vpr-timer">0:00</span>
        </div>
        ${showPreview ? '<div class="vpr-transcription-box" id="vpr-live-text">Listening...</div>' : ''}
        <button class="vpr-btn vpr-btn-primary" id="vpr-stop-btn">Stop</button>
      </div>`;
  } else if (state === 'processing') {
    content = `
      <div class="vpr-overlay-content vpr-compact">
        <div class="vpr-drag-handle">⋮⋮</div>
        <div class="vpr-compact-row">
          <div class="vpr-spinner-sm"></div>
          <span class="vpr-overlay-title">Refining your prompt...</span>
        </div>
      </div>`;
  } else if (state === 'completed') {
    const words = getWordCount(text);
    content = `
      <div class="vpr-overlay-content vpr-compact">
        <div class="vpr-drag-handle">⋮⋮</div>
        <div class="vpr-close-icon" id="vpr-close-overlay">×</div>
        <div class="vpr-compact-row">
          <svg class="vpr-done-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span class="vpr-overlay-title">Refined</span>
          <span class="vpr-word-badge">${words}w</span>
        </div>
        <div class="vpr-transcription-box">${escapeHtml(text)}</div>
        <div class="vpr-overlay-actions">
          <button class="vpr-btn vpr-btn-primary" id="vpr-insert-btn">Insert</button>
          <button class="vpr-btn vpr-btn-secondary" id="vpr-copy-btn">Copy</button>
        </div>
      </div>`;
  } else if (state === 'error') {
    content = `
      <div class="vpr-overlay-content vpr-compact">
        <div class="vpr-drag-handle">⋮⋮</div>
        <div class="vpr-close-icon" id="vpr-close-overlay">×</div>
        <div class="vpr-compact-row">
          <svg class="vpr-done-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span class="vpr-overlay-title vpr-error-title">Error</span>
        </div>
        <div class="vpr-transcription-box vpr-error-box">${escapeHtml(text)}</div>
        <button class="vpr-btn vpr-btn-secondary" id="vpr-close-btn">Close</button>
      </div>`;
  }
  
  overlayElement.innerHTML = content;
  document.body.appendChild(overlayElement);
  makeDraggable(overlayElement);
  
  // Event listeners
  document.getElementById('vpr-close-overlay')?.addEventListener('click', closeOverlay);
  if (state === 'recording') {
    document.getElementById('vpr-stop-btn')?.addEventListener('click', stopRecording);
  } else if (state === 'completed') {
    document.getElementById('vpr-insert-btn')?.addEventListener('click', () => insertText(text));
    document.getElementById('vpr-copy-btn')?.addEventListener('click', () => copyText(text));
  } else if (state === 'error') {
    document.getElementById('vpr-close-btn')?.addEventListener('click', closeOverlay);
  }
}

function insertText(text) { doInsertText(text); }

function doInsertText(text) {
  if (!activeInputElement) {
    showNotification('Click a text field first', 'error');
    return;
  }
  
  if (activeInputElement.contentEditable === 'true') {
    activeInputElement.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const range = document.createRange();
      range.selectNodeContents(activeInputElement);
      range.collapse(false);
      range.insertNode(document.createTextNode(text));
    }
    activeInputElement.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
  } else {
    const start = activeInputElement.selectionStart || 0;
    const end = activeInputElement.selectionEnd || 0;
    const val = activeInputElement.value;
    activeInputElement.value = val.substring(0, start) + text + val.substring(end);
    activeInputElement.selectionStart = activeInputElement.selectionEnd = start + text.length;
    activeInputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  closeOverlay();
  showNotification('Text inserted!', 'success');
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied!', 'success');
    closeOverlay();
  }).catch(() => showNotification('Copy failed', 'error'));
}

function closeOverlay() {
  if (overlayElement) { overlayElement.remove(); overlayElement = null; }
  if (isRecording) stopRecording();
}

function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  n.className = `vpr-notification vpr-notification-${type}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('vpr-notification-show'), 10);
  setTimeout(() => {
    n.classList.remove('vpr-notification-show');
    setTimeout(() => n.remove(), 300);
  }, 2500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

init();
