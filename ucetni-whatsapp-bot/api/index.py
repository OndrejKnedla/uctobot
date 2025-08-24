import json
import os

def handler(request):
    """Simple Vercel handler for all requests"""
    
    # Get request details from Vercel request object
    method = getattr(request, 'method', 'GET')
    url = getattr(request, 'url', '')
    path = getattr(request, 'path', url)
    
    print(f"DEBUG: {method} request to path: '{path}'")
    print(f"DEBUG: Full request object attributes: {dir(request)}")
    
    # Common CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
    }
    
    # Handle OPTIONS (preflight) requests
    if method == 'OPTIONS':
        print(f"DEBUG: Handling OPTIONS preflight request")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'CORS preflight OK'})
        }
    
    # Handle root path - landing page
    if path == '/' or path == '' or not path:
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
    if '/api/health' in path:
        response = {"message": "ÚčtoBot API", "status": "healthy", "version": "1.0.0"}
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(response)
        }
    
    # Handle payment endpoint
    if '/api/payments/create-checkout-session' in path:
        print(f"DEBUG: Payment endpoint called with method: {method}")
        
        try:
            # Get request body for POST requests
            request_data = {}
            if method == 'POST':
                body = getattr(request, 'body', None)
                if body:
                    if isinstance(body, str):
                        request_data = json.loads(body)
                    elif isinstance(body, bytes):
                        request_data = json.loads(body.decode('utf-8'))
                    else:
                        # Try to get JSON data from request
                        json_data = getattr(request, 'json', None)
                        if json_data:
                            request_data = json_data() if callable(json_data) else json_data
                        
            print(f"DEBUG: Request data: {request_data}")
            
            plan_type = request_data.get('plan_type', 'monthly') if request_data else 'monthly'
            trial_days = request_data.get('trial_days', 7) if request_data else 7
            
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
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps(response)
            }
            
        except Exception as e:
            print(f"DEBUG: Error in payment handler: {e}")
            import traceback
            traceback.print_exc()
            
            error_response = {"success": False, "error": str(e)}
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps(error_response)
            }
    
    # Handle 404 for other paths
    print(f"DEBUG: 404 - Endpoint not found for path: '{path}'")
    error_response = {"error": "Endpoint not found", "path": path, "method": method}
    return {
        'statusCode': 404,
        'headers': cors_headers,
        'body': json.dumps(error_response)
    }