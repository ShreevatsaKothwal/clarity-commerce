# 🧠 ShopMind: AI Commerce Readiness & Competitive Displacement Platform

*Are AI shopping agents recommending your products, or are you losing sales to generic competitors?*

**ShopMind** is not a simple chatbot or a standard LLM wrapper. It is a high-performance **Two-Layer AI Auditing Engine**. It simulates exactly how Autonomous AI Shopping Agents perceive your storefront, ranks your vulnerabilities using a custom mathematical Priority Matrix, and predicts your **Displacement Risk** against real competitors.

---

## 🏆 Key Innovations (Why This Breaks the Hackathon Mold)

### 1. Dual-Layer AI Engine (Graceful Degradation)
We don't just rely on an API.
*   **Layer 2A (Qualitative):** Uses the Google Gemini API to simulate 3 distinct buyers simultaneously (The Travel Planner, The Deal Finder, The Stylist).
*   **Layer 2B (Deterministic):** Uses pure, 0-latency Python logic to detect color contradictions, missing critical specs, and store policy conflicts.
*   **The Benefit:** If the LLM rate limits hit or the API crashes, our system seamlessly falls back to the deterministic engine. It never stops protecting the merchant.

### 2. The Competitive Displacement Scorer
Most tools give merchants a messy list of "errors." ShopMind calculates an exact priority using a custom algorithm:
`impact_score = (ai_rejection * 0.5) + (conversion_loss * 0.3) + (fix_difficulty * 0.2)`

It then alerts the merchant to the **Severe Risk** of an AI recommending a specific generic competitor (e.g., *Amazon Basics*) over their listing.

### 3. Store Context Ingestion
Product descriptions don't exist in a vacuum. We ingest `store_context.json` so the engine can detect if a product claims "Final Sale" while the store policy promises "30-Day Free Returns".

---

## 🚀 How to Run locally

### 1. Backend Engine
Ensure you have the Gemini API configured:
```bash
pip install google-generativeai
export GEMINI_API_KEY="your_api_key_here"
python3 shopmind_main.py
```
*This will ingest the data, run the multi-persona simulations, calculate math algorithms, and safely output `shopmind_results.json`.*

### 2. Launch the Analytics Dashboard
We built a visually stunning HTML/CSS frontend with zero heavy dependencies. Open your terminal in this directory and start a local server:
```bash
python3 -m http.server 8000
```
Browse to [http://localhost:8000](http://localhost:8000) to view the Premium Dark Mode Inspector Dashboard.

---

📂 **For a profound deep-dive into the codebase logic, view the [ARCHITECTURE.md](ARCHITECTURE.md)!**
