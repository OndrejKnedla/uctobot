from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the path
        path = self.path
        
        # Root endpoint - serve HTML
        if path == '/' or path == '':
            # Try to read the HTML file
            html_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'index.html')
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
            except FileNotFoundError:
                # Fallback to API response if HTML not found
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "message": "Hello from Uctobot API",
                    "status": "running",
                    "endpoints": ["/api/health", "/api/webhook"],
                    "note": "Frontend not deployed"
                }
                self.wfile.write(json.dumps(response).encode())
            
        # Health check endpoint
        elif path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "healthy", "service": "uctobot"}
            self.wfile.write(json.dumps(response).encode())
            
        # Serve static files
        elif path.startswith('/_next/') or path.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff2')):
            # Construct file path
            file_path = os.path.join(os.path.dirname(__file__), '..', 'static', path.lstrip('/'))
            
            # Determine content type
            content_types = {
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.woff2': 'font/woff2'
            }
            
            ext = os.path.splitext(path)[1]
            content_type = content_types.get(ext, 'application/octet-stream')
            
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.send_header('Cache-Control', 'public, max-age=31536000')
                self.end_headers()
                self.wfile.write(content)
            except FileNotFoundError:
                self.send_response(404)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'File not found')
            
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