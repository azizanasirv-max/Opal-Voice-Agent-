# Opal Voice — Stage 0 Repository Audit

**Audit date:** 2026-10-22
**Repository:** https://github.com/azizanasirv-max/Opal-Voice-Agent- (public)
**Branch audited:** `main` @ `32ab385d32736e2c143f02b1c8756eec3a47760c`
**Branch containing this report:** `cline/6trq5jvz`
**Auditor:** Cline (repository inspection + executed commands only)

> Scope: audit only. No application source, dependency manifest, or deployment configuration was
> modified. `node_modules/` and `dist/` were produced locally for verification and are git-ignored.
> No Deepslate integration was implemented.

## Bottom line

- The UI foundation is coherent and the `VoiceService` boundary is a usable seam; a real engine can be
  added without rewriting the component tree, but the interface needs a turn-aware, audio-aware v2.
- A fresh clone **cannot currently be installed**: `npm install` fails on an esbuild/Vite peer conflict
  and no lockfile exists. This is the first thing to fix.
- There is no server component. Static hosting alone cannot hold the Deepslate WebSocket or protect the
  API key; a Cloudflare Worker + Durable Object relay is required.
- Deepslate's WebRTC path is officially “not yet available”, so a server-side WebSocket relay is the
  only documented option today.
- Official docs conflict on whether Opal speech-to-speech audio requires a TTS provider. That must be
  answered with a real session before committing to an audio-output design.
- No secrets were found in the repository or its history; the repository is **public**.

## Evidence basis

- Full inspection of all 18 tracked files.
- Executed locally: `npm install`, `npm run lint` (`tsc --noEmit`), `npm run build`, `vite preview`
  plus HTTP requests against the preview server, `tsc --showConfig`, secret-pattern scans over
  tracked files and full git history, and `gh repo view`.
- Official Deepslate documentation fetched at audit time:
  - https://docs.deepslate.eu/llms.txt
  - https://docs.deepslate.eu/websocket (.md)
  - https://docs.deepslate.eu/webrtc (.md)
  - https://docs.deepslate.eu/opal.md
  - https://docs.deepslate.eu/api-reference/realtime.md
  - https://raw.githubusercontent.com/rooms-solutions/deepslate-docs/refs/heads/main/api-reference/realtime.proto
- Official Cloudflare documentation fetched at audit time:
  - Workers WebSockets, Durable Objects WebSockets, Workers limits, Durable Objects pricing,
    Workers Static Assets.

Every finding below is labelled **VERIFIED**, **CONFIRMED DEFECT**, **SUSPECTED**, or
**NOT YET TESTABLE**. "Verified" means the claim is supported by the repository contents or a command
actually executed in this audit. No voice-latency value is reported because no voice engine exists yet.

---

## 1. Repository Overview

| Item | Observation | Label |
| --- | --- | --- |
| Tracked files | 18 files, ~1,040 lines in a single commit (`32ab385 feat: initialize Opal Voice foundation`) | VERIFIED |
| Branches | `main` only; local `main` equals `origin/main` at audit start | VERIFIED |
| Visibility | **PUBLIC** GitHub repository | VERIFIED |
| Application | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 SPA, lucide-react icons | VERIFIED |
| Source layout | `src/App.tsx`, 5 components, `src/services/VoiceServiceMock.ts`, `src/types/voice.ts`, `src/index.css`, `src/main.tsx` | VERIFIED |
| Server code | None. No Worker, no API route, no proxy, no `wrangler` config, no `functions/` directory | VERIFIED |
| Tests | No test framework, no `test` script, no test files, no CI workflow | VERIFIED |
| Lockfile | **No `package-lock.json` (or any lockfile) is committed** | VERIFIED |
| Env files | `.env.example` only; no `.env` committed | VERIFIED |
| Device-specific paths | None found in tracked files | VERIFIED |
| Build artifacts committed | None; `dist/` is ignored | VERIFIED |

Tracked tree:

```
.env.example
.gitignore
README.md
index.html
metadata.json
package.json
tsconfig.json
vite.config.ts
src/App.tsx
src/main.tsx
src/index.css
src/types/voice.ts
src/services/VoiceServiceMock.ts
src/components/Header.tsx
src/components/ConversationArea.tsx
src/components/VoiceControl.tsx
src/components/DiagnosticsBar.tsx
src/components/SettingsModal.tsx
```

Runtime used for the audit: Node v24.15.0, npm 11.12.1, Linux x64.

---

## 2. Build and Type-Check Results

### 2.1 Dependency installation — FAILS ON A CLEAN CHECKOUT

`npm install` (no flags) fails before any source is compiled:

```
npm error code ERESOLVE
npm error While resolving: vite@8.3.5
npm error Found: esbuild@0.25.12
npm error   dev esbuild@"^0.25.0" from the root project
npm error Could not resolve dependency:
npm error peerOptional esbuild@"^0.27.0 || ^0.28.0" from vite@8.3.5
npm error Conflicting peer dependency: esbuild@0.28.2
```

Cause: `package.json:30` pins `esbuild: "^0.25.0"` while `package.json:20` requests `vite: "^8.3.0"`,
which currently resolves to `vite@8.3.5` and requires esbuild `^0.27.0 || ^0.28.0`. The direct
`esbuild` dependency is not used by any application code. There is no lockfile to pin a compatible
combination. **CONFIRMED DEFECT (blocks clean install / Android reconstruction).**

### 2.2 Workaround used for verification

```
npm install --legacy-peer-deps --no-package-lock --no-audit --no-fund
→ added 182 packages in 6s (exit 0)
```

This left no tracked-file changes and no lockfile. It is **not** a fix and must not become the
documented install procedure.

### 2.3 Type check

```
npm run lint   →   tsc --noEmit   →   exit 0, no diagnostics
```

TypeScript version resolved: **7.0.2**. The check passing does not mean strict checking: see §5 D4.

### 2.4 Production build

```
npm run build  →   vite build   →   exit 0
vite v8.3.5
✓ 1666 modules transformed.
dist/index.html                   0.89 kB │ gzip: 0.40 kB
dist/assets/index-CFnF_-Nm.css   24.16 kB │ gzip: 5.29 kB
dist/assets/index-BkmRUkQ1.js   242.90 kB │ gzip: 75.28 kB
✓ built in 209 ms
```

Build warning (exit code still 0):

```
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'` ...
  - `__dirname` (vite.config.ts:11:27). Use `import.meta.dirname` instead
```

### 2.5 Built artifact served

`npx vite preview --port 4173` then:

```
GET /                                → HTTP 200, 898 bytes
GET /assets/index-BkmRUkQ1.js        → HTTP 200
```

The static SPA shell and JS bundle are served correctly. This verifies **static hosting only**; it
verifies nothing about voice, microphone, networking, or Deepslate.

### 2.6 Resolved versions

| Package | Declared | Resolved in this audit |
| --- | --- | --- |
| react / react-dom | `^19.0.1` | 19.3.1 |
| vite | `^8.3.0` | 8.3.5 |
| typescript | `^7.0.2` | 7.0.2 |
| @tailwindcss/vite / tailwindcss | `^4.3.3` | 4.3.x |
| esbuild (direct devDep) | `^0.25.0` | 0.25.12 |

Because ranges are unpinned and no lockfile exists, these versions will drift and can break again.
**CONFIRMED DEFECT (non-reproducible dependency graph).**

---

## 3. Current Architecture

### 3.1 Runtime shape

```
main.tsx → <App>                                  (all UI state lives here)
  ├─ Header            connection badge, Start/End Session, Settings
  ├─ DiagnosticsBar    duration, connection, latency placeholders
  ├─ ConversationArea  message list + text fallback input
  ├─ VoiceControl      mic button + Interrupt button
  └─ SettingsModal     disabled configuration placeholders

