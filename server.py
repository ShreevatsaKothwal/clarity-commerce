import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class APIHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/apply_fix':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            
            # Read existing fixes or create new
            fixes_file = 'applied_fixes.json'
            if os.path.exists(fixes_file):
                with open(fixes_file, 'r') as f:
                    try:
                        fixes = json.load(f)
                    except json.JSONDecodeError:
                        fixes = []
            else:
                fixes = []
                
            fixes.append(payload)
            
            with open(fixes_file, 'w') as f:
                json.dump(fixes, f, indent=2)
                
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "message": "Fix applied successfully."}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/analyze_product':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            product = json.loads(post_data.decode('utf-8'))

            # Import and run the pipeline inline
            # import sys, os
            # sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from layer2_deterministic import analyze_deterministic_gaps
            from layer3_scorer import calculate_displacement
            from layer1_ingestion import ingest_storefront_data

            data = ingest_storefront_data()
            store_context = data.get('store_context', {})
            competitors = data.get('competitors', [])

            # Deterministic layer — always runs
            det_result = analyze_deterministic_gaps(product, store_context)

            # LLM layer — try, fallback gracefully
            llm_result = {"ai_rejection_probability": None, "personas": {}, "error": "LLM skipped in live mode", "suggested_fix": {"updated_text": ""}}
            api_key = os.environ.get("GROQ_API_KEY")
            if api_key:
                try:
                    from layer2_llm import evaluate_with_llm, initialize_model
                    model = initialize_model(api_key)
                    if model:
                        llm_result = evaluate_with_llm(product, store_context, model)
                except Exception as e:
                    print(f"LLM skipped: {e}")

            # Scorer
            scorer_result = calculate_displacement(product, llm_result, det_result, competitors)

            response_payload = {
                "product_id": product.get('id'),
                "title": product.get('title'),
                "description": product.get('description', ''),
                "category": product.get('category', ''),
                "price": product.get('price', 0),
                "priority": scorer_result.get("priority_rank"),
                "impact_score": scorer_result.get("calculated_impact_score"),
                "displacement_risk": scorer_result.get("displacement_risk"),
                "competitor_advantage": scorer_result.get("competitor_advantage_note"),
                "llm_persona_verdicts": llm_result.get("personas", {}),
                "deterministic_issues": det_result.get("deterministic_issues", []),
                "suggested_fix": llm_result.get("suggested_fix", {"updated_text": ""})
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_payload).encode('utf-8'))
            return
        else:
            self.send_error(404, "Endpoint not found")
if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"ShopMind UI & Mock API Server running at http://localhost:{port}")
    httpd.serve_forever()
