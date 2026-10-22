# Opal Voice — Stage 1B Protocol Proof

**Date:** 2026-10-22
**Branch:** `cline/6trq5jvz`
**Base commit:** `efdc722` (Stage 1A complete)
**Live test:** **Not performed — no Deepslate credentials were available.**
**Official documentation snapshot:** `rooms-solutions/deepslate-docs` @ `a5d4cd0bcc89f14ce643a6e8aabe9f3dc1c510bc`
**Official SDK source snapshot:** `deepslate-labs/deepslate-sdks` @ `258ed122eaf9fec35f3df874a3d51a8a3cbed76d`

Evidence labels used throughout:

- **DOCUMENTED** — stated in official documentation, the protocol definition, or official SDK source.
- **LIVE-VERIFIED** — observed by executing an authenticated session. **None in this stage.**
- **UNRESOLVED** — not established by available evidence.

---

## 1. Executive Conclusion

**Classification: PARTIALLY VERIFIED — TTS configuration required.**

The current official Realtime documentation and the official SDK source both state that audio
output over the Deepslate WebSocket API is enabled by `tts_configuration`. If it is omitted, the
server returns text fragments only. There is no documented or SDK-exposed "native Opal audio"
provider, flag, or mode in the Realtime session configuration.

However, because no Deepslate credentials were available, **no live session was established**, no
initialization request was accepted, and no audio payload was received. The conclusion is therefore
supported by documentation and official SDK source, not by an executed test.

A second distinction matters and remains open:

- **API contract:** `tts_configuration` is required for audio. This is strongly supported.
- **Internal synthesis:** whether the Deepslate-hosted TTS provider uses Opal's native speech
  decoder or a separate TTS model is **not documented**. The Opal page says Opal generates audio
  output in a single model; the Realtime API still requires a TTS configuration. These statements
  are not reconciled anywhere in the official material reviewed.

It is therefore incorrect to conclude that "Opal does not generate speech." The correct conclusion
is narrower: **the Realtime API does not expose audio output unless a TTS provider is configured.**

---

## 2. Evidence

### 2.1 Official documentation

| Source | Finding | Label |
| --- | --- | --- |
| `api-reference/realtime.mdx` — `TtsConfiguration` | "Optional text-to-speech configuration. If omitted, raw text fragments are sent." | DOCUMENTED |
| `websocket.mdx` — Handle Responses | "`ModelAudioChunk` — sent only when a **TTS provider is configured**." | DOCUMENTED |
| `websocket.mdx` — Complete Example | "It configures no TTS provider, so the server returns text rather than speech." | DOCUMENTED |
| `api-reference/realtime.mdx` — `ModelAudioChunk` | "TTS audio output when a TTS provider is configured." | DOCUMENTED |
| `api-reference/realtime.mdx` — `InitializeSessionRequest` | `tts_configuration` is listed as an optional TTS provider config; `output_audio_line` is always a session field. | DOCUMENTED |
| `livekit-node.mdx` — `RealtimeModel` options | `ttsConfig` default `undefined`; "TTS configuration (enables audio output)." | DOCUMENTED |
| `livekit-node.mdx` — HostedTtsConfig | "Use a voice cloned and hosted within Deepslate — no external TTS provider credentials required. Pass it as `ttsConfig` to enable audio output." | DOCUMENTED |
| `pipecat.mdx` — Hosted/ElevenLabs configs | "Pass an instance to `DeepslateRealtimeLLMService(tts_config=...)` to enable PCM audio output." | DOCUMENTED |
| `api-reference/realtime.proto` | `tts_configuration` is field 5 on `InitializeSessionRequest` and is `optional`. `TtsConfiguration` has exactly two providers: `eleven_labs` and `hosted`. | DOCUMENTED |
| `opal.mdx` | Opal is an end-to-end S2S model that "processes audio input and generates audio output in a single unified model"; it supports Full Speech-to-Speech and Speech-to-Text modes. | DOCUMENTED |

### 2.2 Official SDK source

These are official Deepslate SDKs linked from `sdks.mdx` and the documentation site.

