from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json
import os
import mimetypes

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the path and remove query parameters
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Initialize mimetypes
        mimetypes.init()
        
        # Root endpoint - serve HTML
        if path == '/' or path == '':
            # Try to read the HTML file
            html_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'index.html')
            try:
                with open(html_path, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))
            except FileNotFoundError as e:
                # Fallback to API response if HTML not found
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {
                    "message": "Hello from Uctobot API",
                    "status": "running",
                    "endpoints": ["/api/health", "/api/webhook"],
                    "note": "Frontend not deployed",
                    "error": str(e),
                    "path_tried": html_path
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
        elif path.startswith('/_next/') or path.endswith(('.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ico')):
            # Remove leading slash for path construction
            clean_path = path.lstrip('/')
            
            # Try multiple possible locations
            possible_paths = [
                os.path.join(os.path.dirname(__file__), '..', 'static', clean_path),
                os.path.join(os.path.dirname(__file__), '..', 'static', path),
                os.path.join('/tmp', clean_path),  # Vercel might put files in /tmp
            ]
            
            file_found = False
            for file_path in possible_paths:
                if os.path.exists(file_path):
                    file_found = True
                    break
            
            if file_found:
                # Determine content type
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type:
                    # Fallback for specific types
                    ext = os.path.splitext(path)[1]
                    content_types = {
                        '.js': 'application/javascript',
                        '.css': 'text/css',
                        '.woff': 'font/woff',
                        '.woff2': 'font/woff2'
                    }
                    mime_type = content_types.get(ext, 'application/octet-stream')
                
                try:
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-type', mime_type)
                    self.send_header('Cache-Control', 'public, max-age=31536000')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(content)
                except Exception as e:
                    self.send_response(500)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(f'Error reading file: {str(e)}'.encode())
            else:
                # Return 404 with debug info
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                debug_info = {
                    "error": "File not found",
                    "requested_path": path,
                    "paths_checked": possible_paths,
                    "cwd": os.getcwd(),
                    "dirname": os.path.dirname(__file__)
                }
                self.wfile.write(json.dumps(debug_info).encode())
            
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