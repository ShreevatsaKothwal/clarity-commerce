import google.generativeai as genai
import json

def initialize_model(api_key):
    """Initializes the Gemini model dynamically."""
    genai.configure(api_key=api_key)
    try:
        available_models = [m.name for m in genai.list_models() if "generateContent" in m.supported_generation_methods]
        target_model = "models/gemini-2.5-flash"
        if target_model not in available_models:
             target_model = "models/gemini-1.5-flash"
        return genai.GenerativeModel(target_model)
    except Exception as e:
        print(f"Model Init Error: {e}")
        return None

def evaluate_with_llm(product, context, model):
    """
    Layer 2A: The LLM Perception Engine.
    Simulates three separate buyer personas in one single AI API call using JSON extraction.
    """
    prompt = f"""
You are the ShopMind Dual Analysis Engine. 
You will simulate 3 distinct AI Personas evaluating this product to determine if they would recommend it.

Store Context: {json.dumps(context)}
Product Details: {json.dumps(product)}

PERSONAS TO SIMULATE:
1. "travel_planner": Cares about exact logistics, size inches/cm, weight, airline rules.
2. "deal_finder": Cares about price, explicit material quality, warranty policies, clarity of value.
3. "stylist": Cares about aesthetics, clear color/brand matching, and direct use-cases.

TASK:
Evaluate if each persona would 'buy' or 'reject' based on gaps in the product's representation.
Provide an estimated 'ai_rejection_probability' (0.0 to 1.0) indicating how likely an AI agent drops this product overall compared to a generic, highly-specified competitor.

OUTPUT STRICTLY JSON ONLY (using exactly this structure):
{{
  "ai_rejection_probability": 0.8,
  "personas": {{
    "travel_planner": {{"verdict": "buy|reject", "reason": "short explanation"}},
    "deal_finder": {{"verdict": "buy|reject", "reason": "short explanation"}},
    "stylist": {{"verdict": "buy|reject", "reason": "short explanation"}}
  }},
  "suggested_fix": {{
    "field": "title or description",
    "updated_text": "The perfectly rewritten, highly specific product data solving the gaps."
  }}
}}
"""
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"   [API Warning] {e}")
        # Safe fallback for UI dashboard to prevent crashes
        return {
            "ai_rejection_probability": 1.0, 
            "personas": {}, 
            "error": "LLM validation failed.",
            "suggested_fix": {"updated_text": ""}
        }
