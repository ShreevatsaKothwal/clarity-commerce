# Decision Log — ClarityCommerce / ShopMind

A running record of every significant decision made during the build.

---

## Phase 1 — Foundation Decisions

**Decision 1: Dual-Layer Engine over Single LLM**
We considered using a single LLM call for all product analysis. We chose to split into a dual-layer engine (LLM + deterministic Python) because LLM APIs have rate limits, cost money per call, and are unreliable for absolute logic checks. The deterministic layer guarantees catches like color contradictions and missing specs even when the API is completely down. This was the single most important architectural decision we made.

**Decision 2: Gemini Flash → Groq (Llama 3.3 70B)**
We started with Google Gemini Flash as our LLM provider. Mid-build, products 3–10 were consistently failing with rate limit errors on the free tier, requiring 15-second sleep delays between each call and still producing system failures. We switched to Groq's free tier (Llama 3.3 70B) which completed the same 10-product batch without any delays or failures. The switch required changing only `layer2_llm.py` — the rest of the pipeline was unaffected.

**Decision 3: Vanilla HTML/CSS/JS over React**
We considered React with a component-based architecture. We chose vanilla JavaScript because hackathon projects frequently fail during judging due to build tool complexities — a missing `node_modules`, a webpack config error, or a missing environment variable can prevent judges from running the demo entirely. Our zero-dependency frontend runs instantly with `python3 server.py` and nothing else.

**Decision 4: Pre-generated JSON over Live API on Page Load**
We considered building a real-time API where every dashboard load triggers a fresh pipeline run. We chose to pre-generate results into `shopmind_results.json` because each product analysis involves an LLM call, and running all 10 products takes approximately 2 minutes. Pre-generating once gives an instant dashboard experience while keeping the architecture realistic for asynchronous background processing.

---

## Phase 2 — Product Thinking Decisions

**Decision 5: Store-Level Analysis over Product-Level Only**
We considered only grading individual products. We chose to add `store_context.json` ingestion because AI shopping agents evaluate store trustworthiness, not just individual listings. A well-described product in a store with no FAQ coverage or contradictory return policies will still be deprioritized. This made our system diagnostic at a business level, not just a listing level.

**Decision 6: Priority Matrix over Pass/Fail Grading**
We considered a simple pass/fail scale. We chose a weighted Priority Matrix (CRITICAL/HIGH/MEDIUM) using the formula `impact_score = (ai_rejection * 0.5) + (conversion_loss * 0.3) + (fix_difficulty * 0.2)` because merchants need to know which fix to apply FIRST based on business impact, not just a list of problems. The formula weights AI rejection probability highest because that is the direct cause of lost sales.

**Decision 7: Competitive Displacement Framing over Generic Error List**
We considered showing merchants a simple list of errors. We chose to frame every issue as a competitive displacement risk — naming the specific competitor an AI agent would recommend instead. "AI will recommend Amazon Basics Travel Backpack instead of yours because it lacks dimensions" is far more motivating and actionable than "dimensions field is empty."

**Decision 8: Three AI Buyer Personas over Single Score**
We considered showing a single AI readiness number per product. We chose to simulate three distinct buyer personas (Travel Planner, Deal Finder, Stylist — or category-specific variants for Electronics and Footwear) because merchants need to understand *why* their product fails, not just *that* it does. A wallet seller needs to know the Stylist AI rejected it because there is no color information — a generic score cannot communicate this.

**Decision 9: Single API Call for All Three Personas**
We considered making three separate API calls — one per persona — for cleaner separation. We chose a single structured prompt that simulates all three personas simultaneously because it is three times faster, conserves rate limit tokens, and forces the model to consider all perspectives in context, producing more internally consistent output.

---

## Phase 3 — UX & Frontend Decisions

**Decision 10: Before vs After Split View on Apply Fix**
We considered silently replacing the product description when a merchant clicks Apply Fix. We chose a side-by-side Before vs After comparison because merchants need to trust the system before committing to a change. Seeing exactly what changed builds confidence and makes the tool feel like a collaborator, not a black box.

**Decision 11: Animated Gauge Meter for Store Score**
We considered a static number display for the Store AI Readiness Score. We chose an animated semi-circular gauge meter that updates upward when fixes are applied because it gives immediate positive reinforcement and makes improvement feel real and measurable. The closed loop — diagnose → fix → score improves — needed to be visually felt, not just read.

**Decision 12: Block Apply Fix on Empty/Guide-Style Output**
We considered allowing merchants to apply any output from the LLM, including fallback improvement guides. We chose to block the Apply Fix button when the suggested text starts with "Based on our analysis" because this means the LLM did not generate real optimized copy — it generated a guide due to insufficient product information. Applying a guide as a listing would make the merchant's data worse, not better.

**Decision 13: Live Product Add Flow**
We considered making the tool only work on pre-loaded products from `shopmind_results.json`. We chose to add a live "+ Add Product" flow where merchants can input new products and see real-time analysis with animated steps because this demonstrates the system's value interactively during a demo and shows the pipeline working end-to-end in real time.

**Decision 14: isFixed Protection on Cards**
We considered allowing merchants to re-apply fixes to already-optimized products. We chose to protect fixed cards with an `isFixed` flag that shows a read-only "Optimization Applied" modal instead of the apply flow because re-applying a fix on an already-optimized listing could overwrite good data, and the Before vs After review view is more appropriate for merchant reference.

---

## Phase 4 — Scope Decisions (What We Chose NOT to Build)

**Excluded: Real Shopify API Integration**
The hackathon explicitly permits synthetic data. Integrating the Shopify Admin GraphQL API would require OAuth setup, token management, and webhook handling — significant complexity with no evaluation benefit. The architecture is designed so this integration can be swapped in with minimal changes.

**Excluded: Product Image Analysis**
Analyzing product images for AI readiness would require a vision model. We flag missing images as a deterministic rule but do not process image content. Scoped out to keep the system focused and reliable within the timeline.

**Excluded: Shadow Database / Dual Publishing**
We considered building a system where merchants serve optimized structured data to AI crawlers and emotional copy to human visitors. Descoped because the rubric prioritizes diagnostic depth and actionable output over publishing architecture.

**Excluded: Automatic Re-analysis After Each Fix**
Re-running the full pipeline after every fix would require managing rate limits mid-session and would significantly slow down the UX. The Before vs After view gives merchants sufficient information to evaluate the change without a full re-run.

**Excluded: Semantic Competitor Matching**
Currently competitors are matched by exact category string. Semantic vector similarity would be more accurate but added infrastructure complexity. Flagged as a known limitation and future improvement.

---

## Auto-Generated Audit Summary
*(generated from shopmind_results.json)*
- **Store Readiness Score**: 22.0%
- **Verdict**: STORE AT RISK
- **Total Audited**: 10
- **Priority Breakdown**: CRITICAL: 7, HIGH: 3, MEDIUM: 0

**Top Critical Products:**
- Shirt
- Women's Running Shoes