# Aura Voice Shop – Backend Server

Express • WebSocket • Google Gemini Live API  
`server/` directory

---

## 1. Architecture Overview
```
+--------------+        WSS/JSON         +--------------------+   Streaming   +------------------------------+
| React Client |  <--------------------> |  Aura Voice Server  |  <=========>  |  Google Gemini Live API      |
| (VoiceInput) |  voice-command socket   |  (Express + ws)     |   audio/text  |  (STT + NLU)                |
+--------------+                         +--------------------+               +------------------------------+
        ^   REST /health                          │
        │                                         │
        │                    HTTP/REST (optional) │ product/cart backend (future)
        └─────────────────────────────────────────┘
```

* **Express HTTP Layer** – exposes `/health` for liveness / metrics.  
* **WebSocket Layer** – single path `${WS_PATH}` (default `/api/voice-command`) that:
  * receives PCM audio / control messages from the browser
  * proxies audio to **GeminiService**
  * relays transcripts & structured NLU JSON back to the client  
* **GeminiService** – wraps Google Gemini Live API:
  * maintains session per user
  * streams audio ⇒ obtains STT + NLU (JSON via `responseMimeType:"application/json"`)
  * emits events consumed by the WS layer  
* **Type-Safe Contracts** – all WS payloads defined in `src/types/voice.types.ts`

---

## 2. Getting Started

### 2.1 Prerequisites
* **Node.js ≥ 16** (18+ recommended)  
* **npm** or **pnpm**  
* Google Gemini API key with Live API access  

### 2.2 Installation
```bash
# from repo root
cd server
cp .env.example .env        # add your keys / config
npm install                 # or pnpm install
```

### 2.3 Development Mode
```bash
npm run dev                 # nodemon + ts-node
# server listening on http://localhost:3001
```

### 2.4 Production Build
```bash
npm run build               # tsc -> dist/
npm start                   # node dist/server.js
```

> **Docker**: create your own container easily  
> ```dockerfile
> FROM node:18
> WORKDIR /app
> COPY server/package*.json ./
> RUN npm ci --omit dev
> COPY server ./
> RUN npm run build
> CMD ["node","dist/server.js"]
> ```

---

## 3. Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP & WS port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-origin |
| `GEMINI_API_KEY` | — | **Required** Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash-live-001` | Live model id (native audio models also supported) |
| `WS_PATH` | `/api/voice-command` | WebSocket path |
| `LOG_LEVEL` | `info` | winston/console log level |

---

## 4. HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Returns status JSON:<br>`{ status, uptime, geminiServiceReady, activeSessions }` |

No other REST endpoints are required; product/cart routes will be proxied in future phases.

---

## 5. WebSocket Protocol (`${WS_PATH}`)

### 5.1 Connection
* Browser opens `ws://<server>:PORT${WS_PATH}`  
* Server responds with a **SESSION** message:
```json
{ "type":"session", "timestamp":1690000000, "sessionId":"<uuid>" }
```

### 5.2 Client → Server Messages
| `type` | Payload | Notes |
|--------|---------|-------|
| `setup` | model / config *(optional)* | reserved |
| `audio` | `{ audio:{data, mimeType}, ... }` | base64 16-bit PCM 16 kHz mono chunks |
| `end_of_speech` | — | flushes pipeline |
| `text` | `{ text }` | optional text fallback |
| `ping` | — | keep-alive |
| `end_session` | — | graceful close |

### 5.3 Server → Client Messages
| `type` | When |
|--------|------|
| `transcript` | STT interim/final |
| `nlu` | Structured JSON per PRD |
| `audio` | (future) TTS native audio |
| `error` | Any failure |
| `pong` | response to ping |
| `backpressure` | flow control |

Detailed TypeScript interfaces live in **`src/types/voice.types.ts`**.

---

## 6. Gemini Integration

* **Streaming model**: default `gemini-2.0-flash-live-001`  
* **Connection** created via `@google/generative-ai` SDK:
  ```ts
  genAI.live.connect({
    model: GEMINI_MODEL,
    config: {
      responseModalities: ['TEXT'],
      systemInstruction: COMPLETE_SYSTEM_PROMPT,
      generationConfig: { responseMimeType: 'application/json' }
    }
  });
  ```
* **System Prompt**: `src/config/prompts.ts`  – enforces PRD schema and few-shot examples.  
* **Audio Format**: raw little-endian PCM 16 kHz, 1 channel, 16 bit – exactly what the frontend streams.  
* **Server-side VAD** enabled (`automaticActivityDetection`), but the client also performs VAD to minimise usage.  
* **Session Handling**: reconnection with exponential back-off, auto-cleanup of expired sessions.

---

## 7. Running End-to-End

1. **Frontend**  
   ```bash
   # project root (React)
   npm run dev
   ```
   Environment var `VITE_VOICE_API_URL` must point to `ws://localhost:3001/api/voice-command`.

2. **Backend**  
   ```bash
   cd server
   npm run dev
   ```

3. **Try It**  
   * Allow mic permission in browser.  
   * Click microphone button → speak: “*Search for Nike running shoes under 100 dollars*”.  
   * Observe interim transcript and product list updating.

---

## 8. Folder Structure (server)
```
server/
├─ src/
│  ├─ config/          # prompts & schemas
│  ├─ services/        # geminiService.ts
│  ├─ types/           # TypeScript shared contracts
│  └─ server.ts        # Express + WS entry
├─ .env.example
├─ tsconfig.json
└─ package.json
```

---

## 9. Contributing & Testing

* **Lint**: `npm run lint`  
* **Unit tests** (Jest): `npm test` (placeholder)  
* **Pull requests**: please target `main`, run lint & tests.  

---

## 10. Roadmap

- [ ] Integrate product & cart backend APIs (Section 2.6 PRD)  
- [ ] Persist conversational context across page reloads  
- [ ] Deploy to Cloud Run / Fly.io with HTTPS + TLS  
- [ ] Native audio output & proactive dialog support  

Enjoy building the future of conversational commerce!  
