"""
Basic Vercel serverless function test
"""
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            'message': 'Vercel Python function is working!',
            'path': self.path,
            'method': 'GET'
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
        return