App.tsx ──subscribe──► voiceService (singleton VoiceServiceMock)
```

- `src/main.tsx:1-5` mounts `<App />` directly, without `StrictMode`.
- `src/App.tsx:16-25` owns `connectionStatus`, `conversationStatus`, `messages`, `diagnostics`,
  and settings visibility.
- `src/App.tsx:27-41` subscribes once on mount to four streams: connection, conversation status,
  messages, diagnostics. **It does not subscribe to `onError`.**
- `src/services/VoiceServiceMock.ts:172` exports a module-level singleton, so service state survives
  component remounts within a page load.
- There is no router, no store library, no context provider, and no reducer. The boundary is a
  hand-written observer/event-emitter contract.

### 3.2 The service contract (`src/types/voice.ts`)

Commands (`src/types/voice.ts:29-35`):

```ts
connect(): Promise<void>;
disconnect(): Promise<void>;
startListening(): void;
stopListening(): void;
interrupt(): void;
sendTextMessage(text: string): void;
```

Events (`src/types/voice.ts:37-42`): `onConnectionChange`, `onConversationStatusChange`,
`onMessage`, `onError`, `onDiagnostics`. Every subscriber returns an unsubscribe function.

State types:

- `ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'` (`voice.ts:1`)
- `ConversationStatus = 'idle' | 'listening' | 'processing' | 'speaking'` (`voice.ts:3`)
- `ConversationMessage { id, speaker, text, timestamp, isInterrupted? }` (`voice.ts:7-13`)
- `SessionDiagnostics { sessionDurationSeconds, firstAudioLatencyMs, interruptionResponseTimeMs, bytesTransferred }` (`voice.ts:22-27`)

### 3.3 What `VoiceServiceMock` actually does (`src/services/VoiceServiceMock.ts`)

| Method | Behaviour |
| --- | --- |
| `connect()` (32-45) | Sets `connecting`, waits a fixed 800 ms, sets `connected`, starts a 1 s duration timer, appends a system message. No network, no microphone, no permission request. |
| `disconnect()` (47-52) | Stops the timer, sets `disconnected`/`idle`, appends a system message. Does not cancel pending reply timers. |
| `startListening()` (54-60) | Only if connected; sets `listening`. No capture. |
| `stopListening()` (62-65) | Only if connected; sets `idle`. |
| `interrupt()` (67-71) | Only if connected; sets `idle` and appends a system message. No audio exists to cancel. |
| `sendTextMessage()` (73-97) | Appends the user text, sets `processing`, then after 600 ms appends a canned `[Foundation Placeholder] ...` assistant message and sets `idle`. |
| Diagnostics (151-162) | Updates `sessionDurationSeconds` once per second. `firstAudioLatencyMs`, `interruptionResponseTimeMs`, and `bytesTransferred` are initialised (17-22) and never written again. |

**The mock is a UI state simulator. It is not a voice engine, not a network client, and not a
Deepslate client.** No `getUserMedia`, `AudioContext`, `AudioWorklet`, `WebSocket`, `fetch`, or
`localStorage` call exists anywhere in `src/` (verified by search).

### 3.4 UI state handling

- Messages are append-only: `setMessages(prev => [...prev, msg])` (`App.tsx:30-32`). There is no
  update/upsert event, no turn identity, and no way to revise streamed assistant text.
- Connection state is derived only from the service callbacks; there is no local timeout, heartbeat,
  or reconnect logic.
- The Start/End Session button calls `connect()`/`disconnect()` and is enabled in every non-connected
  state, including `connecting` (`Header.tsx:61-70`, `App.tsx:43-49`).
- The mic button calls `startListening()` whenever the status is not `listening`
  (`VoiceControl.tsx:22-29`), including while `speaking`.
- The separate Interrupt button is rendered only while `speaking` (`VoiceControl.tsx:66-75`).

### 3.5 Can the UI accommodate a real asynchronous service without a major rewrite?

**Yes — the decoupling is sound, but the interface is too narrow and must be extended additively.**

The component tree, observer pattern, and unsubscribe lifecycle are a usable foundation. A real
engine can be dropped in behind `VoiceService`. However, the following assumptions in the current
contract would obstruct streaming audio, real-time events, cancellation, and reconnection:

| Assumption in current code | Why it obstructs a real engine | File:line |
| --- | --- | --- |
| Messages are complete, append-only objects with no turn ID | Deepslate streams token fragments and multiple snapshots per turn, with content that can roll back; appending each fragment creates one bubble per token and cannot reconcile interruptions | `types/voice.ts:7-13`, `App.tsx:30-32` |
| No audio events at all | No path for `ModelAudioChunk` (raw PCM) or playback lifecycle | `types/voice.ts:29-43` |
| `startListening`/`stopListening` are synchronous `void` | Microphone acquisition is async and can fail (permission, device busy); the caller cannot await or cancel it | `types/voice.ts:32-33`, `VoiceServiceMock.ts:54-65` |
| `sendTextMessage` is synchronous `void` | No delivery acknowledgement, rejection, or cancellation | `types/voice.ts:35` |
| No session configuration | Cannot pass system prompt, voice/model, sample rates, VAD settings, or output format to `connect()` | `types/voice.ts:30` |
| No turn identity / sequence numbers | Cannot correlate audio, text, progress, and interruption events per turn | `types/voice.ts:7-13` |
| `onError` exists but is not consumed and never emitted | All error reporting is currently dead code | `App.tsx:27-41`, `VoiceServiceMock.ts:116-119` |
| `'reconnecting'` and `'error'` statuses have UI styling but no producer | No retry/backoff or terminal-error path can be expressed | `types/voice.ts:1`, `Header.tsx:21-26`, mock never sets them |
| Diagnostics are only duration-based | No measurement points for first audio, interrupt response, bytes, or playback position | `VoiceServiceMock.ts:151-162` |

**Conclusion:** no rewrite of the component structure is required. A `VoiceService` v2 contract plus a
message/turn model that supports upsert, audio events, and errors is required before audio work.
`ConversationArea` will need to render by turn ID and merge snapshots; `VoiceControl` will need real
push-to-talk / VAD states; `SettingsModal` will need real, persisted configuration. Those are
contained changes, not an architectural replacement.

### 3.6 Deepslate protocol baseline (official documentation, audit date)

These are requirements extracted from the current official docs/proto, not from this repository.
They define what a future engine must satisfy.

**Endpoint and authentication** (`websocket.md`, “Connect”):

```
wss://app.deepslate.eu/api/v1/vendors/{vendorId}/organizations/{organizationId}/realtime[/{modelId}]
Authorization: Bearer <API_KEY>
```

- The WebSocket interface is explicitly **server-side only**: “End users should connect through
  WebRTC or your application's frontend. Never expose your API key to clients.”