| Source | Finding | Label |
| --- | --- | --- |
| `node/packages/livekit/src/realtime/model.ts:95` | `const audioOutput = options.ttsConfig != null;` — audio capability is false when no TTS config is supplied. | DOCUMENTED (SDK) |
| `node/packages/livekit/src/realtime/model.ts:533` | `const hasAudio = this.model.ttsConfig != null;` | DOCUMENTED (SDK) |
| `python/packages/livekit/.../_model.py:1067-1075` | With TTS: modalities `["audio"]`; without TTS: modalities `["text"]` and the audio channel is closed. | DOCUMENTED (SDK) |
| `python/packages/livekit/.../_model.py:759` | Text fragments are forwarded as text when `_tts_config is None`. | DOCUMENTED (SDK) |
| `python/packages/livekit/.../_model.py:916` | Without TTS, the generation settles on `ResponseEnd`; there is no playback/audio phase. | DOCUMENTED (SDK) |
| `python/packages/core/README.md:103` | "Two TTS providers are supported. Pass either config as `tts_config` to `DeepslateSession.create()`." | DOCUMENTED (SDK) |
| `node/packages/core/src/session.ts:227` | SDK default initialization is 24,000 Hz, mono, when `initialize()` is called without values. | DOCUMENTED (SDK) |
| `node/packages/core/src/client.ts:237-280` | Reconnect uses exponential backoff (1, 2, 4 … capped at 30 s); each connection re-runs session initialization. No resume/history replay was found. | DOCUMENTED (SDK) |
| Search of core/LiveKit SDK source | No `native`, `opal-audio`, or no-TTS audio-output option exists. The only audio switch is `ttsConfig` / `tts_config`. | DOCUMENTED (SDK) |

### 2.3 Documentation contradiction and how it is treated

The Opal page describes native speech-to-speech audio generation. The Realtime API pages and SDK
consistently require a TTS configuration for audio. The docs do not state that the Realtime API
exposes Opal's native speech decoder directly, nor do they state that it does not.

**Treatment:** resolve the API contract (TTS config required for audio) but preserve the internal
synthesis ambiguity as **UNRESOLVED**. Do not infer from the API contract that Opal cannot generate
speech, and do not infer from the marketing description that audio arrives without configuration.

### 2.4 Model-version scope

The current docs list `opal-v2.1` as the platform default and `opal-v3.0-preview` as a preview model.
No model-specific difference in TTS requirements is documented. Model selection is independent of
`tts_configuration` in the endpoint path and SDK options.

**No model was tested.** Any model-specific behavior is **UNRESOLVED**.

---

## 3. Live-Test Results

### 3.1 Credential availability

Checked by name only; no environment-variable values were read or printed. The workspace contains no
`.env`, `.env.local`, or `.dev.vars` file.

| Variable | Status |
| --- | --- |
| `DEEPSLATE_API_KEY` | unset |
| `DEEPSLATE_VENDOR_ID` | unset |
| `DEEPSLATE_ORGANIZATION_ID` | unset |
| `DEEPSLATE_MODEL_ID` | unset |
| `ELEVENLABS_API_KEY` | unset |

No hosted Deepslate voice ID was available either. Consequently, neither a no-TTS session nor a
TTS-enabled session could be opened legitimately.

### 3.2 What was actually executed

- Read the official documentation and protocol definitions listed at the end of this document.
- Compared the documentation-site proto with the GitHub-hosted proto; they are byte-identical.
- Inspected the official SDK source for the audio-output gate, initialization construction, default
  sample rate, and reconnect loop.
- Checked for credential presence and local env files by name only.

**No WebSocket connection was attempted**, because there was no valid Bearer credential. **No live
protocol event was observed.**

### 3.3 Required live evidence and its status

| Event / check | Status |
| --- | --- |
| WebSocket connection established | **BLOCKED — no API key** |
| Session initialization accepted | **BLOCKED — no session** |
| Input accepted | **BLOCKED — no session** |
| Model response started (`ResponseBegin`) | **BLOCKED — no session** |
| Text response received | **BLOCKED — no session** |
| Audio event received (`ModelAudioChunk`) | **BLOCKED — no session** |
| Actual non-empty audio payload | **BLOCKED — no session** |
| Response completed (`ResponseEnd` / `TurnSnapshot`) | **BLOCKED — no session** |
| Connection closed cleanly | **BLOCKED — no session** |

