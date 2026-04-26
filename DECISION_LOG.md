# Decision Log — ClarityCommerce / ShopMind

A running record of decisions made during the build. Format: We considered X, chose Y, because Z.

---

## Architecture Decisions

**Decision 1:** We considered using a single LLM call for all analysis. We chose to split into a dual-layer engine (LLM + deterministic Python) because LLM APIs have rate limits and cost money per call. The deterministic layer guarantees catches like color contradictions and missing specs even when the API is down.

**Decision 2:** We considered React/Next.js for the dashboard. We chose vanilla HTML/CSS/JS because hackathon projects often fail due to build tool complexity, and a zero-dependency dashboard is more reliable to demo.

**Decision 3:** We considered grading products on a simple pass/fail scale. We chose a weighted Priority Matrix (CRITICAL/HIGH/MEDIUM) using the formula `impact_score = (ai_rejection * 0.5) + (conversion_loss * 0.3) + (fix_difficulty * 0.2)` because merchants need to know which fix to apply FIRST, not just a list of problems.

**Decision 4:** We considered only analyzing individual products. We chose to add store_context.json ingestion because AI agents read store-wide policies (returns, shipping, warranties) when evaluating whether to recommend a product. A product description cannot be evaluated in isolation.

**Decision 5:** We considered using only the LLM for gap detection. We chose to add a deterministic Python layer because LLMs are unreliable for absolute logic checks (e.g., "does the title say black and the description say brown?"). Pure string matching guarantees this class of error is caught every time.

---

## Scope Decisions (What We Chose NOT To Build)

**Excluded: Real Shopify API integration** — The hackathon explicitly permits synthetic data. Integrating the Shopify Admin GraphQL API would add OAuth complexity and time cost with no evaluation benefit.

**Excluded: Image analysis** — Analyzing product images for AI readiness (alt text, visual clarity) would require a vision model. Scoped out to keep the system focused and reliable.

**Excluded: A "Shadow Database" endpoint** — We considered building a dual-reality system where merchants serve different content to AI bots vs humans. Descoped because the rubric prioritizes diagnostic depth over publishing architecture.

---

## Auto-Generated Audit Summary
*(generated from shopmind_results.json)*
- **Store Readiness Score**: 22.0%
- **Verdict**: STORE AT RISK
- **Total Audited**: 10
- **Priority Breakdown**: CRITICAL: 7, HIGH: 3, MEDIUM: 0

**Top Critical Products:**
- Shirt
- Women's running shoes
