from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        path = self.path
        
        # Root endpoint
        if path == '/' or path == '':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "message": "Hello from Uctobot API",
                "status": "running",
                "endpoints": ["/", "/api/health"]
            }
            self.wfile.write(json.dumps(response).encode())
            
        # Health check endpoint
        elif path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "service": "uctobot"}
            self.wfile.write(json.dumps(response).encode())
            
        # 404 for other paths
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        # Handle POST requests
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {"message": "POST received", "data_length": content_length}
        self.wfile.write(json.dumps(response).encode())