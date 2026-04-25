// Content script injected into all webpages

let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let overlayElement = null;
let activeInputElement = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleRecording") {
    toggleRecording();
  }
});

// Initialize on page load
function init() {
  // Track the currently focused input element
  document.addEventListener('focusin', (e) => {
    if (isInputElement(e.target)) {
      activeInputElement = e.target;
    }
  });
  
  // Listen for clicks on input elements
  document.addEventListener('click', (e) => {
    if (isInputElement(e.target)) {
      activeInputElement = e.target;
    }
  });
}

// Check if element is a text input
function isInputElement(element) {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const type = element.type?.toLowerCase();
  const contentEditable = element.contentEditable === 'true';
  
  return (
    (tagName === 'input' && (type === 'text' || type === 'search' || type === 'email' || !type)) ||
    tagName === 'textarea' ||
    contentEditable ||
    element.getAttribute('role') === 'textbox'
  );
}

// Toggle recording state
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Start recording audio
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create media recorder
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];
    
    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data);
    });
    
    mediaRecorder.addEventListener('stop', async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await processAudio(audioBlob);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
    });
    
    mediaRecorder.start();
    isRecording = true;
    
    // Show overlay
    showOverlay('recording');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    showNotification('Microphone access denied', 'error');
  }
}

// Stop recording audio
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    showOverlay('processing');
  }
}

// Process recorded audio
async function processAudio(audioBlob) {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      
      // Send to background script for processing
      chrome.runtime.sendMessage(
        { action: 'transcribeAudio', audioBlob: base64Audio },
        (response) => {
          if (response.success) {
            showOverlay('completed', response.text);
          } else {
            showOverlay('error', response.error);
          }
        }
      );
    };
    
  } catch (error) {
    console.error('Error processing audio:', error);
    showOverlay('error', error.message);
  }
}

// Show overlay with different states
function showOverlay(state, text = '') {
  // Remove existing overlay
  if (overlayElement) {
    overlayElement.remove();
  }
  
  // Create overlay
  overlayElement = document.createElement('div');
  overlayElement.className = 'vpr-overlay';
  overlayElement.id = 'vpr-overlay';
  
  let content = '';
  
  if (state === 'recording') {
    content = `
      <div class="vpr-overlay-content vpr-recording">
        <div class="vpr-pulse"></div>
        <div class="vpr-text">Recording... Speak now</div>
        <div class="vpr-transcription" id="vpr-live-text">Listening...</div>
        <button class="vpr-button vpr-stop-btn" id="vpr-stop-btn">Stop Recording</button>
      </div>
    `;
  } else if (state === 'processing') {
    content = `
      <div class="vpr-overlay-content vpr-processing">
        <div class="vpr-spinner"></div>
        <div class="vpr-text">Processing & Refining...</div>
      </div>
    `;
  } else if (state === 'completed') {
    content = `
      <div class="vpr-overlay-content vpr-completed">
        <div class="vpr-header">
          <div class="vpr-title">✓ Refined Text</div>
          <button class="vpr-close-btn" id="vpr-close-btn">×</button>
        </div>
        <div class="vpr-refined-text" id="vpr-refined-text">${escapeHtml(text)}</div>
        <div class="vpr-actions">
          <button class="vpr-button vpr-insert-btn" id="vpr-insert-btn">Insert Text</button>
          <button class="vpr-button vpr-copy-btn" id="vpr-copy-btn">Copy to Clipboard</button>
        </div>
      </div>
    `;
  } else if (state === 'error') {
    content = `
      <div class="vpr-overlay-content vpr-error">
        <div class="vpr-text">❌ Error</div>
        <div class="vpr-error-message">${escapeHtml(text)}</div>
        <button class="vpr-button" id="vpr-close-btn">Close</button>
      </div>
    `;
  }
  
  overlayElement.innerHTML = content;
  document.body.appendChild(overlayElement);
  
  // Add event listeners
  if (state === 'recording') {
    document.getElementById('vpr-stop-btn')?.addEventListener('click', stopRecording);
  } else if (state === 'completed') {
    document.getElementById('vpr-insert-btn')?.addEventListener('click', () => insertText(text));
    document.getElementById('vpr-copy-btn')?.addEventListener('click', () => copyText(text));
    document.getElementById('vpr-close-btn')?.addEventListener('click', closeOverlay);
  } else if (state === 'error') {
    document.getElementById('vpr-close-btn')?.addEventListener('click', closeOverlay);
  }
}

// Insert text into active input
function insertText(text) {
  if (!activeInputElement) {
    showNotification('No text input selected', 'error');
    return;
  }
  
  // Handle different input types
  if (activeInputElement.contentEditable === 'true') {
    // For contenteditable elements — use modern Selection/Range API (execCommand is deprecated)
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
      // Fallback: append to end of element
      const range = document.createRange();
      range.selectNodeContents(activeInputElement);
      range.collapse(false);
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
    }
    // Dispatch InputEvent so React/Vue/Angular pick up the change
    activeInputElement.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }));
  } else {
    // For regular inputs/textareas
    const start = activeInputElement.selectionStart || 0;
    const end = activeInputElement.selectionEnd || 0;
    const currentValue = activeInputElement.value;
    
    activeInputElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    activeInputElement.selectionStart = activeInputElement.selectionEnd = start + text.length;
    
    // Trigger input event for frameworks like React
    activeInputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  closeOverlay();
  showNotification('Text inserted successfully', 'success');
}

// Copy text to clipboard
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Copied to clipboard', 'success');
    closeOverlay();
  }).catch(() => {
    showNotification('Failed to copy', 'error');
  });
}

// Close overlay
function closeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `vpr-notification vpr-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('vpr-notification-show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('vpr-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
init();
