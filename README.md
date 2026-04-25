# 🎙️ VoxFlow

**A premium AI-powered Chrome extension that seamlessly converts your speech into refined, professional AI prompts. Experience the future of voice-to-text with elite multilingual support and high-performance refinement.**

![VoxFlow Preview](icons/icon128.png)

## ✨ Premium Features

- 🎯 **Vox to Prompt**: High-fidelity transcription using Groq's Whisper Large-v3.
- 🔄 **Digital Aperture Refinement**: Our "Digital Aperture" system polishes your speech, removing filler words, fixing grammar, and converting rambling into clear, concise instructions.
- 🌍 **Elite Multilingual**: Seamlessly handles code-switching between English, Urdu, Hindi, and 90+ other languages.
- ⚡ **Turbo Performance**: Powered by Groq Cloud for near-instant transcription and refinement using Llama 3.3 70B.
- 🎨 **Digital Aperture UI**: A stunning, glassmorphic dark-mode overlay that feels like a natural part of your browser.
- ⌨️ **Stealth Shortcut**: Invoke VoxFlow instantly with `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac).
- 💯 **100% Accessible**: Uses the free Groq API tier with massive daily limits.

## 🚀 Installation & Quick Start

### 1. Get Your Groq API Key (Free)

1. Visit the [Groq Cloud Console](https://console.groq.com)
2. Sign up or Log in
3. Navigate to **API Keys**
4. Click **Create API Key** and copy it.

### 2. Install VoxFlow

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `voxflow` (or `voice-prompt-refiner`) folder.
5. VoxFlow is now installed! 🚀

### 3. Setup

1. Click the **VoxFlow** icon in your extension toolbar.
2. Paste your API key into the secure configuration field.
3. Click **Save Settings**.

## 📖 How to Use

1. **Focus**: Click into any text field (ChatGPT, Claude, Gmail, etc.).
2. **Invoke**: Press `Ctrl+Shift+V`.
3. **Speak**: The premium glassmorphic overlay will appear. Speak naturally.
4. **Refine**: Click **Stop Recording**. Our AI will instantly polish your words.
5. **Flow**: Click **Insert Text** to drop the refined prompt directly into your active field.

## 🔧 Technical Architecture

VoxFlow is built for speed and elegance:

- **Frontend**: Vanilla JavaScript with a custom CSS design system ("Digital Aperture").
- **STT**: Groq Whisper Large-v3 (90+ languages).
- **LLM**: Groq Llama 3.3 70B (Text Polishing).
- **Storage**: Chrome Secure Sync Storage for API keys.

## 🎨 Design Philosophy: "Digital Aperture"

VoxFlow utilizes the **Digital Aperture** design system, focusing on:
- **Depth**: Using background color shifts instead of borders.
- **Focus**: High-contrast typography (Inter) on Deep Slate surfaces.
- **Light**: Glassmorphic blurs and Electric Indigo glows.

## 🔒 Privacy

- **Local Storage**: Your API key never leaves your browser's local sync storage.
- **Processing**: Audio is processed via Groq's secure API.
- **No Tracking**: VoxFlow does not collect any user data or track your browsing.

## 📄 License

VoxFlow is open-source software licensed under the [MIT License](LICENSE).

---

**Crafted with ❤️ for those who want their prompts to flow effortlessly.**

**Star ⭐ VoxFlow if it saves you time!**
