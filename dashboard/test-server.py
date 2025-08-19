#!/usr/bin/env python3
"""
テスト用シンプルサーバー
"""

import http.server
import socketserver
import json
import random
import os
from datetime import datetime

PORT = 8002

class TestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def do_GET(self):
        if self.path == '/api/system/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            data = {
                "itrios": {
                    "status": "online",
                    "uptime": "24h 15m",
                    "frames": 1247892,
                    "successRate": 98.7,
                    "cpu": 45,
                    "memory": 2.1,
                    "temperature": 42
                },
                "smartphone": {
                    "status": "online",
                    "uptime": "18h 42m",
                    "analyses": 3847,
                    "apiRate": 96.2,
                    "battery": 78,
                    "storage": 45.2,
                    "network": "5G 良好"
                },
                "integration": {
                    "processingTime": 2.3,
                    "syncRate": 99.1,
                    "errorRate": 0.3,
                    "steps": {
                        "step1": "active",
                        "step2": "active",
                        "step3": "active",
                        "step4": "active"
                    }
                },
                "timestamp": datetime.now().isoformat()
            }
            
            response = json.dumps(data, ensure_ascii=False)
            self.wfile.write(response.encode('utf-8'))
        else:
            super().do_GET()

if __name__ == "__main__":
    print(f"テストサーバーを起動中... ポート: {PORT}")
    print(f"ブラウザで http://localhost:{PORT} にアクセスしてください")
    
    with socketserver.TCPServer(("", PORT), TestHandler) as httpd:
        httpd.serve_forever()
