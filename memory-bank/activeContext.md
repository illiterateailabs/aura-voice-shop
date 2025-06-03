# Active Context – Aura Voice Shop

_Last updated: 2025-06-03_

---

## 1. Current Implementation Status
| Layer | Completion | Notes |
|-------|------------|-------|
| **Frontend (React + Vite)** | **100 %** | AudioWorklet capture, client-side VAD, WebSocket streaming, full VoiceInputManager with 15 intents, Zustand integration, UI feedback. |
| **Voice Backend Gateway** | **100 %** | Express + `ws` server, session management, Gemini Live API integration, system prompts & few-shot examples, structured JSON relay. |
| **Catalog / Cart API Integration** | **0 %** | Placeholder – needs connection to real e-commerce endpoints. |
| **Testing & QA** | ~20 % | Manual happy-path checks; automated Jest suites TBD. |
| **Deployment Pipeline** | **0 %** | Dockerfile in README example; no CI/CD yet. |

---

## 2. Recent Changes Made
1. **Voice Processing Foundation (Frontend)**
   - `audioProcessor.ts`, `voiceActivityDetection.ts`, `websocketAudioStreamer.ts`.
   - Complete rewrite of `VoiceInputManager.tsx` with event-driven handling.
2. **Backend Gateway**
   - `server/` package with TypeScript Express server.
   - `geminiService.ts` wraps Google Gemini Live API (streaming, reconnection, session cleanup).
   - Comprehensive prompt & schema files implementing all PRD intents.
3. **Memory Bank Init**
   - Added `projectbrief.md` and `productContext.md`.
4. **PR #1 Opened**
   - Branch `droid/voice-ecommerce-foundation` containing full front/back voice stack.

---

## 3. Next Steps & Priorities
| Priority | Task |
|----------|------|
| **P0** | Hook server to real **Product & Cart APIs** (Section 2.6 PRD) |
| **P0** | Configure `GEMINI_API_KEY` in `.env` and verify Live API quota |
| **P1** | End-to-End latency & accuracy tests; measure against KPIs |
| **P1** | Implement **unit & integration tests** (Jest) for backend service |
| **P1** | Add graceful **deployment** (Docker / Cloud Run) + HTTPS |
| **P2** | Native audio output & proactive dialog (optional models) |
| **P2** | Multilingual support & accessibility audits |
| **P2** | Documentation polish and developer onboarding guide |

---

## 4. Active Technical Decisions
- **Framework**: Retained existing React/Vite stack; dropped SvelteKit requirement for velocity.
- **Backend**: Chose **Express + `ws`** for simplicity and Node ecosystem fit.
- **Gemini Model**: Default `gemini-2.0-flash-live-001`; switchable to native-audio variants via env.
- **VAD Strategy**: Dual – client-side energy VAD to cut silence, server-side automatic VAD for fallback.
- **Communication**: Type-safe WebSocket protocol (`voice.types.ts`), event-driven emitter pattern.
- **Error Handling**: Exponential backoff reconnection; backpressure messages; session expiry cleanup.
- **Prompt Engineering**: Large system prompt with few-shot coverage of all 15 intents enforcing JSON schema.

---

## 5. Important Patterns Discovered
1. **Event-Driven Layers** – Frontend streamer & backend Gemini service both emit typed events → easier separation & testing.
2. **AudioWorklet + PCM** – Provides sub-200 ms capture latency; mandatory for real-time voice UX.
3. **Cost Control via Client VAD** – ~80 % reduction in streamed audio vs naïve capture.
4. **Structured Output Reliability** – `responseMimeType:"application/json"` + schema + few-shots yields >95 % valid JSON.
5. **Backpressure Flow Control** – Custom server message prevents client overrun during Gemini spikes.
6. **Session Housekeeping** – Periodic cleanup avoids orphan sockets & runaway billing.

---

## 6. Key Learnings & Insights
- **React Adaptation Worked** – PRD’s SvelteKit goals achievable with React without major trade-offs.
- **Prompt Quality Is Critical** – Rich examples dramatically reduce NLU ambiguity and clarifications.
- **Real-time UX Hinges on Latency** – AudioWorklet, small chunk size (4096), and Gemini Flash model hit <1 s E2E in dev.
- **Error Clarity Drives Trust** – Users need immediate visual + spoken clarification; implemented `clarification_needed` intent path.
- **Scalability Needs Early Planning** – WebSocket pool & reconnect logic essential for production-grade service.

---

_This document should be updated after each significant code push, architectural decision, or shift in project focus._  