There is no sanitized test output to include because no session was opened. No speech output is
claimed.

### 3.4 Why no test script was committed

A runnable protocol test needs at least a WebSocket client and a protobuf runtime (`ws` and
`protobufjs` for Node). Adding those unexecutable dependencies would expand Stage 1B without
producing evidence. Per the stage instructions, the documentation investigation was completed and
the live checks are reported as blocked instead.

### 3.5 Minimal test design for when credentials exist

This is the smallest test that would answer the question without implementing an audio engine:

1. Read `DEEPSLATE_API_KEY`, `DEEPSLATE_VENDOR_ID`, and `DEEPSLATE_ORGANIZATION_ID` from the local
   server-side environment; redact all three from output.
2. Connect to
   `wss://app.deepslate.eu/api/v1/vendors/{vendorId}/organizations/{organizationId}/realtime/opal-v2.1`
   with `Authorization: Bearer <key>` in the handshake headers.
3. Send `InitializeSessionRequest` with 16 kHz or 24 kHz mono signed-16 PCM, the documented VAD
   defaults, a one-sentence system prompt, and **no** `tts_configuration`.
4. Send a documented `UserInput.textData` stimulus with `mode = IMMEDIATE` (simpler than synthetic
   speech and sufficient to trigger a turn), then record every event type and turn ID.
5. Confirm text output and explicitly confirm the presence or absence of `ModelAudioChunk`.
6. Reconnect with a second, separate session that includes the minimum hosted TTS configuration
   (`hosted.voiceRef.voiceId` for a voice already in the account, mode `HIGH_QUALITY`). Repeat the
   stimulus and count non-empty audio payloads; record byte counts, sample rate, channels, and the
   interval from `ResponseBegin` to the first audio chunk.
7. Optionally repeat with 20 ms/100 ms synthetic PCM input to validate input framing and VAD.
8. Send `PlaybackPositionReport` after simulated playback only if audio is received; test `Ping`
   after 10 s idle.
9. Close cleanly, redact identifiers and tokens, and record the result without conversation text.

This would require a valid hosted voice ID or an ElevenLabs key plus voice ID. No default hosted
voice is documented.

---

## 4. Session Initialization

### 4.1 Confirmed request format

| Item | Requirement | Label |
| --- | --- | --- |
| Endpoint | `wss://app.deepslate.eu/api/v1/vendors/{vendorId}/organizations/{organizationId}/realtime` | DOCUMENTED |
| Model pinning | Append `/{modelId}`, e.g. `/opal-v2.1`; omit for platform default | DOCUMENTED |
| Authentication | `Authorization: Bearer <API_KEY>` on the WebSocket handshake; server-side only | DOCUMENTED |
| First message | `ServiceBoundMessage.initializeSessionRequest`, binary protobuf | DOCUMENTED |
| Core session config | `input_audio_line`, `output_audio_line`, `vad_configuration`, `inference_configuration` (proto3 fields are technically optional on the wire; the documented example includes all four) | DOCUMENTED |
| Optional session config | `tts_configuration`, `supports_playback_reporting`, `enable_vad_frame_telemetry`, `experiments` | DOCUMENTED |
| Readiness | Wait for `SessionReady` before sending input; docs say it is sent after TTS warm-up | DOCUMENTED |
| Retention headers | Optional `X-Deepslate-Retain-Zero-Data` / `X-Deepslate-Retain-Audio` | DOCUMENTED |

`SessionReady` being described as arriving "after TTS warmup completes" even when no TTS is
configured is a documentation ambiguity. Whether a text-only session still receives `SessionReady`
is **UNRESOLVED** until tested.

### 4.2 Minimum TTS configuration (not used — no credentials)

`TtsConfiguration` has exactly one provider selected:

```
tts_configuration
  hosted
    voice_ref { voice_id: "<Deepslate-hosted voice id>" }
    mode: HIGH_QUALITY
```

