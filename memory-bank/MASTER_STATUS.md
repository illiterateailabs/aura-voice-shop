# MASTER STATUS – Aura Voice Shop  
*(living summary of overall project health & gaps)*  

**Last updated:** 2025-06-03  

---

## 1. Executive Snapshot
| Aspect | Status | Notes |
|--------|--------|-------|
| Voice Pipeline (capture → Gemini → UI) | **✅ Complete** | Sub-1 s latency in dev; 15 intents implemented |
| Gateway Backend (Express + Gemini Live API) | **✅ Complete** | Session mgmt, reconnection, prompt w/ schema |
| Product & Cart Data | **🛠️ Mock** | Uses in-memory mock arrays; no persistence |
| Admin Portal | **🔶 Functional UI, no real DB** | CRUD changes alter mock store only |
| Authn/Authz | **❌ Missing** | Both customer & admin sessions unauthenticated |
| Payments / Orders | **❌ Missing** | Checkout stops before payment gateway |
| Deployment (CI/CD + HTTPS) | **❌ Missing** | Local dev only; no TLS or container release |
| Automated Tests / Observability | **🔶 Partial** | Manual flows; Jest scaffolds empty |

> **Overall readiness:** Prototype is **voice-complete** but **commerce-incomplete**. Primary blocker is connecting real e-commerce services and authentication.

---

## 2. What Works Today
1. **Hands-free shopping demo**  
   - “Show new arrivals”, “Sort by price low to high”, “Add first item to cart”, “Proceed to checkout”.  
   - Live transcript, mic indicator, audio level pulse.
2. **Admin UI skeleton**  
   - `/admin/login`, `/admin`, `/admin/products` pages with product CRUD, dashboard widgets.
3. **Backend voice gateway**  
   - Streams PCM → Gemini; receives JSON NLU; relays to client.  
   - Automatic back-pressure, session cleanup, exponential back-off.

---

## 3. Gaps to a Production-Ready Shop

### 3.1 Core Shop Functions
| Gap | Needed Work |
|-----|-------------|
| **Persistent Product Catalog** | Hook to DB or existing product micro-service; replace `mockProducts[]`. |
| **Shopping Cart API** | REST endpoints for add/update/remove tied to user session. |
| **Order Checkout & Payment** | Integrate payment gateway (Stripe, Adyen, etc.); secure order creation. |
| **User Accounts** | Sign-up / login, JWT tokens, secure cart retrieval. |
| **Search & Filter Backend** | Server-side search (Elasticsearch/SQL) to scale beyond in-memory filtering. |

### 3.2 Voice ↔ Commerce Glue
* Map each NLU intent → real API call (e.g. **cart_add_item** → POST `/api/cart/items`).  
* Return confirmations/errors to client; regenerate Gemini clarification if API fails.

### 3.3 Admin Side Assessment
| Area | Current | Needed for MVP |
|------|---------|----------------|
| **Auth** | Dummy login (always true) | Secure admin login (JWT + RBAC) |
| **Products CRUD** | Updates local store | Persist changes to DB; image upload |
| **Orders & Revenue Metrics** | Fake dashboard numbers | Live stats from orders table |
| **Inventory Alerts** | Not wired | Stock tracking + notifications |
| **User Management** | None | View / ban / support users |

### 3.4 Infrastructure
- **Database**: PostgreSQL or MongoDB for products, users, orders.  
- **CI/CD**: GitHub Actions – lint → test → Docker → deploy.  
- **Deployment**: Containerised backend (Cloud Run/Fly.io) with WSS + TLS; static frontend (Pages/S3).  
- **Observability**: Winston logs, Prometheus metrics, distributed tracing.

### 3.5 Quality & Compliance
- **Unit / Integration Tests** ≥ 80 % critical paths.  
- **Accessibility Audit** (WCAG) for visual UI.  
- **Privacy & Security** review (GDPR, PCI if payments).  
- **Rate Limiting & Abuse Protection** on voice gateway.

---

## 4. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini quota / cost spikes | High bill or throttling | Client VAD (done); monitor `usageMetadata`; caching FAQs |
| Latency regression in prod | Poor UX | Edge deployment; tune buffer size; Cloud Load Balancers |
| Model JSON drift | Voice commands fail | Strict schema; dev alert on parse error |
| Unauthenticated admin panel | Data breach | Implement JWT + secure cookies immediately |

---

## 5. Next Milestones
1. **(P0)** Connect Product & Cart micro-services; persist admin CRUD.  
2. **(P0)** Add secure authentication (customers + admins).  
3. **(P1)** Integrate payment provider and order flow.  
4. **(P1)** Containerise & deploy with HTTPS; set `VITE_VOICE_API_URL` to WSS prod endpoint.  
5. **(P1)** Automated test suite (voice mocks, API mocks).  
6. **(P2)** Native audio TTS responses; proactive dialog.  
7. **(P2)** Multi-language support.

---

## 6. Decision Log (recent)
| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-06-03 | **Stay on React/Vite** (drop SvelteKit) | Faster leverage of existing UI; voice goals unaffected |
| 2025-06-03 | Implement dual VAD (client + server) | Reduce cost, keep fallback |
| 2025-06-03 | Back-pressure WS message | Prevent client overwhelm when LLM is slow |
| 2025-06-03 | Prompt schema + rich few-shot | Achieve ≥ 95 % valid JSON responses |

---

## 7. Action Items for “Go-Live”
- [ ] Provision production Gemini API key & budget monitoring.  
- [ ] Harden backend against abuse (auth, rate-limit).  
- [ ] Replace mock data with real DB + REST controllers.  
- [ ] Run full accessibility + security audits.  
- [ ] Freeze feature set → run regression + load tests.  

---

_Keep this MASTER_STATUS updated after every major merge or scope shift._
