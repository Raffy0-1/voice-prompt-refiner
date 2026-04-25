// Popup script for settings management

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('apiKey');
  const statusMessage = document.getElementById('status-message');
  
  // Load saved API key
  chrome.storage.sync.get(['groqApiKey'], (result) => {
    if (result.groqApiKey) {
      apiKeyInput.value = result.groqApiKey;
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    // Validate API key format (basic check)
    if (!apiKey.startsWith('gsk_')) {
      showStatus('Invalid API key format. Should start with "gsk_"', 'error');
      return;
    }
    
    // Save to storage
    chrome.storage.sync.set({ groqApiKey: apiKey }, () => {
      showStatus('✓ API key saved successfully!', 'success');
      
      // Auto-close popup after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    });
  });
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
});