- Optional `X-Deepslate-Retain-Zero-Data` / `X-Deepslate-Retain-Audio` headers set per-session retention.
- Model may be pinned in the path (for example `opal-v2.1`); unknown model → 404, no access → 403.
- Message framing is **binary protobuf** (`ServiceBoundMessage` client→server,
  `ClientBoundMessage` server→client), not JSON.

**Session initialisation** (`proto: InitializeSessionRequest`, `websocket.md`):

- Must be the first message: `input_audio_line`, `output_audio_line`, `vad_configuration`,
  `inference_configuration`, optional `tts_configuration`, `supports_playback_reporting`,
  optional `enable_vad_frame_telemetry`, optional `experiments`.
- Audio lines use `sample_rate`, `channel_count`, `SampleFormat` (16-bit signed PCM is format `1`).
- Documented example uses **16000 Hz mono signed 16-bit** on both lines; the UI's “24 kHz” claim is
  not supported by the current docs (§5 D12).
- `supports_playback_reporting: true` is a hint; reports are honoured regardless.

**Audio input** (`proto: UserInput`, `websocket.md` “Send Audio”):

- Raw PCM bytes matching `input_audio_line` exactly; 16 kHz mono 16-bit = 2 bytes/sample,
  little-endian, 32,000 bytes/s.
- `packet_id` is client-chosen (`uint64`), `mode` is `NO_TRIGGER` (0), `QUEUE` (1) or
  `IMMEDIATE` (2). The docs' streaming example uses `mode: 2` on every frame.
- For 20 ms frames, the payload is 640 bytes; at 50 frames/s this is a high event rate for any relay.

**Output events** (`proto: ClientBoundMessage`):

| Event | Meaning / obligation |
| --- | --- |
| `session_ready` | Session initialised after TTS warm-up |
| `response_begin { turn_id }` | Start of an assistant turn |
| `model_text_fragment { text, turn_id }` | Streamed text, sent whether or not TTS is configured |
| `model_audio_chunk { audio, turn_id? }` | Raw PCM for the turn; docs say it is sent only when a TTS provider is configured |
| `model_speech_progress { turn_id, text, audio_bytes_played, exact }` | Text the caller has actually heard, paced to playback |
| `turn_snapshot { message, is_final }` | Authoritative turn content; may roll back; `is_final` = immutable |
| `inference_complete { turn_id }` | LLM generation done; TTS may still be synthesising |
| `response_end { turn_id }` | No more audio for the turn; content may still change |
| `playback_clear_buffer` | User started speaking; client must discard queued/stale audio (“soft deprecated” in favour of VAD events but still sent) |
| `user_transcription_result { turn_id, text, language }` | Async transcription of a user turn |
| `vad_state_event` / `vad_analysis_frame` | VAD transitions; frame telemetry is opt-in and experimental |
| `error { category, message, trace_id? }` | Sent before the server closes; categories are session/config/protocol/inference/audio/TTS/internal |
| `pong` | Reply to `ping` |

**Interruption:** the server proactively sends `playback_clear_buffer` when the user starts speaking,
regardless of whether audio is playing. The client must immediately stop current playback and discard
all queued audio. Sending audio with `mode = IMMEDIATE` also interrupts ongoing inference.

**Playback-position reporting** (`proto: PlaybackPositionReport`, `websocket.md`):

- `{ bytes_played: uint64, turn_id: uint32 }`; counts are **per turn**, cumulative bytes, not delta and
  not per session.
- Use the `turn_id` from the `ModelAudioChunk`; fall back to the current turn if the chunk omits it.
- Without reports the server falls back to an elapsed-time estimate, which also drives
  `model_speech_progress` pacing and context truncation.

**Keep-alive** (`proto: Ping` comment): the session typically times out after ~30 s without client
packets; the docs recommend an unconditional `Ping` every 10 s or less when no other traffic flows.

**Turn synchronisation:** a turn is identified by `turn_id` across `response_begin`, text fragments,
audio chunks, speech progress, `inference_complete`, `turn_snapshot`, and `response_end`. Final content
must be taken from `turn_snapshot is_final = true`, not from accumulated fragments. A user interruption
can change an assistant turn's delivery status (`DELIVERY_INTERRUPTED`) and its content.

**Reconnection:** the WebSocket docs define **no session-resume or replay mechanism**. A new connection
must send a new `InitializeSessionRequest`; conversation continuity after reconnect is an application
concern and is currently undocumented. `ping/pong` is liveness only.

**WebRTC:** the official page currently states “This API is not yet available and is still under
construction.” It also requires a server-side `POST /api/v1/sessions` with the Bearer API key, so it
could not be used directly from a browser without a relay even once available.

---

## 4. Verified Findings

| ID | Finding | Evidence | Label |
| --- | --- | --- | --- |
| V1 | The repository is a small, clean, single-commit static SPA with no server component. | 18 tracked files; `git show --stat HEAD`; no `wrangler`/`functions`/server files | VERIFIED |
| V2 | The type check passes unchanged on the audited commit. | `npm run lint` exit 0 | VERIFIED |
| V3 | The production build passes and produces a working static bundle. | `npm run build` exit 0; `vite preview` returned 200 for `/` and the JS asset | VERIFIED |
| V4 | The service boundary is a hand-written observer contract with unsubscribe functions; components do not import the mock directly. | `App.tsx:8,27-41`; components receive props only | VERIFIED |
| V5 | The mock performs no I/O of any kind. | No `WebSocket`, `fetch`, `getUserMedia`, `AudioContext`, `localStorage` in `src/` | VERIFIED |
| V6 | The mock never emits errors and never enters `error` or `reconnecting`. | `VoiceServiceMock.ts:116-119` only adds/removes listeners; `setConnectionStatus` calls only at 33, 38, 49 | VERIFIED |
| V7 | Error events would be dropped even if emitted. | `App.tsx:27-41` has no `onError` subscription | VERIFIED |
| V8 | The diagnostics UI is partially dead: only session duration is updated. | `VoiceServiceMock.ts:17-22, 151-162`; `DiagnosticsBar.tsx:43-56` | VERIFIED |
| V9 | The `isInterrupted` rendering branch is unreachable in the current app. | Field declared `voice.ts:12`, rendered `ConversationArea.tsx:102`, never assigned in `src/` | VERIFIED |
| V10 | The Settings panel describes a server-side relay and a fixed sample rate that do not exist in this repository. | `SettingsModal.tsx:37, 52, 61`; no server code present | VERIFIED |
| V11 | No microphone permission is requested by the app. | No `getUserMedia` in `src/`; `metadata.json:4` declares an AI Studio frame permission only | VERIFIED |
| V12 | The public repo and its entire history contain no secret-looking values. | `git grep` over HEAD and all history; only `.env.example` matched env-file name patterns | VERIFIED |
| V13 | No lockfile exists, so dependency resolution is not reproducible. | `git ls-files`; install pulled `vite@8.3.5` today | VERIFIED |
| V14 | The build emits a forward-compatibility warning for `__dirname`. | Build output; `vite.config.ts:11` | VERIFIED |
| V15 | Several declared dependencies are unused by application code. | `@google/genai`, `express`, `dotenv`, `motion`, `tsx`, `autoprefixer`, `@types/express` (`package.json:14,21-23,29,32,34`); no imports in `src/` | VERIFIED |
| V16 | The documented Node requirement is below Vite 8's engine requirement. | `README.md:48` says Node 18+; installed `vite/package.json` engines = `^20.19.0 || >=22.12.0` | VERIFIED |
| V17 | The repository has no automated tests and no CI. | No test script/files/workflows | VERIFIED |
| V18 | The repository is public, so any future key committed by mistake is immediately exposed. | `gh repo view` → `"visibility":"PUBLIC"` | VERIFIED |

