import os
import sys
import json
from http.server import BaseHTTPRequestHandler
import urllib.parse

# Add parent directory to path
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        if path == '/' or path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response = {
                "message": "ÚčtoBot API is running",
                "status": "healthy",
                "service": "uctobot",
                "endpoints": [
                    "/api/health",
                    "/payments/create-checkout-session"
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response = {"error": "Not found", "path": path}
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        if path == '/payments/create-checkout-session':
            try:
                # Parse request data
                request_data = json.loads(post_data.decode('utf-8')) if post_data else {}
                plan_type = request_data.get('plan_type', 'monthly')
                trial_days = request_data.get('trial_days', 7)
                
                # Mock Stripe response for now
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                # Return mock checkout URL
                checkout_url = f"https://checkout.stripe.com/c/pay/cs_test_{plan_type}_{trial_days}days"
                response = {
                    "success": True,
                    "checkout_url": checkout_url,
                    "session_id": f"cs_test_{plan_type}_123",
                    "plan_type": plan_type,
                    "trial_days": trial_days,
                    "message": "Checkout session created successfully"
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                
                response = {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to create checkout session"
                }
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response = {"error": "Endpoint not found", "path": path}
            self.wfile.write(json.dumps(response).encode())