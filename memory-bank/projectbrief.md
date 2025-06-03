# Aura Voice Shop – Project Brief

## 1. Project Name & Vision
**Project Name:** Aura Voice Shop  
**Vision:**  
Create a pioneering, voice-first e-commerce experience that lets users browse, search, filter, and buy products through natural, real-time conversation. Aura Voice Shop aims to redefine online shopping by making it hands-free, highly accessible, and faster than traditional point-and-click interfaces.

---

## 2. Core Requirements (Derived from PRD)
1. **Voice Interaction Pipeline**  
   - Client-side microphone capture with Voice Activity Detection (VAD).  
   - Real-time streaming of 16-bit PCM, 16 kHz mono audio via WebSocket.  
   - Google Gemini Live API for simultaneous Speech-to-Text (STT) and Natural Language Understanding (NLU).  
2. **Supported Voice Commands** – 15 intents covering:  
   - Navigation (homepage, catalog, cart, checkout, etc.).  
   - Product search & discovery with multi-entity queries.  
   - Dynamic filtering and sorting.  
   - Item selection & product detail queries.  
   - Cart add/remove/view operations.  
   - FAQ queries and clarification flow.  
3. **Reactive UI Updates**  
   - Immediate visual feedback (interim/final transcript, mic status, audio level).  
   - State changes propagated via stores to product grid, cart, etc.  
4. **Backend Bridge Service**  
   - Express + WebSocket server that proxies audio/text to Gemini and returns structured JSON.  
   - Stateless REST `/health` endpoint.  
5. **Security & Privacy**  
   - Gemini API key stored server-side only.  
   - All traffic over HTTPS/WSS.  
   - Minimal voice data retention; no client-side key exposure.  
6. **Accessibility & Usability**  
   - Designed for multitaskers and users with motor impairments.  
   - Clear auditory/visual cues, error handling, and clarification prompts.

---

## 3. Key Success Criteria
| Category | Target Metric |
|----------|---------------|
| Task completion (voice-only) | **> 70 %** of test users complete core flows |
| End-to-end latency | **< 1.5 s** from utterance end to UI update |
| STT accuracy | **< 15 %** Word Error Rate in typical environments |
| NLU accuracy | **> 85 %** F1 for intent + entity extraction |
| User satisfaction | Positive qualitative feedback; clear areas of delight |
| API efficiency | VAD cuts > 80 % of silence to control Gemini cost |

---

## 4. Scope Boundaries
### In Scope
- Frontend voice capture, VAD, WebSocket streaming, and UI integration.  
- Backend gateway service to Gemini Live API with session handling.  
- All 15 voice intents as defined in the PRD.  
- Basic cart & product mock APIs or existing endpoints.

### Out of Scope (Phase 1)
- Full payment processing and order fulfillment.  
- Detailed admin workflows beyond existing screens.  
- Multilingual voice support (future enhancement).  
- Production deployment pipeline & infrastructure (handled later).

---

## 5. Technical Constraints & Decisions
| Area | Constraint / Decision |
|------|-----------------------|
| Audio Format | Raw little-endian **16-bit PCM, 16 kHz mono** |
| Streaming Protocol | **WebSocket** bidirectional stream |
| STT / NLU Engine | **Google Gemini Live API** (`gemini-2.0-flash-live-001` initially; native audio models optional) |
| Frontend Stack | **React 18 + Vite + TypeScript + Tailwind + shadcn/ui** |
| State Management | **Zustand** stores |
| Backend Stack | **Node.js ≥ 16**, **Express**, **ws**, TypeScript |
| Security | API key only on server; HTTPS/WSS required |
| Performance | Client VAD to reduce API calls; backend auto-reconnect |
| Accessibility | Visual mic cues, transcript display, clear error prompts |
| Testing Targets | Jest unit tests; manual voice flow tests; latency profiling |

---

## 6. Project Goals Summary
- **Deliver** a fully functional prototype proving voice-only shopping is viable, fast, and intuitive.  
- **Demonstrate** seamless integration between browser, custom backend, and Google Gemini.  
- **Validate** latency, accuracy, and user-experience targets to justify future investment and scaling.