---

## 5. Confirmed Defects

Severity is relative to “reconstruct and deploy from GitHub on another device, then build a voice
engine on top”. None of these were fixed in Stage 0.

### D1 — Clean install fails (Blocker) — CONFIRMED DEFECT

`package.json:20` (`vite ^8.3.0`) and `package.json:30` (`esbuild ^0.25.0`) are incompatible as
resolved today (`vite@8.3.5` peer-requires `esbuild ^0.27.0 || ^0.28.0`). A fresh `npm install` on
another device fails with `ERESOLVE`. Combined with the missing lockfile (D2), there is currently **no
documented, reliable install path**. `--legacy-peer-deps` merely bypasses the check.

### D2 — No lockfile / unpinned dependency graph (High) — CONFIRMED DEFECT

No `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` is tracked. All dependency ranges are caret
ranges. The build works only with the exact resolutions produced during this audit and can change
without any repository commit.

### D3 — Wrong Node.js requirement in documentation (High) — CONFIRMED DEFECT

`README.md:48` says “Ensure Node.js (v18+) is installed”. Installed Vite 8 declares
`engines.node = "^20.19.0 || >=22.12.0"`. Following the README on Node 18 or early Node 20 can fail.
There is no `engines` field in `package.json` and no `.nvmrc`.

### D4 — TypeScript strict mode is off (High) — CONFIRMED DEFECT

`tsconfig.json` has no `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, or
`noFallthroughCasesInSwitch`. `tsc --showConfig` confirms no `strict` option is set, so `strictNullChecks`
and related checks are disabled. The passing `lint` result therefore gives weaker guarantees than the
README implies. This also lets dead code (`React` imports, unused error listeners) pass unnoticed.

### D5 — Error channel is unreachable and unconsumed (High) — CONFIRMED DEFECT

- `VoiceServiceMock.ts:116-119` adds/removes `onError` listeners but never invokes them.
- `App.tsx:27-41` never subscribes to `onError`.
- No UI component renders `AppError`; no toast/banner exists.

Any real connection, microphone, or protocol failure would be silently lost unless this is fixed.

### D6 — `error` and `reconnecting` states are dead UI states (Medium) — CONFIRMED DEFECT

`Header.tsx:20-26,36-41` renders both states, but no code ever calls
`setConnectionStatus('error' | 'reconnecting')`. The mock only produces `connecting`, `connected`, and
`disconnected` (`VoiceServiceMock.ts:33,38,49`).

### D7 — Session start is re-entrant (Medium) — CONFIRMED DEFECT

`handleToggleConnection` (`App.tsx:43-49`) calls `connect()` whenever the status is not `connected`,
and the header button is enabled while `connecting` (`Header.tsx:61-70`). `connect()` has no guard
(`VoiceServiceMock.ts:32-45`). Rapid taps start overlapping 800 ms handshakes and append duplicate
system messages; the last completion wins.

### D8 — Pending assistant reply survives disconnect (Medium) — CONFIRMED DEFECT

`sendTextMessage` schedules an untracked `setTimeout` (`VoiceServiceMock.ts:85-94`). `disconnect()`
(47-52) cancels only the diagnostics interval. A reply scheduled before “End Session” is still emitted
after disconnect (and after a subsequent reconnect), and its callback forces `conversationStatus` to
`idle` regardless of the current session. This is exactly the class of stale-event bug that becomes
serious once real turn audio and IDs exist.

### D9 — Mic button contradicts its own “tap to interrupt” label (Medium) — CONFIRMED DEFECT

While `speaking`, the mic button's `handleMicClick` falls into the `else` branch and calls
`onStartListening()` (`VoiceControl.tsx:22-29`), immediately changing status to `listening` instead of
interrupting. Meanwhile the helper text says “Assistant Speaking (Tap to interrupt)”
(`VoiceControl.tsx:52-53`) and the only working interrupt is the separate button rendered at 66-75.

### D10 — Diagnostics are placeholders presented as measurements (Medium) — CONFIRMED DEFECT

`firstAudioLatencyMs`, `interruptionResponseTimeMs`, and `bytesTransferred` are initialised once and
never updated (`VoiceServiceMock.ts:17-22`; no other writes). `DiagnosticsBar.tsx:43-56` therefore
always shows “Unavailable” for the two latencies and `0 B` for bytes. The panel looks functional but
cannot measure anything.

### D11 — Interrupted-message UI is unreachable (Low) — CONFIRMED DEFECT

`ConversationMessage.isInterrupted` (`types/voice.ts:12`) is rendered at
`ConversationArea.tsx:102`, but nothing in the repository ever sets it. `interrupt()` only emits a
system message (`VoiceServiceMock.ts:67-71`).

### D12 — Settings show invented protocol values (Medium) — CONFIRMED DEFECT

- `SettingsModal.tsx:52` states “24 kHz PCM (Deepslate Standard)”. The official WebSocket example
  uses 16 kHz mono signed 16-bit; WebRTC documentation uses 48 kHz Opus. No official source reviewed
  states that 24 kHz is the standard. The UI presents an unverified value as fact.
- `SettingsModal.tsx:61` shows `wss://api.deepslate.opal.relay` as the “WebSocket Relay Endpoint”.
  That host is not in the official documentation and is not a real configured endpoint. It looks
  authoritative but is fabricated.
- `SettingsModal.tsx:36-38` asserts that “All authentication and WebSocket relaying are routed
  securely through the server-side architecture.” No such architecture exists in the repository.

### D13 — “Lint” is only a type check (Low) — CONFIRMED DEFECT

`package.json:11` defines `lint` as `tsc --noEmit`; `README.md:64-67` labels it “Type check & Lint”.
There is no ESLint/Prettier configuration, so style, hooks rules, and unused-code checks are not run.

### D14 — Cloudflare deployment documentation overstates readiness (Medium) — CONFIRMED DEFECT

`README.md:17` and `README.md:75-82` describe the app as “Cloudflare Pages / Workers compatible” and
“fully compatible with Cloudflare Pages”. Only the static SPA is compatible. There is no Worker, no
Durable Object, no `wrangler` configuration, no secret binding, and no relay. The future voice engine
cannot run on static hosting (§8).

### D15 — Vite config is not forward-compatible (Low) — CONFIRMED DEFECT

`vite.config.ts:11` uses `__dirname` in an ESM configuration under `"type": "module"`. Vite 8 emits a
warning that this is unsupported by the planned native config loader; a future Vite major will break
it. `import.meta.dirname` is the forward-compatible form.

### D16 — Unused and misclassified dependencies (Medium) — CONFIRMED DEFECT

