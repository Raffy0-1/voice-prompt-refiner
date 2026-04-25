# 📦 Installation Guide

## Step-by-Step Installation

### 1. Download the Extension

Clone or download this repository to your computer.

```bash
git clone <repository-url>
cd voice-prompt-refiner
```

Or download as ZIP and extract it.

### 2. Get Your Free Groq API Key

1. Go to **https://console.groq.com**
2. Click **Sign Up** (it's completely free!)
3. Verify your email
4. Once logged in, click **API Keys** in the left sidebar
5. Click **Create API Key**
6. Give it a name (e.g., "Voice Prompt Refiner")
7. **Copy the API key** - it starts with `gsk_`
8. ⚠️ Save it somewhere safe - you'll need it in step 4

### 3. Load Extension in Chrome

1. Open **Google Chrome**
2. Type `chrome://extensions/` in the address bar and press Enter
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked** button (top-left)
5. Navigate to the `voice-prompt-refiner` folder you downloaded
6. Select the folder and click **Open**
7. ✅ Extension installed! You should see it in your extensions list

### 4. Configure Your API Key

1. Click the **puzzle piece icon** (🧩) in Chrome's toolbar
2. Find **Voice Prompt Refiner** and click it
3. Paste your Groq API key in the text field
4. Click **Save Settings**
5. You'll see a success message ✓

### 5. Test It Out!

1. Go to **ChatGPT** or **Claude.ai**
2. Click in the prompt input box
3. Press **Ctrl+Shift+V** (or **Cmd+Shift+V** on Mac)
4. When the overlay appears, start speaking
5. Click **Stop Recording** when done
6. Review your refined text
7. Click **Insert Text** to add it to the chat

## 🎉 You're All Set!

The extension is now ready to use on any website with text inputs.

## 🔧 Troubleshooting

### Extension doesn't appear in Chrome

- Make sure **Developer mode** is enabled
- Try reloading the extension: click the **refresh icon** on the extension card
- Check the browser console for errors

### Can't find the extension icon

1. Click the **puzzle piece icon** (🧩) in Chrome toolbar
2. Find **Voice Prompt Refiner**
3. Click the **pin icon** to add it to your toolbar

### Microphone not working

- Chrome will ask for microphone permission the first time
- If denied, click the **microphone icon** in the address bar to allow it
- Make sure your microphone is connected and working

### API errors

- Double-check your API key is correct (should start with `gsk_`)
- Visit https://console.groq.com to verify your key is active
- Free tier has 14,400 requests/day - check if you've hit the limit

## 📱 Browser Compatibility

- ✅ Chrome (tested)
- ✅ Edge (Chromium-based)
- ✅ Brave
- ✅ Opera
- ❌ Firefox (not yet - coming soon!)
- ❌ Safari (not yet)

## 🔄 Updating the Extension

When there's a new version:

1. Download the new files
2. Go to `chrome://extensions/`
3. Click the **refresh icon** on the Voice Prompt Refiner card
4. The extension will reload with the new code

---

Need more help? Check the main [README.md](README.md) or open an issue!
