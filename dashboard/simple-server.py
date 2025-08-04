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
        elif parsed_path.path == '/api/person/analysis':
            self.send_api_response(self.get_person_analysis_data())
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
    
    def get_person_analysis_data(self):
        """人物分析データの生成"""
        person_count = random.randint(1, 3)
        itrios_persons = []
        gemini_persons = []
        
        behaviors = [
            '展示物を詳しく観察している',
            'スマートフォンで写真を撮影',
            '他の来場者と会話中',
            'パンフレットを読んでいる',
            'ゆっくりと歩き回っている',
            '特定の展示に長時間滞在',
            'メモを取りながら見学'
        ]
        
        emotions = ['興味深い', '楽しそう', '集中している', '驚いている', '満足している']
        traits = ['好奇心旺盛', '慎重', '社交的', '分析的', '積極的']
        
        for i in range(person_count):
            person_id = f"P{random.randint(1000, 9999)}"
            age = random.randint(20, 80)
            gender = random.choice(['male', 'female'])
            
            # SONY ITRIOS データ
            itrios_persons.append({
                "id": person_id,
                "age": age,
                "ageRange": self.get_age_range(age),
                "gender": gender,
                "confidence": {
                    "overall": round(random.uniform(0.7, 1.0), 2),
                    "age": round(random.uniform(0.8, 1.0), 2),
                    "gender": round(random.uniform(0.8, 1.0), 2)
                },
                "position": {
                    "x": random.randint(100, 500),
                    "y": random.randint(100, 400)
                }
            })
            
            # Google Gemini データ
            gemini_persons.append({
                "personId": person_id,
                "behavior": {
                    "action": random.choice(behaviors),
                    "movementDistance": round(random.uniform(5, 25), 1),
                    "stayDuration": round(random.uniform(5, 20), 1),
                    "isActive": random.choice([True, False])
                },
                "characteristics": {
                    "interestLevel": random.randint(60, 100),
                    "primaryTrait": random.choice(traits),
                    "showsInterest": random.choice([True, False])
                },
                "emotions": {
                    "primary": random.choice(emotions),
                    "isPositive": random.choice([True, False])
                },
                "interactions": {
                    "isGroupBehavior": random.choice([True, False])
                },
                "confidence": random.randint(80, 100),
                "processingTime": round(random.uniform(1.0, 4.0), 1)
            })
        
        return {
            "itrios": {
                "detectedPersons": itrios_persons,
                "accuracy": random.randint(90, 100),
                "timestamp": datetime.now().isoformat()
            },
            "gemini": {
                "analyzedPersons": gemini_persons,
                "averageProcessingTime": round(random.uniform(1.5, 3.5), 1),
                "averageConfidence": random.randint(85, 100),
                "timestamp": datetime.now().isoformat()
            }
        }
    
    def get_age_range(self, age):
        """年齢範囲の取得"""
        if age < 20:
            return '10代'
        elif age < 30:
            return '20代'
        elif age < 40:
            return '30代'
        elif age < 50:
            return '40代'
        elif age < 60:
            return '50代'
        elif age < 70:
            return '60代'
        else:
            return '70代以上'
    
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
