#!/usr/bin/env python3
"""
Custom development server for the portfolio site that properly serves 404.html
for non-existent URLs while maintaining all the functionality of a static 
server.
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse


class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Custom handler that serves 404.html for non-existent files."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        super().end_headers()
    
    def do_GET(self):
        """Handle GET requests with custom 404 page."""
        url_path = urlparse(self.path).path
        
        # Remove leading slash and decode
        if url_path.startswith('/'):
            url_path = url_path[1:]
        
        # If no path, serve index.html
        if not url_path or url_path == '/':
            url_path = 'index.html'
        
        # Check if file exists
        if os.path.exists(url_path) and os.path.isfile(url_path):
            # File exists, serve it normally
            super().do_GET()
        else:
            # File doesn't exist, serve custom 404 page
            self.send_404()
    
    def send_404(self):
        """Send custom 404 page."""
        try:
            with open('404.html', 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            content_length = str(len(content.encode('utf-8')))
            self.send_header('Content-Length', content_length)
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            # Fallback to default 404 if custom page doesn't exist
            self.send_error(404, "File not found")
    
    def log_message(self, format, *args):
        """Custom logging with colors."""
        status_code = args[1] if len(args) > 1 else '000'
        if status_code.startswith('2'):
            color = '\033[92m'  # Green
        elif status_code.startswith('3'):
            color = '\033[93m'  # Yellow
        elif status_code.startswith('4'):
            color = '\033[91m'  # Red
        else:
            color = '\033[94m'  # Blue
        
        reset = '\033[0m'
        address = self.address_string()
        timestamp = self.log_date_time_string()
        log_line = f"{address} - - [{timestamp}] {format % args}"
        print(f"{color}{log_line}{reset}")


def main():
    """Start the development server."""
    port = 8000
    
    # Check if port is already in use
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Usage: python dev-server.py [port]")
            sys.exit(1)
    
    server_address = ('', port)
    
    try:
        httpd = HTTPServer(server_address, CustomHTTPRequestHandler)
        print(f"\n🚀 Development server starting at http://localhost:{port}")
        print(f"📁 Serving files from: {os.getcwd()}")
        
        # Check if 404.html exists
        has_404 = ('✅ Available' if os.path.exists('404.html') 
                   else '❌ Not found')
        print(f"🔧 Custom 404 page: {has_404}")
        
        # Check if index.html exists
        has_index = ('✅ Available' if os.path.exists('index.html') 
                     else '❌ Not found')
        print(f"📄 Main page: {has_index}")
        
        test_url = f"http://localhost:{port}/nonexistent-page"
        print(f"\n💡 Test your 404 page by visiting: {test_url}")
        print("⏹️  Press Ctrl+C to stop the server\n")
        
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        httpd.shutdown()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use. Try a different port:")
            print(f"   python dev-server.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main() 