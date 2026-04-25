// Background service worker for VoxFlow

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  console.log("Command received:", command);

  if (command === "start-recording") {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) return;

      // Check if we are on a restricted page
      const restrictedPrefixes = ['chrome://', 'chrome-extension://', 'https://chrome.google.com/webstore', 'https://chromewebstore.google.com'];
      if (restrictedPrefixes.some(prefix => activeTab.url?.startsWith(prefix))) {
        console.log("Cannot inject script into a restricted page:", activeTab.url);
        return;
      }

      try {
        await chrome.tabs.sendMessage(activeTab.id, { action: "toggleRecording" });
      } catch (error) {
        console.log("Content script not detected, attempting to inject...", error.message);

        try {
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ["content.js"]
          });

          await chrome.scripting.insertCSS({
            target: { tabId: activeTab.id },
            files: ["content.css"]
          });

          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(activeTab.id, { action: "toggleRecording" });
            } catch (retryError) {
              console.error("Failed to send message after injection:", retryError);
            }
          }, 200);
        } catch (injectionError) {
          console.error("Failed to inject content script:", injectionError);
        }
      }
    } catch (queryError) {
      console.error("Error querying tabs:", queryError);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "transcribeAudio") {
    handleTranscription(request.audioBlob, sendResponse);
    return true;
  }
  return false;
});

/**
 * Handles the transcription and refinement process with auto-retry
 */
async function handleTranscription(audioBlob, sendResponse) {
  try {
    const transcription = await transcribeAudio(audioBlob);
    
    if (!transcription || transcription.trim() === '') {
      sendResponse({ success: false, error: "No speech detected. Please try again." });
      return;
    }

    const refinedText = await refineText(transcription);
    
    // Save to history
    await saveToHistory(transcription, refinedText);

    sendResponse({ success: true, text: refinedText, original: transcription });
  } catch (error) {
    // Don't retry if the error is just "No speech detected"
    if (error.message === "No speech detected. Please try again.") {
      sendResponse({ success: false, error: error.message });
      return;
    }

    console.error("Error processing audio (attempt 1):", error);

    // Auto-retry once on failure
    try {
      console.log("Retrying...");
      const transcription = await transcribeAudio(audioBlob);
      
      if (!transcription || transcription.trim() === '') {
        sendResponse({ success: false, error: "No speech detected. Please try again." });
        return;
      }
      
      const refinedText = await refineText(transcription);
      await saveToHistory(transcription, refinedText);
      sendResponse({ success: true, text: refinedText, original: transcription });
    } catch (retryError) {
      console.error("Retry also failed:", retryError);
      sendResponse({ success: false, error: retryError.message || "Processing failed after retry" });
    }
  }
}

// Save refined text to history
async function saveToHistory(original, refined) {
  try {
    const result = await chrome.storage.local.get(['voxflowHistory']);
    const history = result.voxflowHistory || [];

    history.unshift({
      id: Date.now(),
      original: original,
      refined: refined,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 entries
    if (history.length > 20) {
      history.length = 20;
    }

    await chrome.storage.local.set({ voxflowHistory: history });
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}

// Transcribe audio using Groq Whisper API
async function transcribeAudio(audioBlob) {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error("Groq API key not set. Please add it in the extension popup.");
  }

  const response = await fetch(audioBlob);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');

  const transcribeResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!transcribeResponse.ok) {
    let errorDetail = 'Unknown error';
    try {
      const errorJson = await transcribeResponse.json();
      errorDetail = errorJson.error?.message || errorDetail;
    } catch (e) {
      errorDetail = `Status: ${transcribeResponse.status}`;
    }
    throw new Error(`Transcription failed: ${errorDetail}`);
  }

  const result = await transcribeResponse.json();
  return result.text;
}

// Prompt templates
const PROMPT_TEMPLATES = {
  'ai-prompt': {
    name: 'AI Prompt',
    prompt: `You are a text refinement assistant. Your job is to:
1. Remove filler words (um, uh, like, basically, you know, kind of, sort of, actually, literally, etc.)
2. Fix grammar and sentence structure
3. Convert conversational rambling into clear, concise instructions or prompts
4. Preserve any Urdu/Hindi words exactly as spoken
5. Make the text suitable for use as an AI prompt or instruction

Output ONLY the refined text, nothing else. Do not add explanations or comments.`
  },
  'email': {
    name: 'Email Draft',
    prompt: `You are an email drafting assistant. Your job is to:
1. Convert spoken words into a professional email format
2. Add appropriate greeting and sign-off
3. Remove filler words and fix grammar
4. Keep the tone professional but friendly
5. Preserve the core message and intent

Output ONLY the email draft, nothing else.`
  },
  'code-comment': {
    name: 'Code Comment',
    prompt: `You are a code documentation assistant. Your job is to:
1. Convert spoken explanations into clear, concise code comments
2. Use proper documentation style (JSDoc / docstring format where appropriate)
3. Remove filler words, keep technical accuracy
4. Make comments developer-friendly and scannable

Output ONLY the refined comment text, nothing else.`
  },
  'tweet': {
    name: 'Tweet / Post',
    prompt: `You are a social media writing assistant. Your job is to:
1. Convert spoken words into a punchy, engaging social media post
2. Keep it under 280 characters if possible
3. Use a conversational but polished tone
4. Add relevant emoji where natural (don't overdo it)
5. Remove filler words

Output ONLY the post text, nothing else.`
  },
  'notes': {
    name: 'Quick Notes',
    prompt: `You are a note-taking assistant. Your job is to:
1. Convert spoken words into clean, organized bullet points
2. Remove filler words and redundancy
3. Keep key facts, dates, names, and action items
4. Use concise language

Output ONLY the formatted notes, nothing else.`
  }
};

// Refine text using Groq LLM with template support
async function refineText(text) {
  if (!text || text.trim() === '') {
    throw new Error("No speech detected. Please try again.");
  }

  const apiKey = await getApiKey();

  // Get selected template
  const settings = await chrome.storage.sync.get(['selectedTemplate']);
  const templateKey = settings.selectedTemplate || 'ai-prompt';
  const template = PROMPT_TEMPLATES[templateKey] || PROMPT_TEMPLATES['ai-prompt'];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: template.prompt },
        { role: 'user', content: `Refine this text:\n\n${text}` }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    let errorDetail = 'Unknown error';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error?.message || errorDetail;
    } catch (e) {
      errorDetail = `Status: ${response.status}`;
    }
    throw new Error(`Refinement failed: ${errorDetail}`);
  }

  const result = await response.json();
  return result.choices[0].message.content.trim();
}

// Get API key from storage
function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groqApiKey'], (result) => {
      resolve(result.groqApiKey || '');
    });
  });
}
