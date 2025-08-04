#!/usr/bin/env python3
"""
Microsoft AI Labo スマート空間最適化ダッシュボード
デモ用サーバー

このスクリプトは開発・デモ用のHTTPサーバーとWebSocketサーバーを提供します。
実際のセンサーデータの代わりにモックデータを生成・配信します。
"""

import asyncio
import json
import random
import time
from datetime import datetime, timedelta
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import websockets
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MockDataGenerator:
    """モックデータ生成クラス"""
    
    def __init__(self):
        self.base_temperature = 22.5
        self.base_humidity = 55
        self.base_co2 = 450
        self.daily_visitors = random.randint(150, 250)
        
    def get_entrance_data(self):
        """エントランスデータの生成"""
        current_hour = datetime.now().hour
        base_visitors = self._get_base_visitors_by_hour(current_hour)
        
        return {
            "currentVisitors": max(0, base_visitors + random.randint(-2, 4)),
            "dailyVisitors": self.daily_visitors + random.randint(0, 10),
            "avgStayTime": random.randint(8, 15),
            "ageDistribution": self._generate_age_distribution(),
            "genderDistribution": self._generate_gender_distribution(),
            "hourlyData": self._generate_hourly_data(),
            "behaviorMetrics": {
                "interestLevel": random.randint(70, 90),
                "avgMovement": round(random.uniform(10, 15), 1),
                "groupBehavior": random.randint(35, 65)
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def get_room_data(self):
        """個人開発部屋データの生成"""
        # 時間帯による変動を考慮
        hour = datetime.now().hour
        temp_variation = 2 * (0.5 - abs(hour - 14) / 14)  # 14時頃が最高
        
        temperature = round(self.base_temperature + temp_variation + random.uniform(-1, 1), 1)
        humidity = max(30, min(80, self.base_humidity + random.randint(-10, 10)))
        co2 = max(350, self.base_co2 + random.randint(-50, 150))
        
        # 平日の9-18時は使用中の確率が高い
        is_weekday = datetime.now().weekday() < 5
        is_work_hours = 9 <= hour <= 18
        occupancy_probability = 0.8 if (is_weekday and is_work_hours) else 0.3
        is_occupied = random.random() < occupancy_probability
        
        return {
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "isOccupied": is_occupied,
            "temperatureHistory": self._generate_temperature_history(),
            "humidityHistory": self._generate_humidity_history(),
            "co2History": self._generate_co2_history(),
            "weeklyUsage": self._generate_weekly_usage(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_base_visitors_by_hour(self, hour):
        """時間帯別基準来場者数"""
        hourly_pattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0]
        return hourly_pattern[hour] if 0 <= hour < 24 else 0
    
    def _generate_age_distribution(self):
        """年齢分布の生成"""
        base = [35, 40, 20, 5]
        return [max(0, value + random.randint(-5, 5)) for value in base]
    
    def _generate_gender_distribution(self):
        """性別分布の生成"""
        male_ratio = random.uniform(0.4, 0.7)
        total = 100
        male = round(total * male_ratio)
        female = round(total * (1 - male_ratio) * 0.9)
        unknown = max(0, total - male - female)
        return [male, female, unknown]
    
    def _generate_hourly_data(self):
        """時間別データの生成"""
        data = []
        current_hour = datetime.now().hour
        for i in range(24):
            hour = (current_hour - 23 + i) % 24
            base_value = self._get_base_visitors_by_hour(hour)
            data.append(max(0, base_value + random.randint(-2, 3)))
        return data
    
    def _generate_temperature_history(self):
        """温度履歴の生成"""
        data = []
        for i in range(24):
            hour_factor = 2 * (0.5 - abs(i - 14) / 14)
            temp = self.base_temperature + hour_factor + random.uniform(-1, 1)
            data.append(round(temp, 1))
        return data
    
    def _generate_humidity_history(self):
        """湿度履歴の生成"""
        data = []
        for i in range(24):
            humidity = self.base_humidity + random.randint(-10, 10)
            data.append(max(30, min(80, humidity)))
        return data
    
    def _generate_co2_history(self):
        """CO2履歴の生成"""
        data = []
        for i in range(24):
            # 使用時間帯でCO2上昇
            usage_factor = 100 if 9 <= i <= 18 else 0
            co2 = self.base_co2 + usage_factor + random.randint(-50, 50)
            data.append(max(350, co2))
        return data
    
    def _generate_weekly_usage(self):
        """週間利用率の生成"""
        base_usage = [85, 92, 78, 88, 95, 45, 30]  # 月-日
        return [max(0, min(100, usage + random.randint(-10, 10))) for usage in base_usage]

class DashboardHTTPHandler(SimpleHTTPRequestHandler):
    """カスタムHTTPハンドラー"""
    
    def __init__(self, *args, **kwargs):
        self.data_generator = MockDataGenerator()
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """GETリクエストの処理"""
        if self.path == '/api/entrance/current':
            self._send_json_response(self.data_generator.get_entrance_data())
        elif self.path == '/api/room/environment':
            self._send_json_response(self.data_generator.get_room_data())
        elif self.path == '/api/health':
            self._send_json_response({"status": "ok", "timestamp": datetime.now().isoformat()})
        else:
            # 静的ファイルの配信
            super().do_GET()
    
    def _send_json_response(self, data):
        """JSON レスポンスの送信"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

class WebSocketServer:
    """WebSocketサーバー"""
    
    def __init__(self, host='localhost', port=8081):
        self.host = host
        self.port = port
        self.clients = set()
        self.data_generator = MockDataGenerator()
        self.running = False
    
    async def register_client(self, websocket, path):
        """クライアントの登録"""
        self.clients.add(websocket)
        logger.info(f"Client connected: {websocket.remote_address}")
        
        try:
            # 初期データの送信
            await self.send_initial_data(websocket)
            
            # クライアントからのメッセージを待機
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        finally:
            self.clients.discard(websocket)
    
    async def send_initial_data(self, websocket):
        """初期データの送信"""
        entrance_data = self.data_generator.get_entrance_data()
        room_data = self.data_generator.get_room_data()
        
        initial_message = {
            "type": "initial_data",
            "entrance": entrance_data,
            "room": room_data
        }
        
        await websocket.send(json.dumps(initial_message, ensure_ascii=False))
    
    async def handle_message(self, websocket, message):
        """クライアントメッセージの処理"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                # 購読リクエストの処理
                topics = data.get('topics', [])
                response = {
                    "type": "subscription_confirmed",
                    "topics": topics,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(response, ensure_ascii=False))
                
            elif message_type == 'ping':
                # Pingリクエストの処理
                pong_response = {
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(pong_response, ensure_ascii=False))
                
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received from {websocket.remote_address}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def broadcast_data(self):
        """全クライアントにデータをブロードキャスト"""
        while self.running:
            if self.clients:
                entrance_data = self.data_generator.get_entrance_data()
                room_data = self.data_generator.get_room_data()
                
                message = {
                    "type": "data_update",
                    "entrance": entrance_data,
                    "room": room_data
                }
                
                # 切断されたクライアントを除去
                disconnected_clients = set()
                for client in self.clients.copy():
                    try:
                        await client.send(json.dumps(message, ensure_ascii=False))
                    except websockets.exceptions.ConnectionClosed:
                        disconnected_clients.add(client)
                
                self.clients -= disconnected_clients
                
                if disconnected_clients:
                    logger.info(f"Removed {len(disconnected_clients)} disconnected clients")
            
            await asyncio.sleep(30)  # 30秒間隔で更新
    
    async def start(self):
        """WebSocketサーバーの開始"""
        self.running = True
        
        # データブロードキャストタスクを開始
        broadcast_task = asyncio.create_task(self.broadcast_data())
        
        # WebSocketサーバーを開始
        server = await websockets.serve(self.register_client, self.host, self.port)
        logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
        
        try:
            await server.wait_closed()
        finally:
            self.running = False
            broadcast_task.cancel()

def start_http_server(port=8000):
    """HTTPサーバーの開始"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DashboardHTTPHandler)
    logger.info(f"HTTP server started on http://localhost:{port}")
    httpd.serve_forever()

def main():
    """メイン関数"""
    print("Microsoft AI Labo スマート空間最適化ダッシュボード - デモサーバー")
    print("=" * 60)
    
    # HTTPサーバーを別スレッドで開始
    http_thread = threading.Thread(target=start_http_server, args=(8000,))
    http_thread.daemon = True
    http_thread.start()
    
    # WebSocketサーバーを開始
    websocket_server = WebSocketServer('localhost', 8081)
    
    try:
        asyncio.run(websocket_server.start())
    except KeyboardInterrupt:
        print("\nサーバーを停止しています...")
        logger.info("Server stopped by user")

if __name__ == "__main__":
    main()
