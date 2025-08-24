import json
import os
from urllib.parse import parse_qs, urlparse

def handler(request, context):
    """Vercel serverless function handler"""
    
    # Get request details
    method = request.method
    path = request.path if hasattr(request, 'path') else request.url.path
    
    print(f"DEBUG: {method} request to path: '{path}'")
    
    # Handle CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            'body': ''
        }
    
    # Handle root path - landing page
    if path == '/' or path == '':
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
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*',
            },
            'body': html
        }
    
    # Handle health endpoint
    if path == '/api/health':
        response = {"message": "ÚčtoBot API", "status": "healthy", "version": "1.0.0"}
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            'body': json.dumps(response)
        }
    
    # Handle payment endpoint
    if path == '/api/payments/create-checkout-session' or path == 'api/payments/create-checkout-session':
        print(f"DEBUG: Payment endpoint called with method: {method}")
        
        try:
            # Get request body for POST requests
            request_data = {}
            if method == 'POST' and hasattr(request, 'body'):
                try:
                    if isinstance(request.body, str):
                        request_data = json.loads(request.body)
                    elif isinstance(request.body, bytes):
                        request_data = json.loads(request.body.decode('utf-8'))
                except:
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
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                'body': json.dumps(response)
            }
            
        except Exception as e:
            print(f"DEBUG: Error in payment handler: {e}")
            
            error_response = {"success": False, "error": str(e)}
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
                'body': json.dumps(error_response)
            }
    
    # Handle 404 for other paths
    print(f"DEBUG: 404 - Endpoint not found for path: '{path}'")
    error_response = {"error": "Endpoint not found", "path": path}
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        'body': json.dumps(error_response)
    }