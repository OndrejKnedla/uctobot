from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle WhatsApp webhook verification"""
        # Parse query parameters
        query_string = self.path.split('?')[1] if '?' in self.path else ''
        params = parse_qs(query_string)
        
        # WhatsApp webhook verification
        hub_mode = params.get('hub.mode', [''])[0]
        hub_challenge = params.get('hub.challenge', [''])[0]
        hub_verify_token = params.get('hub.verify_token', [''])[0]
        
        # Your verify token (should match what you set in WhatsApp webhook settings)
        VERIFY_TOKEN = os.environ.get('WHATSAPP_VERIFY_TOKEN', 'uctobot-verify-2024')
        
        if hub_mode == 'subscribe' and hub_verify_token == VERIFY_TOKEN:
            # Respond with the challenge to verify the webhook
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(hub_challenge.encode())
        else:
            self.send_response(403)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Verification failed"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle incoming WhatsApp messages"""
        try:
            # Get the message data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Log the incoming webhook (for debugging)
            print(f"Incoming webhook data: {json.dumps(data, indent=2)}")
            
            # Process WhatsApp message
            if 'entry' in data:
                for entry in data['entry']:
                    if 'changes' in entry:
                        for change in entry['changes']:
                            if change.get('field') == 'messages':
                                # Extract message details
                                value = change.get('value', {})
                                messages = value.get('messages', [])
                                
                                for message in messages:
                                    from_number = message.get('from', '')
                                    message_type = message.get('type', '')
                                    
                                    # Handle text messages
                                    if message_type == 'text':
                                        text_body = message.get('text', {}).get('body', '')
                                        print(f"Received message from {from_number}: {text_body}")
                                        
                                        # TODO: Process the message with AI
                                        # TODO: Send response back via WhatsApp API
            
            # Always respond with 200 to acknowledge receipt
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "received"}
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"Error processing webhook: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": str(e)}
            self.wfile.write(json.dumps(response).encode())