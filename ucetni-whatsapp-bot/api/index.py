from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"DEBUG: GET request to path: '{self.path}'")
        
        # Check if it's a payment endpoint request (might come as GET due to Vercel routing)
        path = self.path.lstrip('/')
        if path == 'api/payments/create-checkout-session' or self.path == '/api/payments/create-checkout-session':
            self.handle_payment_request()
            return
            
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
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
            
            self.wfile.write(html.encode())
            
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"message": "ÚčtoBot API", "status": "healthy", "version": "1.0.0"}
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"error": "Not found", "path": self.path}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        # Normalize path for Vercel routing
        path = self.path.lstrip('/')
        print(f"DEBUG: POST request to path: '{self.path}', normalized: '{path}'")
        
        if path == 'api/payments/create-checkout-session' or self.path == '/api/payments/create-checkout-session':
            self.handle_payment_request()
            return
        else:
            print(f"DEBUG: POST endpoint not found for path: '{self.path}'")
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            response = {"error": "Endpoint not found", "path": self.path}
            self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        print(f"DEBUG: OPTIONS request to path: '{self.path}'")
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def handle_payment_request(self):
        """Handle payment request regardless of HTTP method"""
        print(f"DEBUG: Payment request handler called for path: '{self.path}', method: '{self.command}'")
        
        # Read POST data if available
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b''
        
        try:
            request_data = json.loads(post_data.decode('utf-8')) if post_data else {}
            plan_type = request_data.get('plan_type', 'monthly')
            trial_days = request_data.get('trial_days', 7)
            
            print(f"DEBUG: Processing payment for plan_type='{plan_type}', trial_days={trial_days}")
            
            # Mock Stripe response for production demo
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            response = {
                "success": True,
                "checkout_url": f"https://buy.stripe.com/test_mock_{plan_type}_{trial_days}days",
                "session_id": f"cs_test_{plan_type}_123",
                "plan_type": plan_type,
                "trial_days": trial_days,
                "message": "Demo checkout session created"
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"DEBUG: Error in payment handler: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
            
            response = {"success": False, "error": str(e)}
            self.wfile.write(json.dumps(response).encode())