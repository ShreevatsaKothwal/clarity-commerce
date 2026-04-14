import json
import os

def load_json(filepath):
    """Safely loads JSON data from a filepath."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load {filepath} - {e}")
        return None

def ingest_storefront_data():
    """
    Layer 1 Ingestion: 
    Pulls in products, explicit store policies, and competitor shadows to build a unified 'Audit Context State'.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    products = load_json(os.path.join(base_dir, 'products.json'))
    store_context = load_json(os.path.join(base_dir, 'store_context.json'))
    competitors = load_json(os.path.join(base_dir, 'competitor_shadow.json'))
    
    return {
        "products": products if products else [],
        "store_context": store_context if store_context else {},
        "competitors": competitors if competitors else []
    }
