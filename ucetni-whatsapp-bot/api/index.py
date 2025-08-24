from flask import Flask, request, jsonify, make_response
import json

# Create Flask app
app = Flask(__name__)

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

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

@app.route('/api/test', methods=['GET', 'POST', 'OPTIONS'])
def test():
    """Test endpoint for debugging"""
    print(f"DEBUG: {request.method} request to /api/test")
    print(f"DEBUG: Headers: {dict(request.headers)}")
    
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS OK'})
    
    response_data = {
        "message": f"Test {request.method} works!",
        "method": request.method,
        "path": request.path,
        "headers": dict(request.headers)
    }
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            response_data["received_data"] = data
            print(f"DEBUG: POST data: {data}")
        except Exception as e:
            response_data["json_error"] = str(e)
    
    return jsonify(response_data)

@app.route('/api/payments/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    """Handle payment checkout session creation"""
    
    print(f"DEBUG: {request.method} request to /api/payments/create-checkout-session")
    print(f"DEBUG: Request headers: {dict(request.headers)}")
    
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight OK'})
    
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
        return jsonify(response)
        
    except Exception as e:
        print(f"DEBUG: Error in payment handler: {e}")
        import traceback
        traceback.print_exc()
        
        error_response = {"success": False, "error": str(e)}
        return jsonify(error_response), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found", 
        "path": request.path,
        "method": request.method
    }), 404

# Export the Flask app for Vercel
# This is the key - Vercel expects 'app' variable
if __name__ == '__main__':
    app.run(debug=True)

# For Vercel WSGI
def handler(event, context):
    """Vercel handler that wraps Flask app"""
    return app(event, context)