No application import exists for `@google/genai`, `express`, `dotenv`, `motion`, `tsx`, `autoprefixer`,
or `@types/express`, yet all are declared (`package.json:14,21-23,29,32,34`). `vite`,
`@vitejs/plugin-react`, and `@tailwindcss/vite` are build tools but are listed under `dependencies`
(`package.json:15-16,20`). `express` + `dotenv` suggest a server that was never committed, which is
misleading for the deployment design and increases install size and supply-chain surface.

### D17 — `.env.example` documents the wrong project (Medium) — CONFIRMED DEFECT

`.env.example:1-9` documents `GEMINI_API_KEY` and `APP_URL` only. Neither is read anywhere in the
repository (verified by search). There is no documentation of `DEEPSLATE_API_KEY`, vendor ID,
organization ID, model ID, or relay secret. A developer following this file would configure the wrong
credentials while still having no way to run the intended backend.

### D18 — `.gitignore` is incomplete for the intended stack (Medium) — CONFIRMED DEFECT

`.gitignore:1-6` covers `node_modules`, `dist`, `.env`, `.DS_Store`, `.vite`, and `*.local`. It does not
cover `.env.*` (for example `.env.production`, `.env.development`), `.dev.vars`/`.dev.vars.*`
(Wrangler local secrets), `.wrangler/`, `*.tsbuildinfo`, coverage output, or editor/OS clutter beyond
`.DS_Store`. On a public repository this is a realistic key-leak path once Cloudflare work begins.

### D19 — Clean script references a file that does not exist (Low) — CONFIRMED DEFECT

`package.json:10`: `"clean": "rm -rf dist server.js"`. There is no `server.js` and no server build. This
is an AI Studio template remnant that implies a backend that does not exist.

### D20 — No automated verification (High for the next stage) — CONFIRMED DEFECT

There is no test script, test framework, fixture, or CI. The mock's timing behaviour, service contract,
and any future state machine cannot be regression-tested. The only verification available today is
compilation plus manual UI use.

### D21 — Template identity leaks into the product (Low) — CONFIRMED DEFECT

`package.json:2-4`: name `react-example`, version `0.0.0`. `README.md:87` and
`VoiceServiceMock.ts:43` address “Cline” in user-facing text. `metadata.json` is an AI Studio artifact
not referenced by `index.html`. These are cosmetic but reduce clarity when reconstructing the project
on another device.

### D22 — Message text cannot be selected on mobile (Low, UX) — CONFIRMED DEFECT

`App.tsx:68` applies `select-none` to the whole application root. On Android this prevents selecting
or copying transcript text, including error and diagnostic text.

---

## 6. Latency and Reliability Risks

No latency was measured because no audio path exists. The official Opal page advertises “first byte
latency under 300 ms”, but that is a vendor claim, not a measurement of this repository or this future
deployment. The items below are separated by evidence level.

### 6.1 Verified defects with latency/reliability impact

These are already listed in §5 and are not repeated in full:

- D5/D6: failures and reconnects cannot reach the UI.
- D7: overlapping session starts.
- D8: stale asynchronous events after session end.
- D9: speaking-state barge-in is wired to the wrong action.
- D10: no real audio/interrupt diagnostics.
- D11/B16: interruption and state feedback are not represented.

### 6.2 Suspected bottlenecks (code-level reasoning, no measurement)

| ID | Risk | Reasoning | Label |
| --- | --- | --- | --- |
| B1 | Extra relay hop | Browser → Cloudflare edge → Durable Object → Deepslate → back. Both legs add RTT. Deploying the DO far from the Deepslate EU endpoint increases the second leg. | SUSPECTED |
| B2 | Microphone frame size vs uplink latency | 20 ms frames give low latency but 50 events/s; 100 ms frames cut events 5× but add up to ~100 ms capture latency before the first byte leaves the device. This is a direct trade-off against Cloudflare request billing and VAD responsiveness. | SUSPECTED |
| B3 | Main-thread microphone processing | `AudioWorklet` resampling from the device rate (commonly 48 kHz float32) to 16 kHz int16 must run off the main thread. Doing it with `ScriptProcessor` or in React would stutter on a phone. No audio code exists yet. | SUSPECTED |
| B4 | React re-render volume | Every `onMessage` currently appends and re-renders the full list (`App.tsx:30-32`, `ConversationArea.tsx:60-107`). Deepslate emits per-token text fragments and many audio chunks per turn; naïvely forwarding each as a React message will cause high render pressure and competing smooth scrolls (`ConversationArea.tsx:21-23`). Coalescing per animation frame will be required. | SUSPECTED |
| B5 | Playback start policy | Starting audio immediately risks underruns; adding a fixed lead buffer adds latency. The right policy needs measurement on the target Android device. | NOT YET TESTABLE |
| B6 | Device/output sample-rate conversion | Deepslate examples use 16 kHz PCM; Android audio hardware commonly runs at 48 kHz. `AudioContext` resampling or a custom resampler introduces quality/CPU/latency trade-offs. | NOT YET TESTABLE |
| B7 | Stale audio after barge-in | `playback_clear_buffer` can arrive while decoded/scheduled buffers and in-flight `model_audio_chunk` messages still exist. Requires a per-turn generation guard and immediate stop/disconnect of scheduled sources, not just clearing an array. | NOT YET TESTABLE |
| B8 | Turn-ID races | `model_audio_chunk.turn_id` is optional; current turn must come from `response_begin`. Audio arriving after a new turn begins must be dropped by comparing IDs, otherwise the assistant speaks stale text. | NOT YET TESTABLE |
| B9 | Playback byte accounting | `PlaybackPositionReport.bytes_played` is cumulative raw PCM bytes **per turn**. If playback resamples to 48 kHz, the byte count must still reflect Deepslate output bytes, not device bytes, or context truncation will be wrong. | NOT YET TESTABLE |
| B10 | Server-side VAD delay | The documented example sets `stop_duration` 390 ms; end-of-speech detection therefore adds a deliberate pause before inference. This is expected behaviour, not a bug, but it dominates perceived turn latency. | SUSPECTED (documented default) |
| B11 | Idle timeout | The proto states a session typically times out after ~30 s without client packets and recommends `Ping` every ≤10 s. A silent microphone or paused UI without heartbeats can drop the session. | SUSPECTED (documented behaviour) |
| B12 | Reconnect loses context | No resume/replay is documented. Reconnecting means re-initialising and re-establishing conversational context. The current UI has no concept of this. | SUSPECTED |
| B13 | Deploy/runtime restarts | Cloudflare documents that code updates disconnect all WebSockets and restart every Durable Object, and that Workers runtime updates can disconnect existing sockets. Active calls will drop on deploy. | SUSPECTED |
| B14 | No backpressure handling | Future code must watch `bufferedAmount`/relay queues. Neither browser nor relay currently has any flow control; a slow uplink with 20 ms frames can queue unboundedly. | NOT YET TESTABLE |
| B15 | Mobile viewport units | `h-screen`/`w-screen` (`App.tsx:68`) map to `100vh`/`100vw`, which on Android Chrome can include/exclude dynamic browser chrome inconsistently and cause clipped controls. `100dvh` is the safer choice. | SUSPECTED |
| B16 | State text hidden on phones | `VoiceControl.tsx:96` uses `hidden sm:block`; below 640 px the textual state (“Listening…”, “Tap to interrupt”) is hidden, leaving only icon colour/animation. | SUSPECTED (CSS verified) |
| B17 | Message ID collisions | IDs use `Date.now()` (`VoiceServiceMock.ts:77,87,139`); two same-kind messages in one millisecond would share a React key. No collision observed because no concurrency test exists. | SUSPECTED |

