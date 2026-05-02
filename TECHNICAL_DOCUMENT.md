# Technical Document

**ShopMind — AI Representation Optimizer**  
**Team:** ClarityCommerce | Shreevatsa K & Ateeb | Dayananda Sagar University, B.Tech 3rd Year  
**Track:** Track 5 (Advanced): AI Representation Optimizer  

---

## System Overview
ShopMind operates on a highly decoupled, 5-layer pipeline. Each layer has a single responsibility, processing data and passing a clean output to the next stage. The system combines an LLM engine for qualitative reasoning with a pure Python deterministic engine for structural validation, culminating in a prioritized scoring system.

## Architecture & Components

```text
[products.json] ──────┐
[store_context.json] ──┤──► Layer 1: Ingestion
[competitor_shadow.json]┘         │
                                  ▼
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
         Layer 2A: LLM Engine        Layer 2B: Deterministic Engine
         (Groq API — Llama 3.3 70B)  (Pure Python — 12 rules)
                    └─────────────┬─────────────┘
                                  ▼
                         Layer 3: Scorer
                    (Priority Matrix Algorithm)
                                  │
                                  ▼
                         Layer 5: Store Summary
                    (Aggregate Readiness Score)
                                  │
                                  ▼
                       shopmind_results.json
                                  │
                                  ▼
                    server.py serves dashboard
                                  │
                                  ▼
                    app.js renders merchant UI
                                  │
                         (Apply Fix clicked)
                                  ▼
                    POST /api/apply_fix → applied_fixes.json
                                  │
                                  ▼
                    mock_shopify_sync.py → simulated push
```

*   **Layer 1 — Ingestion (`layer1_ingestion.py`):** Loads and merges three JSON data sources into a unified audit context object. This is the only point where file I/O occurs at the start of the pipeline. All subsequent layers receive this in-memory object.
*   **Layer 2A — LLM Engine (`layer2_llm.py`):** Sends a structured prompt to the Groq API. It instructs the model to simulate three category-aware buyer personas simultaneously and output structured JSON, generating verdicts, reasons, and an optimized listing.
*   **Layer 2B — Deterministic Engine (`layer2_deterministic.py`):** Pure Python string matching and logical validation running 12 sequential rules. It detects absolute errors like color contradictions, missing policies, and price anomalies, outputting an array of deterministic issues and conversion loss weights.
*   **Layer 3 — Scorer (`layer3_scorer.py`):** Combines LLM and deterministic outputs using a weighted formula. It assigns priority rankings (CRITICAL, HIGH, MEDIUM) and matches products to competitors to generate displacement risk text.
*   **Layer 5 — Store Summary (`layer5_store_summary.py`):** Aggregates product results to calculate the overall Store AI Readiness Score and generates store-level warnings based on `store_context.json`.
*   **Frontend (`server.py`, `app.js`, `index.html`, `style.css`):** A zero-dependency architecture. `server.py` acts as a lightweight Python HTTPServer. `app.js` handles dynamic rendering, modal interactions, and local state management.

## Tech Stack
*   **Backend / Pipeline:** Python 3
*   **LLM Provider:** Groq API (Model: Llama 3.3 70B)
*   **Frontend:** Vanilla HTML5, CSS3, JavaScript (Zero-dependency)
*   **Data Storage:** Local JSON files (`products.json`, `store_context.json`, `competitor_shadow.json`)

## AI vs Deterministic — Where We Drew the Line

**LLM Handles:**
*   Qualitative assessments (e.g., Would a specific AI persona want this product?).
*   Reasoning about merchant intent versus actual listing quality.
*   Generating natural, persuasive improved listing text.
*   Estimating the holistic AI rejection probability.

**Deterministic Code Handles:**
*   Absolute logical contradictions (e.g., title says "black", description says "brown").
*   Missing field detection (e.g., no description, no image URL).
*   Structural anomalies (e.g., price is ₹0.01 on a ₹15,000 product category).
*   Policy conflicts (e.g., "Final Sale" in description vs. "30-day free returns" in store policy).
*   Jargon density tracking.

**The Reasoning:** LLMs are unreliable for absolute logic and counting; they may hallucinate a third color when asked to resolve a "black vs. brown" contradiction. String matching handles this in zero milliseconds with 100% reliability. Conversely, deterministic rules cannot judge whether copy feels trustworthy or captures merchant intent. The dual-layer approach provides objective structural guarantees via Python and subjective quality reasoning via the LLM.

## Failure Handling
*   **Malformed JSON from API:** `layer2_llm.py` wraps the API call in a `try/except` block and aggressively strips markdown code fences before parsing. If parsing still fails, it returns a safe fallback object. Layer 3 then derives a fallback rejection probability entirely from the deterministic data.
*   **Rate Limits:** If a rate limit is hit, the deterministic layer independently provides all structural issues. The dashboard card displays: *"AI persona verdicts unavailable (rate limit hit — deterministic fallback was used)"*, ensuring the merchant still receives actionable feedback.
*   **Empty Product Information:** Deterministic rules catch empty descriptions instantly. If the LLM generates a low-quality fix (e.g., starting with "Based on our analysis..."), the frontend blocks the "Apply Fix" button, prompting the user to add basic information first.
*   **Missing or Corrupted State Files:** If `applied_fixes.json` is missing or corrupted, `server.py` safely resets it to an empty array without crashing the POST endpoint.
*   **Local File Protocol Errors:** If a user attempts to open `index.html` via `file://`, the frontend catches the fetch error and displays styled instructions to run the local Python server.

## Key Implementation Decisions
*   **Single API Call for Personas:** Instead of making three separate API calls per product, we utilized a single structured call. This is three times faster, conserves rate limit tokens, and forces the model to evaluate the product from three perspectives simultaneously, improving internal consistency.
*   **Vanilla Frontend:** We bypassed React/Webpack in favor of vanilla HTML/CSS/JS. Hackathon projects often fail during judging due to build tool complexities or missing dependencies. Our zero-dependency frontend runs instantly via `python3 server.py`.
*   **Pre-generated Analysis JSON:** Rather than forcing a 2-minute pipeline run on page load, we pre-generate results into `shopmind_results.json`. This provides an instant dashboard experience while keeping the architecture realistic for asynchronous background processing.
*   **Model Selection:** We migrated from Gemini Flash to Groq (Llama 3.3 70B) mid-build to resolve severe free-tier rate-limiting issues, allowing the full 10-product batch to process flawlessly without artificial sleep delays.

## Known Limitations
*   **Synthetic Dataset:** The pipeline uses manually curated `products.json` instead of live Shopify data.
*   **Approximate Score Updates:** When a fix is applied, the frontend animates the store score using a fast approximation formula. A production environment would perform a full server-side recalculation.
*   **Category-Based Competitor Matching:** Competitors are matched using exact string comparisons on the category field. Production systems should use semantic vector similarity for more accurate displacement matching.
*   **Exclusion of Review Data:** The LLM prompt does not currently ingest product reviews, which are a critical trust signal for real-world AI shopping agents.

## Future Improvements
*   **Real Shopify Admin Integration:** Implement OAuth so merchants can connect their store, pull live catalogs, and push AI optimizations directly back to their Shopify admin.
*   **Batch Fixing:** Allow merchants to apply AI optimizations across hundreds of products with a single click.
*   **Vision Model Integration:** Add image analysis to verify lighting, clarity, and alignment with the text description.
*   **Multi-Store Benchmarking:** Allow merchants to compare their AI Readiness Score against industry averages for their specific category.
