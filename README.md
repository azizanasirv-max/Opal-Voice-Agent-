# Opal Voice - Real-Time Voice Assistant Foundation

## 1. What the Application Does
**Opal Voice** is a modern, mobile-friendly real-time voice assistant web application designed to support natural, full-duplex spoken conversations with an AI assistant powered by **Deepslate Opal** (an end-to-end speech-to-speech model). 

This repository represents the **initial non-sensitive foundation**:
- Provides a clean, responsive mobile-first user interface (dark theme, charcoal background `#0C0A09`, emerald accent `#10B981`).
- Implements application state management (connection status, conversation states: idle, listening, processing, speaking).
- Establishes clear TypeScript type definitions and a decoupled `VoiceService` interface.
- Includes placeholder diagnostics and settings panels; no frontend API keys are used.

**Current status:** this is a UI foundation. `VoiceServiceMock` simulates session state and text
replies. It does not connect to Deepslate, capture microphone audio, or play audio.

---

## 2. Technology Stack
- **Framework & Build tool**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Icons**: `lucide-react`.
- **Target Deployment**: static frontend on Cloudflare Pages or Workers static assets. A server-side
  voice relay is planned but not implemented.

---

## 3. Project Structure
```
.
├── .env.example                  # Documents planned server-side variables (no values)
├── .gitignore
├── index.html                    # HTML entry point with meta tags & title
├── metadata.json                 # Original AI Studio app metadata
├── package.json
├── package-lock.json             # Committed lockfile for reproducible installs
├── tsconfig.json                 # Strict TypeScript configuration
├── tsconfig.test.json            # Test-only compilation configuration
├── vite.config.ts                # Vite bundler configuration
├── docs/
│   └── stage-0-audit.md          # Repository audit and implementation roadmap
├── tests/
│   └── voice-service.test.ts     # Mock service contract tests
└── src/
    ├── main.tsx                  # React mounting entry
    ├── App.tsx                   # Main application layout and state
    ├── index.css                 # Tailwind CSS imports
    ├── types/
    │   └── voice.ts              # Core TypeScript types & VoiceService interface
    ├── services/
    │   └── VoiceServiceMock.ts   # Simulated service implementation (no I/O)
    └── components/
        ├── Header.tsx            # App header with connection indicator & settings
        ├── ConversationArea.tsx  # Message stream & text fallback input
        ├── VoiceControl.tsx      # Floating mic control & UI state buttons
        ├── DiagnosticsBar.tsx    # Placeholder diagnostics (duration, latency slots)
        └── SettingsModal.tsx     # Settings and credential-boundary information
```

---

## 4. Requirements and Installation

- **Node.js**: `^20.19.0 || >=22.12.0` (declared in `package.json` `engines`; required by Vite 8).
- **npm**: any current npm that supports lockfile version 3. The committed lockfile was generated
  with npm 11.

On a fresh clone, install the exact dependency graph from the lockfile:

```bash
npm ci
```

Use `npm install` only when intentionally adding, removing, or updating dependencies; commit the
resulting `package-lock.json` with the change.

---

## 5. Development Server

```bash
npm run dev
```

Vite listens on port 3000 and binds to `0.0.0.0`, so it can also be opened from another device on the
same network (for example an Android phone) while developing.

---

## 6. Type Check, Tests, and Build

```bash
npm run lint     # TypeScript type check with strict mode (tsc --noEmit)
npm test         # Mock service contract tests (node:test, no test framework)
npm run build    # Production build into dist/
npm run preview  # Serve the production build locally
npm run clean    # Remove dist/ and .test-dist/
```

`npm run lint` is a type check only; this repository does not currently use ESLint.

`npm test` compiles the service and test files with `tsconfig.test.json` into the git-ignored
`.test-dist/` directory, then runs them with Node's built-in test runner.

---

## 7. Cloudflare Deployment (Static Frontend Only)

The static SPA can be hosted on **Cloudflare Pages** or **Workers static assets**:

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`

No Worker, Durable Object, or server-side relay is included in this repository. The future real-time
voice engine will require a server-side component to hold Deepslate credentials and relay the
WebSocket connection; static hosting alone cannot do that.

No client-side environment variables or secrets are required today. `.env.example` documents the
planned server-side variable names only and contains no values.

---

## 8. Implemented vs Planned

**Implemented in this stage:**

- Responsive React UI with connection, conversation, and speaking states.
- `VoiceService` interface and a simulated `VoiceServiceMock` (no network or audio I/O).
- Strict TypeScript checking, reproducible `npm ci` installation, and a production build.
- Minimal contract tests for the mock service.

**Planned, not implemented:**

1. **Deepslate Opal WebSocket protocol** — real-time bidirectional audio streaming.
2. **Microphone capture and PCM conversion** — `AudioWorklet` capture to the configured format.
3. **Audio playback and synchronisation** — scheduling Deepslate audio chunks with low latency.
4. **Interruption and barge-in** — stopping playback and stale audio when the user speaks.
5. **Secure backend relay** — a server-side component that holds the Deepslate API key and relays
   the connection; the browser must never receive that key.
