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
    category = product.get('category', '').lower()
    
    if 'electronics' in category:
        personas_text = """1. "procurement_agent": Cares about exact specs, compatibility, and B2B pricing.
2. "spec_engineer": Cares about technical thresholds, materials, and operating limits.
3. "price_analyst": Cares about bulk value, ROI, and explicit warranty coverage."""
        personas_keys = ["procurement_agent", "spec_engineer", "price_analyst"]
    elif 'footwear' in category or 'shoes' in category:
        personas_text = """1. "fitness_coach": Cares about performance features, material breathability, and sole drop.
2. "casual_wearer": Cares about daily comfort, style, and color matching.
3. "podiatrist_ai": Cares about arch support, width options, and orthopedic benefits."""
        personas_keys = ["fitness_coach", "casual_wearer", "podiatrist_ai"]
    else:
        personas_text = """1. "travel_planner": Cares about exact logistics, size inches/cm, weight, airline rules.
2. "deal_finder": Cares about price, explicit material quality, warranty policies, clarity of value.
3. "stylist": Cares about aesthetics, clear color/brand matching, and direct use-cases."""
        personas_keys = ["travel_planner", "deal_finder", "stylist"]
        
    merchant_intent = product.get('merchant_intent', 'Not specified.')
    has_image = "Yes" if product.get('image_url') else "No"

    prompt = f"""
You are the ShopMind Dual Analysis Engine. 
You will simulate 3 distinct AI Personas evaluating this product to determine if they would recommend it.

Store Context: {json.dumps(context)}
Product Details: {json.dumps(product)}

MERCHANT INTENT (What they want to achieve vs what the listing actually says):
{merchant_intent}

MOCK VISION ANALYSIS:
Does this product have an image? {has_image}. (If No, the visual clarity is 0, which should increase ai_rejection_probability).

PERSONAS TO SIMULATE:
{personas_text}

TASK:
Evaluate if each persona would 'buy' or 'reject' based on gaps in the product's representation compared to the merchant intent. If no image is provided, heavily penalize.
Provide an estimated 'ai_rejection_probability' (0.0 to 1.0) indicating how likely an AI agent drops this product overall compared to a generic, highly-specified competitor.

OUTPUT STRICTLY JSON ONLY (using exactly this structure):
{{
  "ai_rejection_probability": 0.8,
  "personas": {{
    "{personas_keys[0]}": {{"verdict": "buy|reject", "reason": "short explanation"}},
    "{personas_keys[1]}": {{"verdict": "buy|reject", "reason": "short explanation"}},
    "{personas_keys[2]}": {{"verdict": "buy|reject", "reason": "short explanation"}}
  }},
  "suggested_fix": {{
    "field": "description",
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
            "ai_rejection_probability": None, 
            "personas": {}, 
            "error": "LLM validation failed.",
            "suggested_fix": {"updated_text": ""}
        }
