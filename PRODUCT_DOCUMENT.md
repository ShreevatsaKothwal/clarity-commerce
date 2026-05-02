# Product Document

**ShopMind — AI Representation Optimizer**  
**Team:** ClarityCommerce | Shreevatsa K & Ateeb | Dayananda Sagar University, B.Tech 3rd Year  
**Track:** Track 5 (Advanced): AI Representation Optimizer  

---

## Overview
Shopping is fundamentally changing. In 2025, ChatGPT began completing purchases inside conversations, Google's AI Mode started recommending products directly in search results, and Shopify launched its Agentic Plan to connect merchant catalogs to AI shopping channels. This is not a future trend—it is happening right now.

AI shopping agents do not browse; they read structured data, such as product titles, descriptions, policies, and metadata, making recommendations based entirely on what that data communicates. If a product description is vague, contradictory, or missing key specifications, the AI agent will either skip the product entirely or misrepresent it to the buyer. 

Merchants currently lack visibility into this process. They write a product description once, publish it, and assume the world can read it. However, an AI agent reading "Stay stylish with this beautiful wallet" gleans almost no usable information—no material, dimensions, or use case. Meanwhile, a competitor's listing that specifies "Brown synthetic leather wallet, 6 card slots, 4.3 x 3.5 inches, RFID blocking, everyday carry" gets recommended immediately.

This gap between a merchant's intended communication and an AI agent's actual understanding is invisible, unmeasured, and growing. ShopMind is designed to make this gap visible and actionable.

## Target Users & Pain Points
**Primary User:** The Shopify merchant—specifically small to mid-size store owners who write and manage their own product listings without a dedicated content or SEO team.

**The Pain Point:**
Their current experience involves crafting product descriptions optimized purely for human readers, focusing on emotional language, lifestyle copy, and aesthetic appeal. They have no feedback loop for AI readiness. Merchants only discover a problem indirectly when traffic drops or sales slow. Currently, they lack a tool that explains why an AI agent would skip their product or what changes are needed to fix it.

ShopMind is built specifically for this merchant. The tool communicates in plain business terms rather than technical jargon about embeddings or vector similarity. For example, it will tell a merchant: *"An AI agent would recommend Amazon Basics instead of your product because your listing is missing exact dimensions."*

## Core User Journey
We built a merchant-facing AI Readiness diagnostic and optimization tool. The core journey consists of five steps:

1. **Store Analysis:** The merchant opens the ShopMind dashboard and immediately sees a Store AI Readiness Score (0-100%) on a gauge meter. They receive a breakdown of Critical, High, and Medium priority issues, along with a store-level warning if FAQ coverage or policies are insufficient.
2. **Product Inspection:** Each product appears as a card featuring a priority badge (CRITICAL, HIGH, MEDIUM) and a one-line displacement risk summary, which names the specific competitor an AI agent would choose instead.
3. **AI Perception View:** Inside the product inspector, the merchant sees exactly how three AI buyer personas evaluated their product (e.g., Travel Planner, Deal Finder, and Stylist). Each persona provides a "buy" or "reject" verdict with a reason. Below this, structural problems identified by the deterministic engine—such as color contradictions, missing dimensions, or price anomalies—are listed.
4. **Apply Fix:** The right column displays an AI-generated improved listing. When the merchant clicks "Apply Improved Listing," the card status updates to FIXED with a green badge, and the overall gauge score improves. Clicking the fixed card reveals a Before vs. After comparison of the listings.
5. **Live Product Add:** Merchants can analyze new products directly from the dashboard via the "+ Add Product" button. After filling in the title, price, category, description, and intent, they click "Analyze." Following five real-time animated steps, the Before vs. After result is displayed.

## Key Features
*   **Store-Level AI Readiness Scoring:** A holistic 0-100% score that evaluates both product data and store context (policies, FAQs).
*   **Persona-Based AI Simulation:** Evaluates products through the lens of three distinct AI buyer personas to provide nuanced, actionable feedback.
*   **Competitive Displacement Alerts:** Explicitly names the competitor an AI would recommend over the merchant's product and explains why.
*   **One-Click Optimization:** Automatically generates AI-optimized listings that address identified flaws and allows for instant application.
*   **Real-Time Live Analysis:** Enables merchants to test new product listings before publishing.

## Key Product Decisions & Reasoning
*   **Showing Three AI Buyer Personas:** We chose to show three distinct AI personas instead of a single score because merchants need to understand *why* their product fails. Knowing that a "Stylist AI" rejected a wallet because it lacked color information is much more actionable than a generic score of 0.87.
*   **Before vs. After Split View:** We implemented a side-by-side comparison when applying fixes because merchants need to trust the system before committing to a change. Seeing exactly what changed builds confidence and makes the tool feel collaborative.
*   **Store-Level Readiness Score:** AI agents evaluate overall store trustworthiness, not just individual listings. A well-described product in a store with poor return policies or no FAQ coverage will still be deprioritized. Therefore, we included store context in our analysis.
*   **Competitive Displacement Framing:** Instead of presenting a generic list of errors, we frame issues as competitive displacement risks. Telling a merchant, *"AI will recommend Amazon Basics Travel Backpack instead of yours because it lacks dimensions,"* is far more motivating than stating *"dimensions field is empty."*
*   **Animated Gauge Meter:** The store readiness score visually animates upward when fixes are applied. This provides immediate positive reinforcement and demonstrates the closed loop: diagnose → fix → score improves.

## What We Chose NOT to Build & Why
*   **Real Shopify API Integration:** The hackathon explicitly permits synthetic data. Integrating the Shopify Admin GraphQL API would require OAuth setup, token management, and webhook handling—a significant time cost with no evaluation benefit. The architecture is designed so this integration can be swapped in later with minimal changes.
*   **Product Image Analysis:** Analyzing images for AI readiness (checking alt text, visual clarity) would require a vision model. While we flag missing images deterministically, processing image content was scoped out to keep the system focused and reliable within the timeline.
*   **Shadow Database / Dual Publishing:** We considered a system where merchants serve optimized structured data to AI crawlers and emotional copy to humans. This was descoped because the rubric prioritizes diagnostic depth and actionable output, though our architecture supports this as a future layer.
*   **Automatic Re-analysis After Fixes:** Re-running the full pipeline after every fix would require managing rate limits mid-session and slow down the UX. The Before vs. After view provides sufficient information for merchants to evaluate changes.

## Tradeoffs
*   **LLM Reliability vs. Deterministic Guarantees:** LLMs provide qualitative insight (tone, jargon density, persona alignment) but are slow, rate-limited, and occasionally return malformed JSON. Deterministic rules offer instant, guaranteed catches but lack nuance. We run both in parallel to combine their strengths, with the deterministic layer serving as a complete fallback if the LLM fails.
*   **Speed vs. Cost Per Analysis:** Running three persona simulations in a single Groq API call is faster and cheaper than three separate calls, but results in a larger, more complex prompt. We chose the single-call approach and added robust JSON cleaning logic to handle edge cases.
*   **Free Tier API Constraints:** After experiencing rate limits and system failures with Gemini Flash's free tier, we switched to Groq's free tier (Llama 3.3 70B) mid-build. This switch eliminated sleep delays and allowed all 10 products to be analyzed in one continuous run.
