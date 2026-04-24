import os
import time
import json
import warnings

# Suppress annoying python deprecation warnings from legacy libraries
warnings.filterwarnings('ignore')

from layer1_ingestion import ingest_storefront_data
from layer2_llm import evaluate_with_llm, initialize_model
from layer2_deterministic import analyze_deterministic_gaps
from layer3_scorer import calculate_displacement
from layer5_store_summary import generate_store_summary

def run_shopmind_engine():
    # Authentication Check
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("CRITICAL: Missing GEMINI_API_KEY environment variable!")
        print("Please run: export GEMINI_API_KEY='your_key'")
        return
        
    print("Booting ShopMind Two-Layer Engine...")
    model = initialize_model(api_key)
    if not model:
        print("Failed to bind to Google Gemini API.")
        return
        
    # LAYER 1
    data = ingest_storefront_data()
    products = data.get('products', [])
    store_context = data.get('store_context', {})
    competitors = data.get('competitors', [])
    
    print("-" * 60)
    
    final_dashboard_payload = []
    
    for idx, p in enumerate(products):
        print(f"Analyzing [{p.get('id')}]: {p.get('title')}", end=" ", flush=True)
        
        # LAYER 2A: Qualitative LLM (Multi-Persona)
        llm_result = evaluate_with_llm(p, store_context, model)
        
        # LAYER 2B: Pure Python gap detection (Deterministic logic)
        det_result = analyze_deterministic_gaps(p, store_context)
        
        # LAYER 3: Competitive Displacement Math
        scorer_result = calculate_displacement(p, llm_result, det_result, competitors)
        
        # Construct the ultimate JSON for Layer 4 (the UI Dashboard)
        product_card = {
            "product_id": p.get('id'),
            "title": p.get('title'),
            "description": p.get('description', ''),
            "category": p.get('category', ''),
            "price": p.get('price', 0),
            "priority": scorer_result.get("priority_rank"),
            "impact_score": scorer_result.get("calculated_impact_score"),
            "displacement_risk": scorer_result.get("displacement_risk"),
            "competitor_advantage": scorer_result.get("competitor_advantage_note"),
            "llm_persona_verdicts": llm_result.get("personas"),
            "deterministic_issues": det_result.get("deterministic_issues"),
            "suggested_fix": llm_result.get("suggested_fix")
        }
        
        final_dashboard_payload.append(product_card)
        priority_label = scorer_result.get('priority_rank')
        print(f" -> Priority: {priority_label} (Score: {scorer_result.get('calculated_impact_score')})")
        
        if idx < len(products) - 1:
            # Mandated Free-Tier API limit handling
            time.sleep(15) 
            
    # Save output securely
    store_summary = generate_store_summary(final_dashboard_payload, store_context)
    print(f"\nStore AI Readiness Score: {store_summary['store_ai_readiness_score']}% — {store_summary['verdict']}")
    
    final_output = {
        "store_summary": store_summary,
        "products": final_dashboard_payload
    }
    with open('shopmind_results.json', 'w') as f:
        json.dump(final_output, f, indent=2)
        
    print("\n" + "="*80)
    print("ShopMind Matrix Complete!")
    print("Dashboard raw JSON generated at: shopmind_results.json")
    print("="*80)

if __name__ == "__main__":
    run_shopmind_engine()