---

## 7. Security and Portability Findings

### 7.1 Secrets

| Check | Result | Label |
| --- | --- | --- |
| Secret-looking values in tracked files | None found (scan for `AIza…`, `sk-…`, `Bearer …`, assignment-style `api_key=`). Only agent-runtime logs outside the repo matched, and they are not tracked. | VERIFIED |
| Secret files in git history | Only `.env.example` (placeholder values). No `.env`, `.pem`, `.key`, or credential files were ever committed. | VERIFIED |
| `.env` present in working tree | No. | VERIFIED |
| Repository visibility | **Public.** Any future leak is immediate and permanent in history. | VERIFIED |
| Frontend env usage | No `import.meta.env` or `process.env` reads in `src/`. Only `DISABLE_HMR` in `vite.config.ts:17-19`. | VERIFIED |
| Unsafe `VITE_` secret convention | No `VITE_*` variables exist yet. Future rule: the Deepslate key must never be named `VITE_*`, because Vite inlines such values into client JS. | VERIFIED (current) |

No secret values are printed in this report because none were found.

### 7.2 Portability and onboarding

| ID | Finding | Label |
| --- | --- | --- |
| S1 | A fresh clone cannot be installed with `npm install` (D1), and no lockfile reproduces the working graph (D2). This is the single largest obstacle to rebuilding on another device. | CONFIRMED DEFECT |
| S2 | The README's Node requirement is wrong (D3); there is no `engines` field or `.nvmrc`. | CONFIRMED DEFECT |
| S3 | No Deepslate, Cloudflare, or secret-setup instructions exist. `README.md:75-82` describes only static Pages settings. | CONFIRMED DEFECT |
| S4 | `.env.example` is unrelated to the project (D17). | CONFIRMED DEFECT |
| S5 | `.gitignore` does not cover Wrangler/Cloudflare local secret files or non-`.local` env variants (D18). | CONFIRMED DEFECT |
| S6 | No device-specific absolute paths or Android/desktop-specific configuration were found; the code is portable in principle. | VERIFIED (positive) |
| S7 | No LICENSE file in a public repository. Not a runtime issue, but it leaves reuse rights undefined. | VERIFIED |
| S8 | No CI means “it built on the original machine” cannot be independently checked on GitHub. | CONFIRMED DEFECT |
| S9 | `README.md:22-43` project tree has malformed lines (entries beginning with `/` inside the `src/` tree) and omits `docs/`, tests, and deployment files. Documentation-only issue. | CONFIRMED DEFECT (docs) |
| S10 | Dev server binds `0.0.0.0:3000` (`package.json:7`). Convenient on a phone/LAN, but it exposes the dev server to the local network; acceptable for development, not for anything with real credentials. | VERIFIED |

### 7.3 Security design gap for the future relay

There is currently no browser→relay authentication concept. A deployed relay that accepts any browser
connection and attaches the Deepslate key would let anyone consume the owner's Deepslate quota. A
Stage 1/2 decision is required: Cloudflare Access, a signed session token issued by a Worker, or a
single-user shared secret with rate limiting. No such mechanism exists today.

---

## 8. Cloudflare Deployment Feasibility

### 8.1 What exists today

Nothing Cloudflare-specific exists beyond a static Vite build and three paragraphs of README. There is
no `wrangler.jsonc`/`wrangler.toml`, no Worker entry point, no Durable Object class, no binding, no
`_headers`/`_redirects`, no deployment workflow, and no secret configuration. `package.json` does not
depend on `wrangler`.

### 8.2 Capability matrix

| Requirement | Static Pages/Assets only | Workers + Durable Object relay |
| --- | --- | --- |
| Serve the React SPA | **Yes** (verified build output) | **Yes** (Static Assets binding) |
| Store Deepslate API key server-side | No | **Yes** (secret binding; never in client bundle) |
| Hold a long-lived WebSocket to Deepslate | No | **Yes** (outbound WebSocket from the DO/Worker) |
| Hold a long-lived browser WebSocket | No (request-scoped) | **Yes** (DO accepts browser WebSocket) |
| Relay binary audio both directions | No | **Yes** (binary frames, max 32 MiB per message) |
| Session identity / per-call state | No | **Yes** (one DO per session, SQLite-backed) |
| Survive deploys without dropping calls | No | **No** — deploys disconnect all WebSockets and restart DOs |

**Conclusion:** static Vite hosting alone cannot satisfy the server-side integration. A Cloudflare
Worker with a Durable Object (or an equivalent stateful relay) is required.

### 8.3 Recommended shape (not implemented)

```
Browser (React SPA, no key)
   │  wss://<app>/api/session/<sessionId>   [browser auth TBD]
   ▼
Cloudflare Worker  ── serves dist/ via Static Assets
   │  run_worker_first: ["/api/*"]
   ▼
Durable Object (one per session)
   │  fetch("wss://app.deepslate.eu/...", { headers: { Upgrade: "websocket", Authorization: `Bearer ${env.DEEPSLATE_API_KEY}` } })
   ▼
Deepslate realtime (protobuf binary frames)
```

- The DO owns both sockets and forwards protobuf frames **unmodified**; no protobuf parsing is needed
  for a transparent relay.
- The key lives in `env.DEEPSLATE_API_KEY` (Wrangler secret / dashboard secret), plus vendor ID,
  organization ID, and optional model ID. None may be prefixed `VITE_`.
- The DO can add relay-side session bookkeeping and retry/backoff, but it cannot resume a Deepslate
  session because no resume protocol is documented.
- Static Assets must be configured with SPA fallback (`not_found_handling =
  "single-page-application"`) and `/api/*` routed to the Worker first.

### 8.4 Verified runtime facts and limits

| Fact | Value / consequence | Label |
| --- | --- | --- |
| Outbound WebSockets from Workers | Supported. Custom handshake headers such as `Authorization` are sent via `fetch(url, { headers: { Upgrade: "websocket", ... } })`; `new WebSocket(url)` accepts no headers. | VERIFIED (Cloudflare docs) |
| DO as WebSocket server | Supported, with optional Hibernation API for server-side sockets. | VERIFIED |
| DO + outbound WebSocket | **Outgoing WebSockets do not hibernate**; an open outbound connection prevents eviction for up to 15 minutes and duration is billed while active. | VERIFIED (DO WebSocket docs) |
| Deploy behaviour | “Code updates disconnect all WebSockets… restarts every Durable Object.” | VERIFIED (DO WebSocket docs) |
| WebSocket frame size | 32 MiB maximum received by a Worker; larger closes with 1009. Audio frames are far smaller. | VERIFIED (Workers docs) |
| Workers CPU | Free plan 10 ms per invocation; Paid 30 s default (up to 5 min). Per-frame passthrough is cheap; per-frame protobuf decode/encode in the Worker is riskier on Free. | VERIFIED (Workers limits) |
| DO requests | Free 100,000/day; Paid 1M/month + $0.15/M. Includes incoming WebSocket messages and connection creation; outgoing WS messages and protocol pings are free. | VERIFIED (DO pricing) |
| Incoming WS billing ratio | 20 incoming messages count as 1 request for billing. | VERIFIED (DO pricing) |
| DO duration | Free 13,000 GB-s/day; Paid 400,000 GB-s/month. A relay with an outbound socket is duration-billed for the whole call. | VERIFIED (DO pricing) |
| DO free plan | SQLite-backed Durable Objects only. | VERIFIED (DO pricing) |
| Deepslate WebRTC | “Not yet available and still under construction”; session creation also needs the API key server-side. Not a viable browser-direct path today. | VERIFIED (Deepslate docs) |

