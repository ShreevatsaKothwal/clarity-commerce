import json
import os

def load_products(filepath: str) -> list:
    """Loads the synthetic product data from a JSON file."""
    if not os.path.exists(filepath):
        print(f"Error: Could not find {filepath}")
        exit(1)
        
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error: {filepath} is not valid JSON")
        exit(1)
