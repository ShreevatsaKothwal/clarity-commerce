import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class APIHandler(SimpleHTTPRequestHandler):
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
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "message": "Fix applied successfully."}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_error(404, "Endpoint not found")

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"🚀 ShopMind UI & Mock API Server running at http://localhost:{port}")
    httpd.serve_forever()
