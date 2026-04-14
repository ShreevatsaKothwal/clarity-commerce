import os
import json
from data_loader import load_products
from evaluator import evaluate_product

try:
    import google.generativeai as genai
except ImportError:
    print("Error: The 'google-generativeai' package is not installed.")
    print("Please run: pip install google-generativeai")
    exit(1)

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        print("To run this script, execute the following command first:")
        print("export GEMINI_API_KEY='your_api_key_here'")
        exit(1)

    # Initialize Gemini
    genai.configure(api_key=api_key)
    
    # Dynamically find a supported model to avoid 404 errors
    print("\nDetecting available models on your API key...")
    available_models = []
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    except Exception as e:
        print(f"Warning: Could not list models: {e}")
        available_models = ['models/gemini-1.5-flash', 'models/gemini-1.0-pro']

    model_name = None
    # Prefer flash versions, fallback to whatever is available
    preferred = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-1.5-flash', 'models/gemini-1.5-pro', 'models/gemini-1.0-pro']
    for pref in preferred:
        if pref in available_models:
            model_name = pref
            break
            
    if not model_name and available_models:
        model_name = available_models[0]
        
    print(f"[✓] Automatically selected model: {model_name}")
    model = genai.GenerativeModel(model_name)

    # Load data
    dataset_path = "products.json"
    products = load_products(dataset_path)
    
    print(f"Loaded {len(products)} products. Starting AI Evaluation Engine...\n")
    print("-" * 60)
    
    import time
    
    results = []
    for idx, p in enumerate(products):
        title = p.get('title', 'Unknown Title')
        prod_id = p.get('id', 'unknown')
        
        print(f"Evaluating Product: [{prod_id}] {title} ...", end=" ", flush=True)
        
        eval_result = evaluate_product(p, model)
        results.append(eval_result)
        
        status = eval_result.get("status", "unknown").upper()
        score = eval_result.get("readiness_score", 0)
        print(f"Done! Score: {score}/100, Status: {status}")
        
        # Add a delay between requests to avoid hitting the 5-requests-per-minute Free Tier API limit
        if idx < len(products) - 1:
            print("  (Waiting 15 seconds to respect free tier rate limit...)")
            time.sleep(15)
        
    print("\n" + "="*80)
    print("FINAL STRUCTURED EVALUATION RESULTS (JSON PAYLOAD)")
    print("="*80)
    print(json.dumps(results, indent=2))
    
    # Save the results to a file
    results_path = "results.json"
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n[+] Results successfully saved to {results_path}")
    
    print("\n" + "="*80)
    print("Phase 1 Execution Complete. The Engine is functional.")
    print("="*80)

if __name__ == "__main__":
    main()