Alternative: `eleven_labs { api_key, voice_id, model_id?, voice_settings?, location? }`. The
ElevenLabs path requires an external provider key. The hosted path requires no external provider
key but does require a voice ID that already exists in the Deepslate account, or an inline
`voice_clone_v1` reference sample with exact transcript.

No default hosted voice, default voice ID, or automatic voice selection is documented.

### 4.3 What could not be confirmed

- Whether the server accepts initialization with no TTS provider and still emits `SessionReady`.
- The exact error (category/message) when audio is expected without TTS configuration.
- Whether the hosted provider is available to every organization.
- Whether `output_audio_line` is validated when no TTS provider is configured.
- Model-specific behavior for `opal-v2.1` versus `opal-v3.0-preview`.

All of the above are **UNRESOLVED**.

---

## 5. Audio Output

### 5.1 Hypothesis result

| Hypothesis | Result | Evidence |
| --- | --- | --- |
| A — native Opal audio without TTS configuration | **Not supported by any API-level documentation or SDK behavior** | Docs say no TTS means text only; SDK sets `audioOutput = ttsConfig != null`; no native provider exists in the proto |
| B — TTS configuration required for audio | **Supported by docs and official SDK source; live behavior untested** | `TtsConfiguration` omission yields text; `ModelAudioChunk` only with TTS; plugins require `ttsConfig` to enable audio |

**Classification: PARTIALLY VERIFIED — TTS configuration required.**

This is an API-level conclusion. It does **not** prove that Opal's speech decoder is unused. The
hosted provider may be a Deepslate-hosted synthesis system built on Opal, or a separate TTS model;
the documentation does not say. That internal question is **UNRESOLVED**.

### 5.2 Two distinct audio configurations

1. **No TTS configuration** — server streams text (`ModelTextFragment`); no `ModelAudioChunk` is
   expected; `ModelSpeechProgress` is described as TTS-playback-paced and is not expected to carry
   useful audio progress. DOCUMENTED.
2. **TTS configured** — `ModelAudioChunk` carries synthesized audio; `ModelSpeechProgress` reports
   audible text; playback-position reporting can be used. DOCUMENTED.

### 5.3 Actual payload status

- Audio event received: **NO — no session**.
- Actual audio payload received: **NO — no session**.
- Audio format observed from a live `ModelAudioChunk`: **NONE**.
- Speech generation observed: **NO**.

No audio claim is made beyond the documented contract.

---

## 6. Input/Output Formats

| Property | Documented detail | Label |
| --- | --- | --- |
| Input encoding | Raw PCM; 16-bit signed integer is recommended; docs explicitly state little-endian for 16-bit | DOCUMENTED |
| Input sample rate | Configurable via `AudioLineConfiguration.sample_rate`; docs example 16,000 Hz; official SDK `initialize()` default 24,000 Hz; reconfiguration example uses 48,000 Hz | DOCUMENTED (values vary) |
| Input channels | `channel_count`; examples use mono (1) | DOCUMENTED |
| Input message | `UserInput { packet_id, mode, audio_data }`; `packet_id` is client-chosen `uint64`, `mode` is `NO_TRIGGER`/`QUEUE`/`IMMEDIATE` | DOCUMENTED |
| Input framing | No protocol-mandated frame size. Docs example uses 100 ms (1,600 samples at 16 kHz) | DOCUMENTED |
| Output format | `ModelAudioChunk.audio` bytes match `output_audio_line`; the chunk itself carries no format metadata | DOCUMENTED |
| Output sample rate | Configurable; docs example 16,000 Hz; SDK default 24,000 Hz | DOCUMENTED (values vary) |
| Output channels | Configurable; examples use mono | DOCUMENTED |
| Output chunking | No chunk size or cadence documented | UNRESOLVED |
| Turn association | `ModelAudioChunk.turn_id` is optional; when absent, use the turn opened by the most recent `ResponseBegin`; turn IDs are 0-based | DOCUMENTED |
| Ordering | WebSocket message order applies; `ResponseEnd` is sent after all audio for the turn. No per-chunk sequence number exists | DOCUMENTED / partially UNRESOLVED |
| Completion | `InferenceComplete` (LLM done, TTS may continue), `ResponseEnd` (all audio sent), `TurnSnapshot.is_final` (content immutable) | DOCUMENTED |
| Interim format changes | `ChatAudioData` in snapshots carries format metadata and may change if the pipeline is reconfigured; `ModelAudioChunk` does not | DOCUMENTED |

