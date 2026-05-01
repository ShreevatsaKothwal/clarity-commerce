# Implementation Decisions — ShopMind

## 1) Dual-Layer Analysis (LLM + Deterministic)

- **Decision:** Use two analysis methods instead of LLM-only.
- **Why:** Deterministic checks guarantee absolute logic validation and keep output available even when LLM calls fail.
- **Tradeoff:** More code complexity, but much better reliability.

## 2) Persona-Based Prompting in a Single LLM Call

- **Decision:** Simulate multiple buying personas in one completion.
- **Why:** Improves semantic coverage per product while controlling API latency and cost.
- **Tradeoff:** Prompt design and JSON parsing must be strict and fault-tolerant.

## 3) File-Based Persistence (JSON) for Hackathon Scope

- **Decision:** Store inputs and outputs in JSON files.
- **Why:** Fast setup, transparent debugging, and no infrastructure dependency.
- **Tradeoff:** Not suitable for concurrent multi-user production workloads.

## 4) Lightweight Python Server for API + Static UI

- **Decision:** Use Python's `http.server` (`server.py`) instead of a larger framework.
- **Why:** Faster development and fewer moving parts for a stable demo.
- **Tradeoff:** Limited middleware, validation, and security features out of the box.

## 5) Priority Matrix Instead of Pass/Fail

- **Decision:** Output weighted impact score and priority ranks (`CRITICAL/HIGH/MEDIUM`).
- **Why:** Merchants need execution order, not just issue existence.
- **Tradeoff:** Weight calibration may need tuning with broader real-world data.