**Derived capacity note (arithmetic, not a measurement):** 20 ms audio frames produce 50 incoming
WebSocket messages/s; with the 20:1 billing ratio that is 2.5 billable requests/s. On the Free plan,
100,000 requests/day is exhausted after ~40,000 s (about 11 hours) of active streaming per day. On
Paid, 1M included requests/month corresponds to ~111 hours of active streaming per month. Larger
frames or batching reduce this linearly at the cost of added uplink latency.

### 8.5 Runtime limitations / unresolved architectural decisions

1. **Browser authentication to the relay** is undefined (§7.3). Without it, the relay is an open
   gateway to paid Deepslate capacity.
2. **DO placement vs Deepslate region.** The DO location determines the second hop's RTT. Nothing can
   be decided until Deepslate's serving region and Cloudflare plan/location hints are confirmed.
3. **Deploy disconnects.** Every deployment drops active calls; the product needs a reconnect UX and
   a decision on auto-reconnect vs manual restart.
4. **Duration billing.** Because outbound sockets do not hibernate, every active call consumes DO
   duration for its entire length. Free-tier capacity must be checked before relying on it.
5. **Free plan vs Paid.** Free CPU (10 ms/invocation) and 100k/day requests may be adequate for a
   single-user prototype only if the relay does no per-frame protobuf work and frames are reasonably
   sized. Paid removes most of this risk.
6. **Static Assets vs Pages.** Workers + Static Assets allows one deployment and one origin for SPA +
   relay. Pages static + a separate Worker works but adds routing/CORS and a second deployment target.
   Pages Functions are not a documented long-lived WebSocket relay in the sources reviewed.
7. **No deployment configuration exists yet**, so none of the above can be validated by deploying the
   current repository.

---

## 9. Unresolved Questions

These cannot be answered from the repository and must be resolved before or during implementation.

| ID | Question | Why it matters | Status |
| --- | --- | --- | --- |
| U1 | Do you have a Deepslate API key, vendor ID, organization ID, and access to the desired Opal model (for example `opal-v2.1`)? | Nothing can connect without them; model access can return 403. | BLOCKING |
| U2 | Does Opal's full speech-to-speech mode deliver audio through `model_audio_chunk` **without** `tts_configuration`, or does the current WebSocket API require a TTS provider for audio output? The WebSocket page says audio chunks are sent only when a TTS provider is configured, while the Opal page describes native speech-to-speech output. | Determines whether the engine is S2S or text+TTS, and therefore the whole audio-output design. Official docs conflict; must be tested with a real session. | BLOCKING |
| U3 | Which sample rates/channel counts does the account's model actually accept on input and output (16 kHz documented in examples, 24 kHz claimed in the UI, 48 kHz used by WebRTC)? | Affects mic resampling, bandwidth, playback, and playback-byte accounting. | UNRESOLVED |
| U4 | How will the browser authenticate to the Cloudflare relay? | Without it, the relay exposes the owner's Deepslate quota. | BLOCKING for deployment |
| U5 | What happens to conversation context after a WebSocket reconnect? Is there an undocumented resume, or must the client re-initialise and replay context? | Determines reconnect UX and whether history must be replayed. | UNRESOLVED |
| U6 | Where do protobuf encode/decode live: browser (`protobufjs` bundle) or Worker/DO? | Adds client bundle weight and a new dependency vs Worker CPU cost and protocol coupling. | UNRESOLVED |
| U7 | Should the conversation UI be turn-based (one bubble per turn, upserted) or fragment-based? | The current append-only message model cannot represent streaming or rollback. | DESIGN DECISION |
| U8 | What are the target Android browser/device constraints (Chrome version, AudioWorklet support, echo cancellation, screen-lock behaviour)? | Affects capture, playback, and permission handling; cannot be validated on the original device from here. | UNRESOLVED |
| U9 | Cloudflare Free or Paid, and which DO location hint? | Determines CPU/request limits, duration billing, and second-hop latency. | UNRESOLVED |
| U10 | What latency budget counts as success (for example time from end of user speech to first audible response)? | Without a target, “low latency” cannot be evaluated. | UNRESOLVED |
| U11 | What data-retention settings are required (`X-Deepslate-Retain-*`)? | Privacy/compliance and whether audio is stored server-side. | UNRESOLVED |
| U12 | Who owns/rotates the Deepslate key, and is there a staging key? | The repository is public; separate development and production keys reduce blast radius. | UNRESOLVED |
| U13 | Is text input (`UserInput.text_data`) part of v1, and how does it interact with turn IDs and the text fallback UI? | The UI already exposes a text box; the protocol supports text input, but the service contract does not. | SCOPE DECISION |
| U14 | Are tool calls / `turn_snapshot` / `model_speech_progress` required for v1? | Affects the size of the first real implementation. | SCOPE DECISION |
| U15 | How will deployment be performed from an Android phone (Cloudflare dashboard, GitHub Actions, or Wrangler in Termux)? | The user explicitly needs to rebuild/deploy from another device; the current repo has no CI or deployment instructions. | UNRESOLVED |

---

## 10. Recommended Implementation Stages

Ordered by risk reduction. Each stage must leave the app buildable; no stage should combine transport,
audio DSP, and UI redesign in one change.

| Stage | Goal | Main deliverables | Exit criteria |
| --- | --- | --- | --- |
| **1** | Reproducible foundation + protocol proof | Fix dependency graph, lockfile, Node engines, strict TS, env/gitignore docs; local Deepslate protocol spike; tests for the service contract | Clean `npm ci` + lint + build + tests pass on a fresh clone; spike answers U2/U3/U5 with recorded evidence |
| **2** | Contract v2 + state machine | `VoiceService` v2 (turns, audio events, errors, reconnect), turn-based message model, reducer/state tests; mock upgraded to exercise every state | UI runs unchanged visually but all states/errors are reachable and tested |
| **3** | Secure relay | Worker + Durable Object, browser auth, secret bindings, binary passthrough, deploy config, local `wrangler dev` | Browser can open a relayed session and exchange binary frames; key never in bundle |
| **4** | Microphone uplink | `AudioWorklet` capture, 48 k→target-rate conversion, int16 framing, packet IDs, mode/turn semantics, uplink diagnostics | Speech reaches Deepslate; measurable capture-to-send latency on the Android target |
| **5** | Downlink, playback, barge-in | PCM queue/scheduler, turn-ID guards, `playback_clear_buffer`, playback-position reports, interruption UX | User can interrupt mid-response and hears no stale audio; reported bytes match playback |
| **6** | Reliability + release | Reconnect/backoff, heartbeats, error surfaces, deploy/rollback docs, device testing, observability | Documented recovery from network loss and deploy; repeatable deployment from GitHub |