**Practical note:** at 16 kHz mono signed 16-bit, audio is 32,000 bytes/s; at 24 kHz it is 48,000
bytes/s. A 100 ms frame is 3,200 or 4,800 bytes respectively.

**Unresolved:** which sample rates the account's model actually accepts, and whether 16 kHz and
24 kHz produce different quality or latency. No live test was possible.

---

## 7. Interruption, Playback Reporting, and Session Lifetime

### 7.1 Interruption

| Behavior | Detail | Label |
| --- | --- | --- |
| `PlaybackClearBuffer` | Server sends it proactively when the user starts speaking, regardless of whether audio is currently playing. Client must stop current playback and discard queued audio | DOCUMENTED |
| VAD alternative | `PlaybackClearBuffer` is described as soft-deprecated in favor of the more informative `VadStateEvent` stream, but it is still sent for compatibility | DOCUMENTED |
| Inferencing interruption | Sending `UserInput` with `mode = IMMEDIATE` interrupts any ongoing inference and starts a new one | DOCUMENTED |
| `DirectSpeech` | Behaves like an interruption: cancels active inference and clears buffered audio before speaking the directive | DOCUMENTED |
| Acknowledgment | No client acknowledgment for `PlaybackClearBuffer` is documented | UNRESOLVED |
| Actual timing/latency of interruption | Not measured | UNRESOLVED |
| Stale in-flight chunks after clear | Not documented; implementation must defensively drop by turn/generation | UNRESOLVED |

### 7.2 Playback-position reporting

- `PlaybackPositionReport { bytes_played: uint64, turn_id: uint32 }` is optional but supported.
  DOCUMENTED.
- Counts are per-turn, cumulative bytes — not per session and not a delta. DOCUMENTED.
- `supports_playback_reporting: true` is only a hint; the server honours reports whenever they
  arrive. DOCUMENTED.
- Without reports, the server falls back to an elapsed-time estimate for context truncation; the
  same estimate drives `ModelSpeechProgress.audio_bytes_played`. DOCUMENTED.
- Whether reports are required at all for acceptable behavior is not stated; they are for accuracy.
- Whether the server accepts reports for a turn after `TurnSnapshot.is_final` is **UNRESOLVED**.
- No report was sent in this stage.

### 7.3 Idle timeout and keepalive

- The proto comment states sessions typically time out after about 30 seconds without client
  packets, and recommends an unconditional `Ping` every 10 seconds or less when idle. DOCUMENTED.
- Actual deployment timeout values are not published. UNRESOLVED.
- The official SDK source did not contain an automatic application-level heartbeat in the core
  session paths inspected. During continuous audio, the audio messages themselves keep the session
  alive. UNRESOLVED for idle UI modes.

### 7.4 Connection closure and reconnect

- `SessionErrorNotification` is sent before the server closes on a session error. DOCUMENTED.
- Close codes and their meanings are not documented. UNRESOLVED.
- No session-resume, replay, or context-restore message exists in the protocol. DOCUMENTED (absence).
- The official SDK retries with exponential backoff and re-sends `InitializeSessionRequest` on each
  connection; no conversation-history replay was found. DOCUMENTED (SDK).
- Whether the server retains conversation state across a new connection is not documented; the
  conservative assumption is **no**. UNRESOLVED.

---

## 8. Security

- No credentials were present in the environment and none were requested, printed, or committed.
- The repository is public. The protocol test, had it been added, would read all secrets from
  server-side environment variables.
- No `VITE_*` variable or frontend credential path was introduced.
- No test script, dependency, or generated audio/transcript was added, so there is no test output to
  leak.
- Existing `.gitignore` rules already exclude `.env`, `.env.*`, `.dev.vars*`, and `.wrangler/`;
  `.gitignore` was not weakened.
- Future live-test output must redact `Authorization`, API keys, vendor/organization IDs, hosted
  voice IDs, and conversation content. A sanitized event-type log is sufficient.
