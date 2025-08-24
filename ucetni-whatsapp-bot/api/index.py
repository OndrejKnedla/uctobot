from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def _send_response(self, status_code, content_type, body):
        """Send response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        if isinstance(body, str):
            self.wfile.write(body.encode('utf-8'))
        else:
            self.wfile.write(body)

    def _handle_request(self):
        """Handle all HTTP methods in one place"""
        method = self.command
        path = self.path
        
        print(f"DEBUG: {method} request to {path}")
        print(f"DEBUG: Headers: {dict(self.headers)}")
        
        # Handle OPTIONS (CORS preflight)
        if method == 'OPTIONS':
            self._send_response(200, 'application/json', '{}')
            return
        
        # Handle root path
        if path == '/':
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
            self._send_response(200, 'text/html', html)
            return
        
        # Handle health endpoint
        if path == '/api/health':
            response = {"message": "ÚčtoBot API", "status": "healthy", "version": "1.0.0"}
            self._send_response(200, 'application/json', json.dumps(response))
            return
        
        # Handle test endpoint
        if path == '/api/test':
            if method == 'GET':
                response = {"message": "Test GET works", "method": method, "path": path}
                self._send_response(200, 'application/json', json.dumps(response))
                return
            elif method == 'POST':
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    post_data = self.rfile.read(content_length)
                    print(f"DEBUG: POST data received: {post_data}")
                    
                    response = {
                        "message": "Test POST works", 
                        "method": method,
                        "path": path,
                        "received_data": post_data.decode('utf-8') if post_data else None
                    }
                    self._send_response(200, 'application/json', json.dumps(response))
                    return
                except Exception as e:
                    print(f"DEBUG: Error handling test POST: {e}")
                    error_response = {"error": str(e)}
                    self._send_response(500, 'application/json', json.dumps(error_response))
                    return
        
        # Handle payment endpoint
        if path == '/api/payments/create-checkout-session':
            if method == 'POST':
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    post_data = self.rfile.read(content_length)
                    print(f"DEBUG: Payment POST data: {post_data}")
                    
                    # Parse JSON data
                    request_data = {}
                    if post_data:
                        try:
                            request_data = json.loads(post_data.decode('utf-8'))
                        except json.JSONDecodeError as e:
                            print(f"DEBUG: JSON decode error: {e}")
                    
                    plan_type = request_data.get('plan_type', 'monthly')
                    trial_days = request_data.get('trial_days', 7)
                    
                    print(f"DEBUG: Processing payment for plan_type='{plan_type}', trial_days={trial_days}")
                    
                    # Mock Stripe response
                    response = {
                        "success": True,
                        "checkout_url": f"https://buy.stripe.com/test_mock_{plan_type}_{trial_days}days",
                        "session_id": f"cs_test_{plan_type}_123",
                        "plan_type": plan_type,
                        "trial_days": trial_days,
                        "message": "Demo checkout session created"
                    }
                    
                    print(f"DEBUG: Returning payment response: {response}")
                    self._send_response(200, 'application/json', json.dumps(response))
                    return
                    
                except Exception as e:
                    print(f"DEBUG: Error in payment handler: {e}")
                    import traceback
                    traceback.print_exc()
                    
                    error_response = {"success": False, "error": str(e)}
                    self._send_response(500, 'application/json', json.dumps(error_response))
                    return
            else:
                # Payment endpoint only accepts POST
                response = {"error": f"Method {method} not allowed for payment endpoint"}
                self._send_response(405, 'application/json', json.dumps(response))
                return
        
        # 404 for other paths
        response = {"error": "Endpoint not found", "path": path, "method": method}
        self._send_response(404, 'application/json', json.dumps(response))

    # Override all HTTP methods to use our single handler
    def do_GET(self):
        self._handle_request()
    
    def do_POST(self):
        self._handle_request()
        
    def do_OPTIONS(self):
        self._handle_request()
        
    def do_PUT(self):
        self._handle_request()
        
    def do_DELETE(self):
        self._handle_request()
        
    def do_HEAD(self):
        self._handle_request()