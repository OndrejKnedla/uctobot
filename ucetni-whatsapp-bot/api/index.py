from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        """Send CORS headers for all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def _send_json_response(self, status_code, data):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_html_response(self, html):
        """Send HTML response with CORS headers"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        print(f"DEBUG: OPTIONS request to {self.path}")
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        print(f"DEBUG: GET request to {self.path}")
        
        if self.path == '/':
            # Landing page
            html = '''<!DOCTYPE html>
<html>
<head>
    <title>ÚčtoBot</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #25D366, #128C7E); 
            color: white; 
            text-align: center; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px); 
        }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        p { font-size: 1.3rem; margin-bottom: 30px; }
        .btn { 
            background: white; 
            color: #25D366; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 1.1rem; 
        }
    </style>
    <meta http-equiv="refresh" content="3;url=https://uctobot-git-master-realok2001-gmailcoms-projects.vercel.app">
</head>
<body>
    <div class="container">
        <h1>🤖 ÚčtoBot</h1>
        <p>Účetnictví pro OSVČ přes WhatsApp</p>
        <p>Přesměrovávám na aplikaci...</p>
        <a href="https://uctobot-git-master-realok2001-gmailcoms-projects.vercel.app" class="btn">Pokračovat</a>
    </div>
</body>
</html>'''
            self._send_html_response(html)
            
        elif self.path == '/api/health':
            # Health check
            response = {"message": "ÚčtoBot API", "status": "healthy", "version": "1.0.0"}
            self._send_json_response(200, response)
            
        elif self.path == '/api/test':
            # Simple test endpoint
            response = {"message": "Test endpoint works", "method": "GET"}
            self._send_json_response(200, response)
            
        else:
            # 404 for other GET requests
            response = {"error": "Not found", "path": self.path, "method": "GET"}
            self._send_json_response(404, response)
    
    def do_POST(self):
        """Handle POST requests"""
        print(f"DEBUG: POST request to {self.path}")
        print(f"DEBUG: Headers: {dict(self.headers)}")
        
        # Test all possible paths for payment endpoint
        print(f"DEBUG: Checking path '{self.path}' against payment endpoint")
        if (self.path == '/api/payments/create-checkout-session' or 
            self.path.endswith('/api/payments/create-checkout-session') or
            '/api/payments/create-checkout-session' in self.path):
            try:
                # Read POST data
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                print(f"DEBUG: Raw POST data: {post_data}")
                
                # Parse JSON data
                if post_data:
                    try:
                        request_data = json.loads(post_data.decode('utf-8'))
                        print(f"DEBUG: Parsed JSON data: {request_data}")
                    except json.JSONDecodeError as e:
                        print(f"DEBUG: JSON decode error: {e}")
                        request_data = {}
                else:
                    request_data = {}
                
                plan_type = request_data.get('plan_type', 'monthly')
                trial_days = request_data.get('trial_days', 7)
                
                print(f"DEBUG: Processing payment for plan_type='{plan_type}', trial_days={trial_days}")
                
                # Mock Stripe response for production demo
                response = {
                    "success": True,
                    "checkout_url": f"https://buy.stripe.com/test_mock_{plan_type}_{trial_days}days",
                    "session_id": f"cs_test_{plan_type}_123",
                    "plan_type": plan_type,
                    "trial_days": trial_days,
                    "message": "Demo checkout session created"
                }
                
                print(f"DEBUG: Returning response: {response}")
                self._send_json_response(200, response)
                
            except Exception as e:
                print(f"DEBUG: Error in payment handler: {e}")
                import traceback
                traceback.print_exc()
                
                error_response = {"success": False, "error": str(e)}
                self._send_json_response(500, error_response)
        
        elif self.path == '/api/test':
            # Simple POST test endpoint
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                print(f"DEBUG: Test POST data: {post_data}")
                
                response = {
                    "message": "Test POST endpoint works", 
                    "method": "POST",
                    "received_data": post_data.decode('utf-8') if post_data else None
                }
                self._send_json_response(200, response)
            except Exception as e:
                print(f"DEBUG: Error in test POST: {e}")
                self._send_json_response(500, {"error": str(e)})
        
        else:
            # 404 for other POST requests
            response = {"error": "Endpoint not found", "path": self.path, "method": "POST"}
            self._send_json_response(404, response)