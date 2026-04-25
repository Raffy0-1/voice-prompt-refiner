# 🎙️ Voice Prompt Refiner

**AI-powered Chrome extension that converts your voice into refined, clear prompts with multilingual support (English + Urdu/Hindi).**

## ✨ Features

- 🎯 **Voice to Text**: Unlimited recording length with automatic transcription
- 🔄 **Smart Refinement**: Removes filler words, fixes grammar, converts rambling into clear instructions
- 🌍 **Multilingual**: Seamlessly handles English + Urdu/Hindi code-switching
- ⚡ **Real-time Processing**: Fast transcription and refinement using Groq AI
- 🎨 **Beautiful UI**: Floating overlay that works on any website
- ⌨️ **Keyboard Shortcut**: Quick access with Ctrl+Shift+V (Cmd+Shift+V on Mac)
- 💯 **100% Free**: Uses free Groq API (14,400 requests/day)

## 🚀 Quick Start

### 1. Get Groq API Key (Free)

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy your key (starts with `gsk_`)

### 2. Install Extension

#### Option A: Load Unpacked (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `voice-prompt-refiner` folder
6. Extension installed! 🎉

#### Option B: Build from Source

```bash
git clone <your-repo-url>
cd voice-prompt-refiner
# No build step needed - it's vanilla JavaScript!
```

### 3. Configure API Key

1. Click the extension icon in Chrome toolbar
2. Paste your Groq API key
3. Click **Save Settings**
4. You're ready to go!

## 📖 How to Use

### Method 1: Keyboard Shortcut (Recommended)

1. Click on any text input field (ChatGPT, Claude, email, etc.)
2. Press **Ctrl+Shift+V** (or **Cmd+Shift+V** on Mac)
3. Start speaking when the overlay appears
4. Click **Stop Recording** when done
5. Review the refined text
6. Click **Insert Text** to add it to your input field

### Method 2: Extension Icon

1. Click the extension icon
2. Click on a text field
3. Press the shortcut or click the icon again to start recording

## 🎯 Use Cases

- **AI Prompts**: Quickly dictate long, complex prompts to ChatGPT, Claude, or other AI tools
- **Emails**: Draft professional emails without typing
- **Documentation**: Create clear documentation by speaking naturally
- **Code Comments**: Explain code logic in your own words
- **Multilingual Input**: Switch between English and Urdu/Hindi seamlessly

## 🔧 Technical Details

### Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Speech-to-Text**: Groq Whisper Large-v3 (handles 90+ languages)
- **Text Refinement**: Llama 3.2 90B (instruction-tuned for text polishing)
- **APIs**: Groq Cloud (free tier: 14,400 requests/day)

### Architecture

```
┌─────────────┐
│   Chrome    │
│  Extension  │
└──────┬──────┘
       │
       ├─► Content Script (captures audio)
       │
       ├─► Background Worker (processes audio)
       │      │
       │      ├─► Groq Whisper API (transcription)
       │      │
       │      └─► Groq Llama API (refinement)
       │
       └─► Floating Overlay (displays results)
```

### File Structure

```
voice-prompt-refiner/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js            # Content script (injected into pages)
├── popup.html            # Settings UI
├── popup.js              # Settings logic
├── styles.css            # Overlay & notification styles
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🎨 Customization

### Modify Refinement Prompt

Edit the `systemPrompt` in `background.js`:

```javascript
const systemPrompt = `You are a text refinement assistant. Your job is to:
1. Remove filler words (um, uh, like, basically, you know, kind of, sort of, actually, literally, etc.)
2. Fix grammar and sentence structure
3. Convert conversational rambling into clear, concise instructions or prompts
4. Preserve any Urdu/Hindi words exactly as spoken
5. Make the text suitable for use as an AI prompt or instruction

Output ONLY the refined text, nothing else. Do not add explanations or comments.`;
```

### Change Keyboard Shortcut

1. Go to `chrome://extensions/shortcuts`
2. Find "Voice Prompt Refiner"
3. Click the pencil icon
4. Set your preferred shortcut

### Modify UI Colors

Edit `styles.css` to change the gradient colors:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🔒 Privacy & Security

- **Your audio is processed via Groq's API** (see [Groq Privacy Policy](https://groq.com/privacy-policy/))
- **API key stored locally** in Chrome's secure storage
- **No data collected by this extension** - all processing happens via Groq
- For sensitive content, consider using a local model (see Advanced Setup below)

## 🐛 Troubleshooting

### "Microphone access denied"
- Click the microphone icon in Chrome's address bar
- Allow microphone access for the website

### "Groq API key not set"
- Click the extension icon
- Make sure you've pasted your API key and clicked Save

### "Transcription failed"
- Check your internet connection
- Verify your API key is valid at [console.groq.com](https://console.groq.com)
- Check if you've exceeded the free tier limit (14,400 requests/day)

### Extension not loading
- Make sure Developer mode is enabled in `chrome://extensions/`
- Check for errors in the console (right-click extension → Inspect popup)

## 🚧 Roadmap

- [ ] Real-time streaming mode (show transcription as you speak)
- [ ] Local model support (privacy mode)
- [ ] Custom vocabulary/jargon training
- [ ] Prompt templates library
- [ ] Export/import settings
- [ ] Firefox support
- [ ] Dark/Light theme toggle

## 🤝 Contributing

Contributions welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project however you want!

## 🙏 Acknowledgments

- **Groq** for the amazing free API
- **OpenAI** for Whisper model
- **Meta** for Llama models
- All open-source contributors

## 📧 Support

Having issues? Open an issue on GitHub or reach out!

---

**Made with ❤️ by an AI/ML Engineer who got tired of typing long prompts**

**Star ⭐ this repo if you find it useful!**
