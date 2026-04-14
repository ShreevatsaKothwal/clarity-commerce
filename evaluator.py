import json
import google.generativeai as genai

def get_fallback_response(product_id: str) -> dict:
    """Returns a safe fallback object when the LLM evaluation fails."""
    return {
        "product_id": product_id,
        "readiness_score": 0,
        "status": "unknown",
        "ai_perception": {
            "interpreted_category": "unknown",
            "interpreted_use_case": "unknown",
            "confidence": 0.0,
            "possible_misunderstanding": "Evaluation process failed."
        },
        "evaluation": {
            "completeness": {"passed": False, "feedback": "System failure."},
            "consistency": {"passed": False, "feedback": "System failure."},
            "clarity": {"passed": False, "feedback": "System failure."}
        },
        "misalignment": {
            "merchant_intent": "unknown",
            "ai_interpretation": "unknown",
            "gap": "unknown"
        },
        "suggested_fix": {
            "field": "none",
            "updated_text": ""
        }
    }

def build_evaluation_prompt(product: dict, product_id: str) -> str:
    """Constructs the structured prompt for product evaluation."""
    return f"""
You are an AI system evaluating how well a product is represented for AI-driven commerce systems.

Your task is NOT just to check quality, but to analyze how an AI shopping agent would interpret the product and identify gaps between the merchant’s intent and the AI’s understanding.

You MUST return ONLY valid JSON. Do NOT include any explanation or extra text.

---

INPUT:
You will be given a product object with fields like:
- title
- description
- price
- category
- merchant_intent

---

YOUR TASK:

1. AI PERCEPTION:
Analyze how an AI shopping agent would interpret this product:
- What category would it assign?
- What use-case would it infer?
- How confident is it (0.0 to 1.0)?
- What might it misunderstand?

2. EVALUATION:

Evaluate across 3 dimensions:

A. COMPLETENESS
- Are key details missing? (size, material, specs, etc.)
- Would an AI agent struggle to answer user queries?

B. CONSISTENCY
- Are there contradictions between title, description, category?
- Any mismatch in attributes?

C. CLARITY
- Is the language clear and user-friendly?
- Or too vague / too technical / jargon-heavy?

3. MISALIGNMENT ANALYSIS:
Compare:
- merchant_intent (what seller wants to convey)
vs
- ai_interpretation (what AI actually understands)

Explain the gap clearly.

4. READINESS SCORE:
Give a score from 0 to 100 based on:
- completeness
- consistency
- clarity
- alignment with intent

Also assign:
- "green" → strong representation
- "yellow" → moderate issues
- "red" → major issues

5. SUGGESTED FIX:
Give ONE actionable fix:
- which field to change
- improved version of text

---

OUTPUT FORMAT (STRICT JSON ONLY):

{{
  "product_id": "{product_id}",
  "readiness_score": 0,
  "status": "green | yellow | red",
  "ai_perception": {{
    "interpreted_category": "",
    "interpreted_use_case": "",
    "confidence": 0.0,
    "possible_misunderstanding": ""
  }},
  "evaluation": {{
    "completeness": {{
      "passed": true,
      "feedback": ""
    }},
    "consistency": {{
      "passed": true,
      "feedback": ""
    }},
    "clarity": {{
      "passed": true,
      "feedback": ""
    }}
  }},
  "misalignment": {{
    "merchant_intent": "",
    "ai_interpretation": "",
    "gap": ""
  }},
  "suggested_fix": {{
    "field": "",
    "updated_text": ""
  }}
}}

---

IMPORTANT RULES:

- Output MUST be valid JSON (no markdown, no explanation)
- Do not hallucinate missing fields—base reasoning only on given data
- Keep feedback concise but meaningful
- Confidence must be between 0 and 1
- Always include all fields

Now evaluate the following product:
{json.dumps(product, indent=2)}
"""

def evaluate_product(product: dict, model: genai.GenerativeModel) -> dict:
    """Calls the Gemini API to evaluate a single product."""
    product_id = product.get("id", "unknown")
    prompt = build_evaluation_prompt(product, product_id)
    
    try:
        # Enforcing JSON output using the generation_config
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        # Parse the JSON response
        response_text = response.text.strip()
        parsed_json = json.loads(response_text)
        return parsed_json
        
    except json.JSONDecodeError as json_err:
        print(f"  [!] LLM Output parsing failed for {product_id}. Invalid JSON returned: {json_err}")
        return get_fallback_response(product_id)
    except Exception as e:
        print(f"  [!] Evaluation failed for product {product_id}: {e}")
        return get_fallback_response(product_id)
