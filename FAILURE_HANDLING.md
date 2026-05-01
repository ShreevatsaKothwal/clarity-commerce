# Failure Handling — ShopMind

## 1) Missing API Key

- `shopmind_main.py` checks `GROQ_API_KEY` before execution.
- If missing, the engine exits early with a clear operator message.

## 2) LLM Initialization or Inference Failure

- `layer2_llm.py` wraps model initialization and inference in `try/except`.
- On failure, it returns a safe fallback payload:
  - `ai_rejection_probability: None`
  - empty persona verdict map
  - placeholder `suggested_fix`
- Deterministic analysis and scoring still continue so the pipeline does not hard-fail.

## 3) Live API Endpoint Resilience

- In `server.py`, `/api/analyze_product` runs deterministic checks regardless of LLM availability.
- LLM execution is attempted only when API key exists.
- If LLM fails, endpoint still returns usable scored output with an "LLM skipped/failed" state.

## 4) Corrupt/Invalid Local Fix Storage

- In `server.py`, `/api/apply_fix` handles JSON decode failures for `applied_fixes.json`.
- If the file is corrupt, the system safely resets to an empty list and continues request handling.

## 5) API Pressure Mitigation

- `shopmind_main.py` includes a per-product delay (`time.sleep(15)`) to reduce free-tier throttling bursts.
- This lowers the chance of cascading failures during batch audits.
