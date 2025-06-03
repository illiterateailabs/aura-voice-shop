# Aura Voice Shop – Product Context

## 1. Problem Statement  
Traditional e-commerce relies on visual navigation, typing, and precise clicks.  
This **excludes users whose hands are busy or whose motor skills make mouse/keyboard input painful**, and it slows everyone when multitasking. Voice assistants exist, but none provide a **full, real-time, end-to-end shopping flow** that feels as fast and trustworthy as tapping a screen.

**Aura Voice Shop** exists to prove that a conversational, low-latency, voice-only journey can be *faster, more accessible, and more delightful* than today’s GUI-centric sites.

---

## 2. Target Users & Personas  

| Persona | Context & Needs | Pain With Current Sites |
|---------|-----------------|-------------------------|
| **Alex the Multitasker**<br/>Busy professional, often shopping while cooking or commuting. | Finish shopping in spare moments without stopping current activity. | Switching context, greasy hands on phone, slow typing on mobile. |
| **Sam the Accessibility Advocate**<br/>Retiree with arthritis limiting fine motor control. | Navigate and buy without the discomfort of precise clicking. | Small touch targets, long forms, physical pain after extended use. |
| **Hands-Free Shoppers**<br/>(drivers, workshop users, parents holding infants) | Safe, eyes-up, hands-free interaction. | Can’t safely use phone while occupied. |

---

## 3. User Experience Goals  

1. **Hands-free flow** from discovery → comparison → cart → checkout start.  
2. **< 1.5 s perceived latency** between finishing a command and seeing/hearing the result.  
3. **Natural language**: no rigid keywords; users speak the way they think.  
4. **Continuous context**: follow-up commands like “Sort by price” apply to the current list, “Add this” applies to current product.  
5. **Transparent feedback**: live transcript, pulsing mic, confirmation speech.  
6. **Error resilience**: clarification prompts instead of silent failure.

---

## 4. How It Should Work (User Perspective)  

1. **Activation** – User taps / says “Hey Aura” → mic glows.  
2. **Conversational Loop** –  
   - **User**: “Show me new arrivals in women’s dresses.”  
   - **Aura** streams audio, understands intent, instantly filters catalog, speaks & shows results.  
   - **User** (without restating context): “Sort by price low to high.” → list re-orders.  
   - “Add the first one to my cart.” → cart toast appears.  
   - “Proceed to checkout.” → checkout page opens.  
3. **Visual Assist** – Transcripts scroll in corner; cart badge animates on add/remove.  
4. **Hands-Off Finish** – Checkout starts; user can continue by voice or fall back to traditional inputs for payment.

---

## 5. Key Differentiators  

| Aura Voice Shop | Conventional Sites |
|-----------------|--------------------|
| **Real-time WebSocket streaming** to LLM for sub-second responses. | Batch/cloud voice services with noticeable lag. |
| **Full intent & entity understanding** (15+ intents) enabling multi-step flows. | Limited search-only voice or keyword commands. |
| **Client-side VAD + AudioWorklet** to minimise cost and latency. | Record-then-send models, high overhead. |
| **Accessibility-first design** – voice is primary, GUI is assistive. | Voice bolted on, still mouse/keyboard dominant. |
| **Context persistence** across turns and pages. | Each voice query isolated; user repeats info. |
| **Modular backend** ready for any catalog API + Gemini Live API. | Proprietary/closed ecosystems. |

---

By solving the *speed* and *accessibility* gaps in online shopping, Aura Voice Shop positions itself as the reference implementation for **next-generation conversational commerce**.  
