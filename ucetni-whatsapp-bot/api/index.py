from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)

# Configure CORS with specific settings
CORS(app, 
     origins=['*'],  # Allow all origins
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=False)

@app.route('/', methods=['GET'])
def home():
    """Landing page with redirect"""
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
    return html

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "message": "ÚčtoBot API", 
        "status": "healthy", 
        "version": "1.0.0"
    })

@app.route('/api/payments/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    """Handle payment checkout session creation"""
    
    print(f"DEBUG: {request.method} request to /api/payments/create-checkout-session")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    print(f"DEBUG: Request origin: {request.headers.get('Origin', 'No origin')}")
    
    if request.method == 'OPTIONS':
        # Handle preflight CORS request with explicit headers
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return response, 200
    
    try:
        # Get request data
        request_data = request.get_json() or {}
        print(f"DEBUG: Request data: {request_data}")
        
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
        
        # Create response with explicit CORS headers
        flask_response = jsonify(response)
        flask_response.headers.add('Access-Control-Allow-Origin', '*')
        flask_response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        flask_response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return flask_response, 200
        
    except Exception as e:
        print(f"DEBUG: Error in payment handler: {e}")
        error_response = {"success": False, "error": str(e)}
        
        # Create error response with explicit CORS headers
        flask_response = jsonify(error_response)
        flask_response.headers.add('Access-Control-Allow-Origin', '*')
        flask_response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        flask_response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return flask_response, 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found", "path": request.path}), 404

if __name__ == '__main__':
    app.run(debug=True)