# Opal Voice - Real-Time Voice Assistant Foundation

## 1. What the Application Does
**Opal Voice** is a modern, mobile-friendly real-time voice assistant web application designed to support natural, full-duplex spoken conversations with an AI assistant powered by **Deepslate Opal** (an end-to-end speech-to-speech model). 

This repository represents the **initial non-sensitive foundation**:
- Provides a clean, responsive mobile-first user interface (dark theme, charcoal background `#0C0A09`, emerald accent `#10B981`).
- Implements application state management (connection status, conversation states: idle, listening, processing, speaking).
- Establishes clear TypeScript type definitions and a decoupled `VoiceService` interface.
- Includes diagnostics and settings panels with secure architecture principles (no frontend API keys).

---

## 2. Technology Stack
- **Framework & Build tool**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Icons**: `lucide-react`.
- **Target Deployment**: Cloudflare Pages / Workers compatible static web architecture.

---

## 3. Project Structure
```
/
├── index.html                  # HTML entry point with meta tags & title
/metadata.json                  # App metadata and permissions
/package.json                   # Dependency manifests
/tsconfig.json                  # TypeScript configuration
/vite.config.ts                 # Vite bundler configuration
/src/
    ├── main.tsx                # React mounting entry
    ├── App.tsx                 # Main application layout and state
    ├── index.css               # Tailwind CSS imports
    ├── types/
    │   └── voice.ts            # Core TypeScript types & VoiceService interface
    ├── services/
    │   └── VoiceServiceMock.ts # Documented placeholder service implementation
    └── components/
        ├── Header.tsx          # App header with connection indicator & settings
        ├── ConversationArea.tsx# Message stream & text fallback input
        ├── VoiceControl.tsx    # Floating mic control & UI state buttons
        ├── DiagnosticsBar.tsx  # Unobtrusive diagnostics (latency, duration)
        └── SettingsModal.tsx   # Settings panel with secure backend notes
```

---

## 4. How to Install Dependencies
Ensure Node.js (v18+) is installed, then run:
```bash
npm install
```

---

## 5. How to Run the Development Environment
Start the Vite development server on port 3000:
```bash
npm run dev
```

---

## 6. How to Run Type Checks and Build the Project
- **Type check & Lint**:
  ```bash
  npm run lint
  ```
- **Production build**:
  ```bash
  npm run build
  ```

---

## 7. Cloudflare Deployment
This frontend SPA is fully compatible with **Cloudflare Pages**.
1. Connect your GitHub repository to Cloudflare Pages.
2. Build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. Environment Variables: No frontend secrets required. Any future server-side relay or API credentials must be configured securely on Cloudflare Workers or backend environment bindings.

---

## 8. Components Awaiting Cline Implementation
The following components and subsystems are deliberately left as documented placeholders and are ready for Cline implementation:
1. **Deepslate Opal WebSocket Protocol**: Establishing real-time bidirectional WebSocket connection for audio streaming.
2. **Microphone Audio Capture & PCM Conversion**: `AudioWorklet` / `ScriptProcessor` capturing raw PCM audio packets from the user microphone.
3. **Audio Playback & Synchronization**: Decoding incoming audio chunks from Deepslate and playing them back with low-latency scheduling.
4. **Interruption & Barge-in Management**: Detecting user voice activity while the assistant is speaking and immediately canceling playback.
5. **Secure Backend Relay**: Server-side proxy or WebSocket relay holding the Deepslate API key securely out of client reach.
