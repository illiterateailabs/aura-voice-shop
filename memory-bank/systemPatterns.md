# System Patterns – Aura Voice Shop

## 1. Overall System Architecture

```
Browser (React)                               Node.js Server                       Google Cloud
┌────────────────────┐  WSS/JSON  ┌──────────────────────────────┐  WSS/PROTO  ┌──────────────────────────┐
│ VoiceInputManager  │◀──────────▶│ Express + ws                │◀───────────▶│ Gemini Live API          │
│  • AudioWorklet    │  audio     │  • SessionRouter            │  audio/text │  • STT + NLU Streaming   │
│  • VAD (Strategy)  │  control   │  • GeminiService (Gateway)  │             │  • Native Audio Out      │
│  • Streamer (Obs.) │  events    │  • Product/Cart Proxy (TODO)│             └──────────────────────────┘
└────────────────────┘             └──────────────────────────────┘
          ▲                                    ▲
          │ Zustand stores (observer)          │ REST
          ▼                                    ▼
┌────────────────────┐             ┌──────────────────────────────┐
│ React Screens      │             │ E-commerce Backend (future)  │
│  • Products/Grid   │             │  /api/products, /api/cart…   │
│  • Cart/Checkout   │             └──────────────────────────────┘
└────────────────────┘
```

* **Edge**: Browser captures 16-bit PCM 16 kHz, applies client-side VAD, streams only speech.
* **Gateway**: Node server multiplexes many browser sockets into Gemini Live API sessions.
* **LLM**: Gemini returns **structured JSON** (`responseMimeType:"application/json"`) with `intent`, `entities`, `parameters`.

---

## 2. Component Relationships

| Component | Owned By | Depends On | Pattern |
|-----------|----------|------------|---------|
| `VoiceInputManager` | React | `audioProcessor`, `voiceActivityDetection`, `websocketAudioStreamer`, Zustand stores | **Facade** for browser audio/UI |
| `audioProcessor` | Front-end utils | Web Audio API | **Adapter** (Float32 → Int16 PCM) |
| `voiceActivityDetection` | Front-end utils | `audioProcessor` | **Strategy** pattern (energy vs. future ML VAD) |
| `websocketAudioStreamer` | Front-end utils | Browser WebSocket | **Observer + Queue** (event emitter & back-pressure) |
| `SessionRouter` (server) | Express | `GeminiService` | **Mediator** between client sockets & Gemini |
| `GeminiService` | Server | `@google/generative-ai` | **Gateway / Singleton** for LLM sessions |
| Prompt Config | Server | — | **Builder** (combines main + examples) |
| Zustand Stores | React | — | **Observable State** pattern |

---

## 3. Key Design Patterns Used

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Observer / EventEmitter** | `websocketAudioStreamer`, `GeminiService` | Decouple streaming logic from UI / WS transport. |
| **Gateway** | `GeminiService` | Centralises Gemini Live API calls, hides SDK details. |
| **Facade** | `VoiceInputManager` | Presents simple API (toggle listen) over complex audio/VAD/stream processing. |
| **Strategy** | `voiceActivityDetection` | Pluggable speech-detection algorithms (energy vs ML). |
| **Adapter** | `audioProcessor` | Adapts Web Audio float buffers to PCM spec for Gemini. |
| **Singleton** | `GeminiService` instance | Ensures single Gemini client & avoids key leakage. |
| **Circuit-Breaker / Retry** | `GeminiService` reconnection | Exponential back-off, max attempts to prevent runaway costs. |
| **Back-Pressure Signalling** | Custom `backpressure` WS message | Informs client to pause sending when server/LLM congested. |

---

## 4. Critical Implementation Paths

### 4.1 Audio → Intent → UI

1. **Capture** – AudioWorklet buffers `4096` frames.  
2. **VAD** – Energy Strategy decides speech start/stop.  
3. **Stream** – PCM chunk ⇒ `websocketAudioStreamer.sendAudioChunk`.  
4. **Gateway** – Server relays chunk to Gemini `session.sendAudio`.  
5. **Gemini** – Streams STT interim → final JSON NLU.  
6. **Server** – Emits `transcript` & `nlu` messages.  
7. **Client** – `VoiceInputManager` updates Zustand → React screens re-render.

### 4.2 Error / Reconnect

* WebSocket error → client queues audio, sets `backpressure`.  
* `GeminiService` `onerror` triggers **exponential back-off** reconnect (`2^n * 1 s`, max 5).  
* Upon `open`, queued audio re-transmits; UI shows spinner during gap.

---

## 5. Data Flow Patterns

| Flow | Transport | Notes |
|------|-----------|-------|
| **Audio Upstream** | Binary PCM frames via WebSocket | ~20 ms chunks, base64 when JS serialised. |
| **Transcript Downstream** | JSON `transcript` messages | Interim & final boolean flag. |
| **NLU Downstream** | JSON `nlu` messages | Matches schema in prompts. |
| **State Propagation** | Zustand subscription | React screens auto-update; no props drilling. |
| **Product/Cart Actions** | REST (future) | Server will proxy Gemini-derived intent to e-commerce APIs. |

---

## 6. Error Handling Strategies

### Tier 1 – Client
* **Permission Errors** – Descriptive toast if mic blocked.
* **Local VAD Failures** – Switches to “push-to-talk” mode, logs analytics.
* **Back-Pressure** – Stops sending, UI pulse changes colour.

### Tier 2 – Gateway
* **JSON Parse Fail** – Sends `error` WS message; continues session.
* **Gemini Rate-Limit** – Emits `backpressure:true` to clients; queues audio.

### Tier 3 – Gemini Service
* **Session Drop** – Auto-reconnect ≤ 5 attempts, exponential wait.  
* **Max Tokens** – Monitored via `usageMetadata`; triggers context compression (future).  
* **Session Expiry** – Emits `SESSION_EXPIRED`, instructs client to re-connect.

### User-Facing Clarifications
* For low NLU confidence or ambiguous command, backend returns `clarification_needed` intent; UI plays confirmation speech and awaits a follow-up.

---

_This **System Patterns** document must evolve as new services (catalog proxy, payment) and patterns emerge. Update after each significant architectural or error-handling change._  