- The Deepslate key must remain server-side. A future relay must not expose it to the browser.

---

## 9. Implementation Implications

The future audio engine must treat TTS configuration as an explicit product decision, not an
assumption:

1. **Choose a voice strategy before audio work.** Use a Deepslate-hosted voice ID (no external TTS
   credentials) or ElevenLabs (external key + voice ID). There is no documented default voice and no
   no-configuration audio mode.
2. **Send `tts_configuration` deliberately.** Without it, the engine will receive text only. A
   text-only mode is still useful for the existing text fallback and diagnostics.
3. **Do not claim "native Opal audio" in UI or docs** until a live test (or vendor confirmation)
   establishes what the hosted TTS path actually uses. The API contract requires TTS configuration.
4. **Pin an explicit audio format.** Docs examples use 16 kHz, the official SDK defaults to 24 kHz,
   and reconfiguration shows 48 kHz. Choose one rate/channel/format, put it in session init, and do
   not rely on defaults. The engine must resample device audio to that format.
5. **Model the turn lifecycle, not just text.** Track `ResponseBegin`, `ModelTextFragment`,
   `ModelAudioChunk` (optional turn ID), `ModelSpeechProgress`, `InferenceComplete`, `ResponseEnd`,
   and `TurnSnapshot.is_final`. Audio and text are separate streams with separate completion points.
6. **Keep format metadata from init.** `ModelAudioChunk` has no format field; playback must use the
   session `output_audio_line` (or `ChatAudioData.format` from snapshots).
7. **Implement barge-in defensively.** On `PlaybackClearBuffer`, stop sources and discard all queued
   audio; also guard against late chunks by turn/generation ID. VAD events are the richer signal.
8. **Report playback bytes per turn.** Use them for accurate interruption truncation and
   `ModelSpeechProgress` accuracy; bytes must correspond to Deepslate output bytes, not resampled
   device bytes.
9. **Plan reconnect as a new session.** Re-initialize and expect context loss unless vendor
   documentation later says otherwise. Add heartbeats for idle periods (≤10 s).
10. **Keep credentials server-side.** The browser relay design from Stage 0 remains necessary; the
    key cannot be moved into the SPA to avoid the relay.

---

## 10. Unresolved Questions

1. Does a real no-TTS session emit `SessionReady` and complete a text turn exactly as documented?
2. Does any Opal model (`opal-v2.1`, `opal-v3.0-preview`) emit native audio without a TTS config in
   a raw WebSocket session, contrary to the documentation/SDK?
3. Does the Deepslate-hosted TTS provider use Opal's native speech decoder or a separate TTS model?
4. What hosted voice IDs/default voices are available to a new organization, and is a hosted voice
   required before any audio can be requested?
5. Which input/output sample rates and channel counts does the account actually accept, and what is
   the default if fields are omitted?
6. What is the exact error category/message when audio is expected without TTS configuration?
7. Is `SessionReady` delayed by TTS warm-up even when no TTS is configured?
8. What are the real idle-timeout and close-code values in production?
9. Is any conversation context retained across a reconnect? Is replay required?
10. Is there a documented chunk-size/cadence guarantee for `ModelAudioChunk`?
11. Does `hosted.voiceCloneV1` reference length follow the 10–15 s docs or the 20–25 s proto comment?
12. What latency does hosted `HIGH_QUALITY` versus `LOW_LATENCY` add in practice?
13. Are playback-position reports accepted after a turn is finalized?
14. What data-retention setting will the deployed session use?

---

## References

- https://docs.deepslate.eu/llms.txt
- https://docs.deepslate.eu/websocket
- https://docs.deepslate.eu/api-reference/realtime
- https://docs.deepslate.eu/opal
- https://docs.deepslate.eu/livekit-node
- https://docs.deepslate.eu/pipecat
- https://docs.deepslate.eu/webrtc
- https://raw.githubusercontent.com/rooms-solutions/deepslate-docs/refs/heads/main/api-reference/realtime.proto
- https://github.com/deepslate-labs/deepslate-sdks (snapshot `258ed122`)

*End of Stage 1B documentation investigation. No live Deepslate session was established, no audio
payload was received, and no audio engine was implemented.*
