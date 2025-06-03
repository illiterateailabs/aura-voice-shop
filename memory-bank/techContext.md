# Tech Context – Aura Voice Shop

_Last updated: 2025-06-03_

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.3.x | UI library |
| | Vite | 5.x | Lightning-fast dev/build tool |
| | TypeScript | 5.5.x | Static typing |
| | Tailwind CSS | 3.4.x | Utility-first styling |
| | shadcn-ui / Radix Primitives | latest | Accessible UI components |
| | Zustand | 5.x | Global state management |
| | TanStack React Query | 5.x | Server-state caching (products, etc.) |
| | AudioWorklet API | — (browser) | Low-latency audio capture |
| | Web Audio API | — | Audio processing & meters |
| | Custom VAD util | project | Energy-based speech detection |
| | WebSocket (browser) | — | Real-time audio/data streaming |

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Backend** | Node.js | ≥16 (tested on 18) | Runtime |
| | Express | 4.18.x | HTTP server |
| | ws | 8.16.x | WebSocket server |
| | TypeScript | 5.3.x | Static typing |
| | @google/generative-ai | 0.2.x | Gemini Live API SDK |
| | dotenv | 16.x | Env management |
| | cors | 2.8.x | CORS middleware |
| | EventEmitter (node) | — | Service events |
| | Jest + ts-jest | 29.x | Unit testing |

---

## 2. Development Environment Setup

```bash
# Prerequisites
node --version   # >= 18 recommended
npm install --global pnpm  # optional but faster

# Clone & install
git clone https://github.com/illiterateailabs/aura-voice-shop.git
cd aura-voice-shop

# Frontend
pnpm install          # or npm install
pnpm run dev          # http://localhost:5173

# Backend
cd server
cp .env.example .env  # add GEMINI_API_KEY + config
pnpm install
pnpm run dev          # http://localhost:3001 (+ WSS)
```

Hot-reload: Vite handles frontend HMR; `nodemon --exec ts-node` reloads backend on file changes.

Editors: VS Code with _ESLint_ & _Prettier_ plugins recommended.

---

## 3. Dependencies & Versions

### Frontend `package.json` (excerpt)
- `react` **18.3.1**
- `vite` **5.4.1**
- `tailwindcss` **3.4.11**
- `@radix-ui/react-*` **≥1.1**
- `zustand` **5.0.5**
- `@tanstack/react-query` **5.56.2**
- Dev: `eslint` **9.x**, `@typescript-eslint` **6.x**

### Backend `server/package.json` (excerpt)
- `express` **4.18.2**
- `ws` **8.16.0**
- `@google/generative-ai` **0.2.0**
- `dotenv` **16.4.0**
- Dev: `typescript` **5.3.3**, `nodemon` **3.0.3**, `jest` **29.7.0**

> All versions locked via package.json / package-lock; bump with care to avoid breaking ABI (esp. WebSocket & Gemini SDK).

---

## 4. Tool Usage Patterns

| Tool | Pattern |
|------|---------|
| **Vite** | `vite dev` for HMR, `vite build` for production bundle under `dist/` |
| **AudioWorklet** | Generated processor code at runtime (`createAudioWorkletProcessorCode`) to avoid extra file; 4 096-frame buffer for ~20 ms latency. |
| **Custom VAD** | Strategy pattern; energy threshold adapts to background noise; raises `speechStart` / `speechEnd` / `audioLevel` events. |
| **`websocketAudioStreamer`** | Queue & back-pressure handling; auto-reconnect with exponential back-off. |
| **GeminiService (backend)** | Singleton Gateway; streams audio via `session.sendAudio`; listens for JSON text chunks. |
| **Zustand Stores** | Source of truth for voice state, products, cart; selectors in components to minimise renders. |
| **Testing** | `jest` + `ts-jest`; currently placeholder; focus first on utility libs (VAD, streamer) then service mocks. |

---

## 5. Technical Constraints

| Constraint | Reason |
|------------|--------|
| **Audio format**: 16-bit PCM, 16 kHz, mono | Required by Gemini Live API |
| **Latency budget**: < 1.5 s E2E | Conversational UX target |
| **Gemini API key server-side only** | Security; no client exposure |
| **WebSocket route**: `/api/voice-command` | Consistent endpoint across envs |
| **Max reconnection attempts**: 5 | Avoid runaway retries / quota drain |
| **Token usage**: monitor via `usageMetadata` | Stay within 128 k context window / quota |
| **CORS**: `CLIENT_ORIGIN` env var | Allow front-end dev host only |

---

## 6. Build & Deployment

### Frontend
```bash
pnpm run build   # vite → dist/ (static assets)
```
Deploy `dist/` to any static host (Cloudflare Pages, Netlify, Vercel, S3).

### Backend
```bash
pnpm run build   # tsc → dist/server.js
node dist/server.js
```
**Docker** example in `server/README.md`.  
Recommended hosting: **Cloud Run** (auto TLS, scaleback) or **Fly.io** for close-to-edge latency.

### Environment Variables (server)
- `PORT` – HTTP & WS port (default **3001**)  
- `CLIENT_ORIGIN` – CORS allow-origin  
- `GEMINI_API_KEY` – **required**  
- `GEMINI_MODEL` – default `gemini-2.0-flash-live-001`  
- `WS_PATH` – WebSocket path (default `/api/voice-command`)  
- `LOG_LEVEL` – console log level  

### TLS / HTTPS
Production deployment **must terminate TLS** so that browser can open WSS.  
Local dev: use a self-signed cert or `vite --https` if needed.

---

## 7. Future Tech Tasks

1. **CI/CD Pipeline** – GitHub Actions: lint, test, build, Docker push.  
2. **E-commerce API Proxy** – Integrate product & cart endpoints, handle auth.  
3. **Load & Stress Tests** – k6 for WS throughput and latency under load.  
4. **Multilingual Expansion** – switch `speechConfig.languageCode` and prompt locale.  
5. **Observability** – winston log streams + Prometheus metrics endpoint.  

---
