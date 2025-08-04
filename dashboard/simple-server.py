#!/usr/bin/env python3
"""
Microsoft AI Labo スマート空間最適化ダッシュボード
シンプルローカルサーバー

使用方法:
1. python3 simple-server.py
2. ブラウザで http://localhost:8000 にアクセス
"""

import http.server
import socketserver
import json
import random
import os
from datetime import datetime
from urllib.parse import urlparse

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API エンドポイント
        if parsed_path.path == '/api/entrance/current':
            self.send_api_response(self.get_entrance_data())
        elif parsed_path.path == '/api/room/environment':
            self.send_api_response(self.get_room_data())
        else:
            # 静的ファイルの配信
            super().do_GET()
    
    def send_api_response(self, data):
        """API レスポンスの送信"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def get_entrance_data(self):
        """エントランスデータの生成"""
        current_hour = datetime.now().hour
        base_visitors = self.get_base_visitors_by_hour(current_hour)
        
        return {
            "currentVisitors": max(0, base_visitors + random.randint(-2, 4)),
            "dailyVisitors": random.randint(150, 250),
            "avgStayTime": random.randint(8, 15),
            "ageDistribution": [
                35 + random.randint(-5, 5),
                40 + random.randint(-5, 5),
                20 + random.randint(-5, 5),
                5 + random.randint(-2, 2)
            ],
            "genderDistribution": [
                55 + random.randint(-10, 10),
                40 + random.randint(-10, 10),
                5 + random.randint(-2, 2)
            ],
            "hourlyData": [max(0, self.get_base_visitors_by_hour(i) + random.randint(-2, 3)) for i in range(24)],
            "behaviorMetrics": {
                "interestLevel": random.randint(70, 90),
                "avgMovement": round(random.uniform(10, 15), 1),
                "groupBehavior": random.randint(35, 65)
            }
        }
    
    def get_room_data(self):
        """個人開発部屋データの生成"""
        hour = datetime.now().hour
        temp_variation = 2 * (0.5 - abs(hour - 14) / 14)
        
        return {
            "temperature": round(22.5 + temp_variation + random.uniform(-1, 1), 1),
            "humidity": max(30, min(80, 55 + random.randint(-10, 10))),
            "co2": max(350, 450 + random.randint(-50, 150)),
            "isOccupied": random.random() < (0.8 if 9 <= hour <= 18 else 0.3),
            "temperatureHistory": [round(22.5 + 2 * (0.5 - abs(i - 14) / 14) + random.uniform(-1, 1), 1) for i in range(24)],
            "humidityHistory": [max(30, min(80, 55 + random.randint(-10, 10))) for _ in range(24)],
            "co2History": [max(350, 450 + (100 if 9 <= i <= 18 else 0) + random.randint(-50, 50)) for i in range(24)],
            "weeklyUsage": [max(0, min(100, usage + random.randint(-10, 10))) for usage in [85, 92, 78, 88, 95, 45, 30]]
        }
    
    def get_base_visitors_by_hour(self, hour):
        """時間帯別基準来場者数"""
        pattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0]
        return pattern[hour] if 0 <= hour < 24 else 0

def main():
    PORT = 8000
    
    print("Microsoft AI Labo スマート空間最適化ダッシュボード")
    print("=" * 50)
    print(f"サーバーを起動中... ポート: {PORT}")
    print(f"ブラウザで http://localhost:{PORT} にアクセスしてください")
    print("終了するには Ctrl+C を押してください")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")

if __name__ == "__main__":
    main()
