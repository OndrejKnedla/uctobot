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
        
        if path == '/':
            # Show landing page with redirect to frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://uctobot-web.vercel.app')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self._send_cors_headers()
            self.end_headers()
            
            html_content = f'''<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ÚčtoBot - Účetnictví pro OSVČ přes WhatsApp</title>
    <meta http-equiv="refresh" content="0; url={frontend_url}">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }}
        .container {{
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.2);
        }}
        h1 {{ font-size: 2.5rem; margin-bottom: 20px; }}
        p {{ font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }}
        .btn {{ 
            background: white; 
            color: #25D366; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 10px; 
            font-weight: bold;
            font-size: 1.1rem;
            transition: transform 0.2s;
        }}
        .btn:hover {{ transform: translateY(-2px); }}
        .spinner {{ 
            width: 20px; 
            height: 20px; 
            border: 2px solid rgba(255,255,255,0.3); 
            border-top: 2px solid white; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin: 20px auto;
        }}
        @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 ÚčtoBot</h1>
        <p>Účetnictví pro OSVČ přímo přes WhatsApp</p>
        <div class="spinner"></div>
        <p>Přesměrovávám na aplikaci...</p>
        <a href="{frontend_url}" class="btn">Pokračovat ručně</a>
    </div>
    
    <script>
        // Pokud redirect nefunguje, přesměruj JavaScriptem
        setTimeout(() => {{
            window.location.href = '{frontend_url}';
        }}, 2000);
    </script>
</body>
</html>'''
            
            self.wfile.write(html_content.encode('utf-8'))
            
        elif path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors_headers()
            self.end_headers()
            
            response = {
                "message": "ÚčtoBot API is running",
                "status": "healthy",
                "service": "uctobot",
                "version": "1.0.0",
                "endpoints": [
                    "/api/health",
                    "/api/payments/create-checkout-session"
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
        
        if path == '/payments/create-checkout-session' or path == '/api/payments/create-checkout-session':
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