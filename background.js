// Background service worker for Voice Prompt Refiner

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "start-recording") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleRecording" });
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transcribeAudio") {
    transcribeAudio(request.audioBlob)
      .then(transcription => {
        return refineText(transcription);
      })
      .then(refinedText => {
        sendResponse({ success: true, text: refinedText });
      })
      .catch(error => {
        console.error("Error processing audio:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Transcribe audio using Groq Whisper API
async function transcribeAudio(audioBlob) {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error("Groq API key not set. Please add it in the extension popup.");
  }

  // Convert base64 to blob
  const response = await fetch(audioBlob);
  const blob = await response.blob();
  
  // Create form data
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en'); // Will auto-detect mixed languages
  formData.append('response_format', 'json');

  const transcribeResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!transcribeResponse.ok) {
    const error = await transcribeResponse.json();
    throw new Error(`Transcription failed: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await transcribeResponse.json();
  return result.text;
}

// Refine text using Groq LLM (Llama 3.2)
async function refineText(text) {
  const apiKey = await getApiKey();
  
  const systemPrompt = `You are a text refinement assistant. Your job is to:
1. Remove filler words (um, uh, like, basically, you know, kind of, sort of, actually, literally, etc.)
2. Fix grammar and sentence structure
3. Convert conversational rambling into clear, concise instructions or prompts
4. Preserve any Urdu/Hindi words exactly as spoken
5. Make the text suitable for use as an AI prompt or instruction

Output ONLY the refined text, nothing else. Do not add explanations or comments.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Refine this text:\n\n${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Refinement failed: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}

// Get API key from storage
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groqApiKey'], (result) => {
      resolve(result.groqApiKey || '');
    });
  });
}
