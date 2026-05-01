# Limitations — ShopMind

## Current Limitations

1. **Prototype infrastructure:** Uses local JSON files and a local server; not production architecture.
2. **No authentication/authorization layer:** API endpoints are designed for local demo use.
3. **Weak persistence guarantees:** No transactional database, locking, or robust audit history.
4. **LLM dependency variability:** Output quality and latency depend on model/API/network conditions.
5. **Single-node execution:** No queueing, autoscaling, or distributed processing.
6. **Mocked commerce sync:** Integration path is simulated, not full OAuth-backed live sync.
7. **Partial rule coverage:** Deterministic checks currently cover selected representation gaps only.

## Scope Notes

- Real Shopify Admin API integration was intentionally excluded to avoid OAuth and deployment overhead during hackathon timelines.
- Image/vision auditing was out of scope to keep the solution focused on text- and metadata-driven AI representation gaps.