Explicit non-goals for Stage 1: no microphone capture, no audio playback, no UI redesign, no production
relay deployment, no Deepslate feature beyond the local spike.

---

## 11. Proposed Stage 1

### 11.1 Objective

Make the repository reproducible on a fresh device and prove the Deepslate protocol assumptions with a
local, non-deployed spike — **without changing how the app looks or behaves** and without shipping any
credential. This removes the blockers that would otherwise make all later work unverifiable.

### 11.2 Work items (in priority order)

**P0 — Clean install (requires approval to edit `package.json` + add a lockfile)**

1. Resolve the `esbuild` conflict in one of two ways:
   - remove the direct `esbuild` devDependency (Vite supplies its own), or
   - pin it to a version satisfying Vite 8's peer range (`^0.27.0 || ^0.28.0`).
2. Commit `package-lock.json` generated by a successful plain `npm install` (not `--legacy-peer-deps`).
3. Add `"engines": { "node": ">=20.19.0" }` and optionally `.nvmrc`; correct `README.md:48`.
4. Move `vite`, `@vitejs/plugin-react`, and `@tailwindcss/vite` to `devDependencies`.
5. Remove unused dependencies (`@google/genai`, `express`, `dotenv`, `motion`, `tsx`, `autoprefixer`,
   `@types/express`) **only if** the spike does not need `tsx`; otherwise retain `tsx` as a devDependency.
   This is a dependency change and needs explicit approval.

**P0 — Repository hygiene (documentation/config only)**

6. Replace `.env.example` with project-relevant placeholders only:
   `DEEPSLATE_API_KEY`, `DEEPSLATE_VENDOR_ID`, `DEEPSLATE_ORGANIZATION_ID`, `DEEPSLATE_MODEL_ID`,
   `RELAY_SESSION_SECRET` — no values, with a comment that they are server-side only.
7. Extend `.gitignore`: `.env.*` (while keeping `.env.example`), `.dev.vars*`, `.wrangler/`,
   `*.tsbuildinfo`, `coverage/`, `.idea/`, `.vscode/` (or explicitly commit only shared settings).
8. Rewrite README setup/deployment sections: correct Node version, exact install/build commands, a
   clear statement that static hosting is not sufficient for the voice engine, and a placeholder
   Cloudflare section that does not claim a relay exists.
9. Delete or fix `package.json:10` (`server.js`).

**P1 — Type safety**

10. Enable `strict: true` in `tsconfig.json`; fix any resulting errors. Add `noUnusedLocals` and
    `noUnusedParameters` only after the unused-import cleanup, so the build stays green.
11. Keep `npm run lint` as the type check but document it accurately; add ESLint only in a later stage
    if desired (new dependency, separate approval).

**P1 — Protocol spike (new dev-only files, no bundling, no deployment)**

12. Add `scripts/deepslate-spike.mjs` (or `.ts`) that:
    - reads credentials from environment variables (never hard-coded),
    - connects to the documented `wss://app.deepslate.eu/...` endpoint with a Bearer header,
    - sends `InitializeSessionRequest` and a synthetic/optional microphone WAV or tone,
    - logs event types and turn IDs, time to `session_ready`, time to first `model_audio_chunk`,
    - tries the session **with and without** `tts_configuration` to answer U2,
    - tests 16 kHz and 24 kHz input/output acceptance to answer U3,
    - sends a `PlaybackPositionReport` and checks that it is accepted,
    - sends `ping` and measures `pong` round-trip,
    - never writes audio or transcripts to the repository by default.
13. This requires `ws` and `protobufjs` as **devDependencies** (or a Wrangler-based local harness). This
    is a new dependency and must be explicitly approved before Stage 1 execution.
14. Record the spike's actual output in `docs/deepslate-spike-results.md`. If credentials are absent,
    record “BLOCKED: missing credentials” rather than inventing results.

**P2 — Regression safety**

15. Add a `test` script using Node's built-in `node:test` runner (no new framework) covering the current
    `VoiceService` contract: subscriber replay, unsubscribe, connect/disconnect transitions, duplicate
    connect behaviour (documenting D7), and stale timer behaviour (documenting D8). The tests should
    initially document current behaviour, then be updated when the contract changes in Stage 2.
16. Add a GitHub Actions workflow: `npm ci`, `npm test`, `npm run lint`, `npm run build` on Node 22 and
    24. This validates the Android-independent rebuild path and keeps the public repo honest.

### 11.3 Acceptance criteria

- On a clean machine: `npm ci` (plain, no flags) → `npm test` → `npm run lint` → `npm run build` all
  exit 0.
- `git ls-files` contains exactly one lockfile; `package.json` has a correct `engines` field.
- `tsc --showConfig` shows `strict: true`.
- No secret values in tracked files or history; `.env.example` contains only placeholders and the
  correct variable names.
- The SPA's rendered behaviour is unchanged (same components, same mock, same text) except corrected
  documentation strings if explicitly approved.
- `docs/deepslate-spike-results.md` exists and reports either measured protocol facts or a precise
  blocker; no speculative protocol claims.

### 11.4 Approvals required before Stage 1 execution

1. Editing `package.json` (dependency removal/relocation, engines, clean script).
2. Adding `package-lock.json`.
3. Enabling TypeScript strict options.
4. Adding `ws` + `protobufjs` as devDependencies for the local spike, or approving a Wrangler-based
   alternative (also a new dependency).
5. Creating a GitHub Actions workflow.
6. Correcting/removing misleading UI text in `SettingsModal` (source change; otherwise deferred to
   Stage 2).

### 11.5 Why this is the safest next step

- It fixes the only problem that blocks every other task: the project cannot currently be installed
  from a fresh clone.
- It resolves the protocol ambiguity (U2) that could invalidate the entire audio-output design, before
  any UI or relay work is committed to it.
- It adds verification (lockfile, tests, CI) that makes later stages reviewable from a phone or any
  other device.
- It deliberately leaves the working UI, mock, and architecture untouched.

---

## Appendix A — Commands executed (actual results)

```text
node -v                                  → v24.15.0
npm -v                                   → 11.12.1
git rev-parse HEAD origin/main           → both 32ab385d32736e2c143f02b1c8756eec3a47760c
gh repo view ... --json visibility       → PUBLIC
npm install                              → FAILED (ERESOLVE: vite@8.3.5 vs esbuild@0.25.12)
npm install --legacy-peer-deps --no-package-lock → added 182 packages (exit 0)
npm run lint                             → exit 0 (tsc 7.0.2, no diagnostics)
npm run build                            → exit 0 (vite 8.3.5, 1666 modules, 209 ms; __dirname warning)
npx vite preview + curl /                → HTTP 200 (898 bytes)
curl /assets/index-BkmRUkQ1.js           → HTTP 200
tsc --showConfig                         → no strict option
```

## Appendix B — Sources consulted

- Deepslate: `llms.txt`, `websocket.md`, `webrtc.md`, `opal.md`, `api-reference/realtime.md`, and
  `realtime.proto` (all fetched 2026-10-22).
- Cloudflare: Workers WebSockets runtime API; Durable Objects “Use WebSockets”; Workers platform
  limits; Durable Objects pricing; Workers Static Assets (all fetched 2026-10-22).

---

*End of Stage 0 audit. No implementation was performed.*
