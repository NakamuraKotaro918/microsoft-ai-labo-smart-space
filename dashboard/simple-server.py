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
from datetime import datetime, timedelta
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
        elif parsed_path.path == '/api/room/monitor':
            self.send_api_response(self.get_room_monitor_data())
        elif parsed_path.path == '/api/person/analysis':
            self.send_api_response(self.get_person_analysis_data())
        elif parsed_path.path == '/api/system/status':
            self.send_api_response(self.get_system_status_data())
        elif parsed_path.path == '/api/environment/analysis':
            self.send_api_response(self.get_environment_analysis_data())
        elif parsed_path.path == '/api/person/integrated':
            self.send_api_response(self.get_integrated_person_data())
        elif parsed_path.path == '/api/behavior/patterns':
            self.send_api_response(self.get_behavior_pattern_data())
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
    
    def get_room_monitor_data(self):
        """個人開発部屋モニターデータの生成"""
        hour = datetime.now().hour
        is_working_hours = 9 <= hour <= 18
        
        # 環境データ生成
        base_temp = 23 if is_working_hours else 21
        temperature = round(base_temp + random.uniform(-2, 2), 1)
        
        humidity = random.randint(40, 70)
        
        base_co2 = 600 if is_working_hours else 400
        co2 = max(350, base_co2 + random.randint(-200, 200))
        
        # 空気質判定
        if co2 < 500:
            air_quality = 'excellent'
        elif co2 < 800:
            air_quality = 'good'
        elif co2 < 1000:
            air_quality = 'fair'
        else:
            air_quality = 'poor'
        
        # 在室状況
        occupancy = 'occupied' if is_working_hours and random.random() > 0.2 else 'vacant'
        
        # 利用統計
        usage_hours = round(6.5 + random.uniform(-2, 2), 1)
        weekly_usage_rate = random.randint(70, 90)
        
        # 生産性指数計算
        productivity_score = 100
        productivity_score -= abs(temperature - 22) * 5
        productivity_score -= abs(humidity - 50) * 0.5
        if co2 > 1000:
            productivity_score -= 20
        elif co2 > 800:
            productivity_score -= 10
        productivity_index = max(60, min(100, round(productivity_score)))
        
        energy_efficiency = random.randint(85, 95)
        
        # 最適化提案生成
        suggestions = []
        
        if temperature > 25:
            suggestions.append({
                'icon': '❄️',
                'title': '冷房調整',
                'message': '室温が高めです。設定温度を1°C下げることを推奨します。'
            })
        elif temperature < 21:
            suggestions.append({
                'icon': '🔥',
                'title': '暖房調整',
                'message': '室温が低めです。設定温度を1°C上げることを推奨します。'
            })
        else:
            suggestions.append({
                'icon': '🌡️',
                'title': '温度最適',
                'message': '現在の温度は適正範囲内です。現在の設定を維持してください。'
            })
        
        if co2 > 1000:
            suggestions.append({
                'icon': '💨',
                'title': '緊急換気',
                'message': 'CO2濃度が高いです。即座に換気を行ってください。'
            })
        elif co2 > 800:
            suggestions.append({
                'icon': '🌬️',
                'title': '換気推奨',
                'message': 'CO2濃度が上昇傾向です。15分後に換気を行うことを推奨します。'
            })
        
        suggestions.append({
            'icon': '💡',
            'title': '照明最適化',
            'message': '部屋の利用パターンから、自動調光設定の調整を推奨します。'
        })
        
        # 週間利用パターン（モック）
        weekly_pattern = [
            8.5 + random.uniform(-1, 1),  # 月
            7.2 + random.uniform(-1, 1),  # 火
            9.1 + random.uniform(-1, 1),  # 水
            6.8 + random.uniform(-1, 1),  # 木
            8.0 + random.uniform(-1, 1),  # 金
            3.2 + random.uniform(-1, 1),  # 土
            1.5 + random.uniform(-0.5, 1)  # 日
        ]
        
        return {
            'environment': {
                'temperature': temperature,
                'humidity': humidity,
                'co2': co2,
                'airQuality': air_quality,
                'occupancy': occupancy
            },
            'usage': {
                'todayHours': usage_hours,
                'weeklyUsageRate': weekly_usage_rate,
                'productivityIndex': productivity_index,
                'energyEfficiency': energy_efficiency,
                'weeklyPattern': [round(h, 1) for h in weekly_pattern]
            },
            'optimization': {
                'suggestions': suggestions
            },
            'room': {
                'id': 'A-101',
                'name': '開発ルーム A-101',
                'type': '個人開発専用スペース',
                'capacity': 1,
                'area': '12㎡'
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def get_behavior_pattern_data(self):
        """行動パターン分析データの生成"""
        
        # 行動パターンの定義
        behavior_definitions = {
            'high': [
                '展示物を詳しく観察している',
                'スマートフォンで写真を撮影',
                'メモを取りながら見学',
                '特定の展示に長時間滞在',
                '案内板を詳しく読んでいる',
                '他の来場者と展示について議論',
                '展示物に近づいて詳細を確認'
            ],
            'medium': [
                'パンフレットを読んでいる',
                'ゆっくりと歩き回っている',
                '案内板を確認している',
                '興味深そうに展示を見回している',
                '他の来場者と会話中',
                '展示物を一通り見学',
                '音声ガイドを聞いている'
            ],
            'low': [
                '素早く通り過ぎている',
                '軽く展示を眺めている',
                '休憩しながら見学',
                '出口に向かって移動中',
                '待ち合わせ場所を探している',
                '時間を確認している',
                '他のエリアを探している'
            ]
        }
        
        # 人物データ生成
        total_persons = random.randint(5, 12)
        behavior_patterns = {'high': [], 'medium': [], 'low': []}
        
        for i in range(total_persons):
            # 関心度レベルを決定（高:30%, 中:50%, 低:20%）
            rand = random.random()
            if rand < 0.3:
                level = 'high'
                interest_level = random.randint(75, 100)
            elif rand < 0.8:
                level = 'medium'
                interest_level = random.randint(45, 74)
            else:
                level = 'low'
                interest_level = random.randint(20, 44)
            
            behavior = random.choice(behavior_definitions[level])
            
            person_data = {
                'personId': f'P{random.randint(1000, 9999)}',
                'behavior': behavior,
                'interestLevel': interest_level,
                'stayDuration': round(random.uniform(3, 20), 1),
                'movementDistance': round(random.uniform(5, 25), 1)
            }
            
            behavior_patterns[level].append(person_data)
        
        # 行動ごとの集計
        behavior_counts = {}
        for level in ['high', 'medium', 'low']:
            behavior_counts[level] = {}
            for person in behavior_patterns[level]:
                behavior = person['behavior']
                if behavior in behavior_counts[level]:
                    behavior_counts[level][behavior] += 1
                else:
                    behavior_counts[level][behavior] = 1
        
        # 統計計算
        high_count = len(behavior_patterns['high'])
        medium_count = len(behavior_patterns['medium'])
        low_count = len(behavior_patterns['low'])
        
        high_percentage = round((high_count / total_persons) * 100) if total_persons > 0 else 0
        medium_percentage = round((medium_count / total_persons) * 100) if total_persons > 0 else 0
        low_percentage = round((low_count / total_persons) * 100) if total_persons > 0 else 0
        
        # その他の指標
        all_persons = []
        for level_persons in behavior_patterns.values():
            all_persons.extend(level_persons)
        
        avg_movement = sum(p['movementDistance'] for p in all_persons) / len(all_persons) if all_persons else 0
        avg_stay_duration = sum(p['stayDuration'] for p in all_persons) / len(all_persons) if all_persons else 0
        group_behavior_rate = random.randint(35, 65)  # モック値
        repeat_visit_rate = random.randint(15, 45)    # モック値
        
        return {
            'patterns': {
                'high': {
                    'count': high_count,
                    'percentage': high_percentage,
                    'behaviors': behavior_counts['high'],
                    'persons': behavior_patterns['high']
                },
                'medium': {
                    'count': medium_count,
                    'percentage': medium_percentage,
                    'behaviors': behavior_counts['medium'],
                    'persons': behavior_patterns['medium']
                },
                'low': {
                    'count': low_count,
                    'percentage': low_percentage,
                    'behaviors': behavior_counts['low'],
                    'persons': behavior_patterns['low']
                }
            },
            'metrics': {
                'totalPersons': total_persons,
                'averageMovementDistance': round(avg_movement, 1),
                'averageStayDuration': round(avg_stay_duration, 1),
                'groupBehaviorRate': group_behavior_rate,
                'repeatVisitRate': repeat_visit_rate
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def get_integrated_person_data(self):
        """統合人物分析データの生成"""
        person_count = random.randint(1, 4)
        persons = []
        
        behaviors = [
            '展示物を詳しく観察している',
            'スマートフォンで写真を撮影',
            '他の来場者と会話中',
            'パンフレットを読んでいる',
            'ゆっくりと歩き回っている',
            '特定の展示に長時間滞在',
            'メモを取りながら見学',
            '案内板を確認している',
            '興味深そうに展示を見回している'
        ]
        
        emotions = ['興味深い', '楽しそう', '集中している', '驚いている', '満足している', '好奇心旺盛', '感動している']
        traits = ['好奇心旺盛', '慎重', '社交的', '分析的', '積極的', '観察力が高い', '学習意欲が高い']
        
        for i in range(person_count):
            person_id = f"P{random.randint(1000, 9999)}"
            age = random.randint(20, 80)
            gender = random.choice(['male', 'female'])
            
            # ITRIOS データ
            itrios_data = {
                "id": person_id,
                "age": age,
                "ageRange": self.get_age_range(age),
                "gender": gender,
                "confidence": {
                    "overall": round(random.uniform(0.7, 1.0), 3),
                    "age": round(random.uniform(0.8, 1.0), 3),
                    "gender": round(random.uniform(0.8, 1.0), 3)
                },
                "position": {
                    "x": random.randint(100, 500),
                    "y": random.randint(100, 400)
                },
                "detectionTime": (datetime.now() - timedelta(minutes=random.randint(1, 10))).isoformat()
            }
            
            # Gemini 分析データ
            gemini_data = {
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
                    "isGroupBehavior": random.choice([True, False]),
                    "groupSize": random.randint(1, 4) if random.choice([True, False]) else 1
                },
                "confidence": random.randint(80, 100),
                "processingTime": round(random.uniform(1.0, 4.0), 1),
                "analysisTime": (datetime.now() - timedelta(minutes=random.randint(0, 8))).isoformat()
            }
            
            # 統合データ
            overall_confidence = (itrios_data["confidence"]["overall"] + gemini_data["confidence"] / 100) / 2
            
            integrated_data = {
                "id": person_id,
                "detectionTime": itrios_data["detectionTime"],
                "analysisTime": gemini_data["analysisTime"],
                "overallConfidence": round(overall_confidence, 3),
                "status": {
                    "isActive": gemini_data["behavior"]["isActive"],
                    "isInterested": gemini_data["characteristics"]["showsInterest"],
                    "isGroupBehavior": gemini_data["interactions"]["isGroupBehavior"],
                    "isHighConfidence": itrios_data["confidence"]["overall"] > 0.9 and gemini_data["confidence"] > 90
                },
                "summary": {
                    "age": age,
                    "ageRange": itrios_data["ageRange"],
                    "gender": gender,
                    "interestLevel": gemini_data["characteristics"]["interestLevel"],
                    "stayDuration": gemini_data["behavior"]["stayDuration"],
                    "movementDistance": gemini_data["behavior"]["movementDistance"],
                    "primaryEmotion": gemini_data["emotions"]["primary"],
                    "primaryTrait": gemini_data["characteristics"]["primaryTrait"],
                    "currentAction": gemini_data["behavior"]["action"]
                }
            }
            
            persons.append({
                "itrios": itrios_data,
                "gemini": gemini_data,
                "integrated": integrated_data
            })
        
        # 統計情報
        total_persons = len(persons)
        active_persons = sum(1 for p in persons if p["integrated"]["status"]["isActive"])
        interested_persons = sum(1 for p in persons if p["integrated"]["status"]["isInterested"])
        avg_confidence = sum(p["integrated"]["overallConfidence"] for p in persons) / total_persons if total_persons > 0 else 0
        avg_processing_time = sum(p["gemini"]["processingTime"] for p in persons) / total_persons if total_persons > 0 else 0
        
        return {
            "persons": persons,
            "statistics": {
                "totalPersons": total_persons,
                "activePersons": active_persons,
                "interestedPersons": interested_persons,
                "averageConfidence": round(avg_confidence, 3),
                "averageProcessingTime": round(avg_processing_time, 1),
                "linkAccuracy": 0.98
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def get_environment_analysis_data(self):
        """環境データ分析データの生成"""
        import time
        
        # 現在時刻に基づく環境データ生成
        hour = datetime.now().hour
        minute = datetime.now().minute
        
        # 温度（時間帯による変動）
        base_temp = 22 + 3 * (0.5 - abs(hour - 14) / 14)
        temperature = round(base_temp + random.uniform(-2, 2), 1)
        
        # 湿度（季節・時間による変動）
        base_humidity = 50 + 10 * (0.5 - abs(hour - 12) / 12)
        humidity = max(30, min(80, int(base_humidity + random.randint(-8, 8))))
        
        # CO2濃度（人の活動による変動）
        base_co2 = 400
        if 9 <= hour <= 18:  # 勤務時間
            base_co2 += 200 + random.randint(-50, 150)
        else:
            base_co2 += random.randint(-30, 50)
        co2 = max(350, base_co2)
        
        # 空気質指数
        aqi = random.randint(25, 75)
        
        # アラート生成条件
        alerts = []
        if temperature > 26:
            alerts.append({
                "level": "critical",
                "title": "温度上昇警告",
                "message": f"室温が{temperature}°Cまで上昇しています。冷房の調整を推奨します。",
                "timestamp": datetime.now().isoformat()
            })
        elif temperature < 18:
            alerts.append({
                "level": "warning",
                "title": "温度低下警告",
                "message": f"室温が{temperature}°Cまで低下しています。暖房の調整を推奨します。",
                "timestamp": datetime.now().isoformat()
            })
        
        if humidity > 65:
            alerts.append({
                "level": "warning",
                "title": "湿度上昇警告",
                "message": f"湿度が{humidity}%まで上昇しています。除湿を推奨します。",
                "timestamp": datetime.now().isoformat()
            })
        elif humidity < 35:
            alerts.append({
                "level": "warning",
                "title": "湿度低下警告",
                "message": f"湿度が{humidity}%まで低下しています。加湿器の使用を推奨します。",
                "timestamp": datetime.now().isoformat()
            })
        
        if co2 > 1000:
            alerts.append({
                "level": "critical",
                "title": "CO2濃度警告",
                "message": f"CO2濃度が{co2}ppmに達しています。即座に換気を実施してください。",
                "timestamp": datetime.now().isoformat()
            })
        
        if aqi > 100:
            alerts.append({
                "level": "critical",
                "title": "空気質悪化警告",
                "message": f"空気質指数が{aqi}に達しています。空気清浄機の使用を推奨します。",
                "timestamp": datetime.now().isoformat()
            })
        
        # 環境品質スコア計算
        temp_score = max(0, min(100, 100 - abs(temperature - 22) * 10))
        humidity_score = max(0, min(100, 100 - abs(humidity - 50) * 2))
        co2_score = max(0, min(100, (1200 - co2) / 8))
        aqi_score = max(0, min(100, (150 - aqi) * 2))
        overall_score = (temp_score + humidity_score + co2_score + aqi_score) / 4
        
        # 予測データ生成
        temp_prediction = [
            temperature,
            temperature + random.uniform(-0.5, 1.0),
            temperature + random.uniform(-0.5, 1.5),
            temperature + random.uniform(-1.0, 2.0)
        ]
        
        humidity_prediction = [
            humidity,
            humidity + random.randint(-3, 3),
            humidity + random.randint(-5, 5),
            humidity + random.randint(-8, 8)
        ]
        
        co2_prediction = [
            co2,
            co2 + random.randint(-20, 30),
            co2 + random.randint(-30, 50),
            co2 + random.randint(-50, 80)
        ]
        
        return {
            "current": {
                "temperature": temperature,
                "humidity": humidity,
                "co2": co2,
                "aqi": aqi,
                "timestamp": datetime.now().isoformat()
            },
            "scores": {
                "temperature": round(temp_score, 1),
                "humidity": round(humidity_score, 1),
                "co2": round(co2_score, 1),
                "aqi": round(aqi_score, 1),
                "overall": round(overall_score, 1)
            },
            "trends": {
                "temperature": self.calculate_trend(temperature, 22),
                "humidity": self.calculate_trend(humidity, 50),
                "co2": self.calculate_trend(co2, 600),
                "aqi": self.calculate_trend(aqi, 50)
            },
            "predictions": {
                "temperature": temp_prediction,
                "humidity": humidity_prediction,
                "co2": co2_prediction,
                "timeLabels": ["現在", "30分後", "1時間後", "2時間後"]
            },
            "alerts": alerts,
            "recommendations": self.generate_recommendations(temperature, humidity, co2, aqi),
            "timestamp": datetime.now().isoformat()
        }
    
    def calculate_trend(self, current_value, baseline):
        """トレンド計算"""
        diff = current_value - baseline
        if abs(diff) < baseline * 0.05:  # 5%以内は安定
            return {"direction": "stable", "text": "安定"}
        elif diff > 0:
            return {"direction": "up", "text": "上昇傾向"}
        else:
            return {"direction": "down", "text": "下降傾向"}
    
    def generate_recommendations(self, temperature, humidity, co2, aqi):
        """推奨アクション生成"""
        recommendations = []
        
        if temperature > 25:
            recommendations.append({
                "type": "temperature",
                "action": "空調設定を1°C下げることを推奨",
                "priority": "high" if temperature > 27 else "medium"
            })
        elif temperature < 20:
            recommendations.append({
                "type": "temperature",
                "action": "暖房設定を1°C上げることを推奨",
                "priority": "high" if temperature < 18 else "medium"
            })
        
        if humidity > 60:
            recommendations.append({
                "type": "humidity",
                "action": "除湿器の使用または換気を推奨",
                "priority": "medium"
            })
        elif humidity < 40:
            recommendations.append({
                "type": "humidity",
                "action": "加湿器の使用を推奨",
                "priority": "medium"
            })
        
        if co2 > 800:
            recommendations.append({
                "type": "ventilation",
                "action": "30分後に換気を実施" if co2 < 1000 else "即座に換気を実施",
                "priority": "high" if co2 > 1000 else "medium"
            })
        
        if aqi > 75:
            recommendations.append({
                "type": "air_quality",
                "action": "空気清浄機の使用を推奨",
                "priority": "high" if aqi > 100 else "medium"
            })
        
        if not recommendations:
            recommendations.append({
                "type": "general",
                "action": "現在の環境設定を維持",
                "priority": "low"
            })
        
        return recommendations
    
    def get_system_status_data(self):
        """システム稼働状況データの生成"""
        import time
        
        # 基準時刻からの経過時間を計算
        base_time = time.time()
        itrios_uptime_hours = 24 + (base_time % 86400) / 3600  # 24時間 + 現在時刻
        smartphone_uptime_hours = 18 + (base_time % 86400) / 3600  # 18時間 + 現在時刻
        
        return {
            "itrios": {
                "status": "online",
                "uptime": f"{int(itrios_uptime_hours)}h {int((itrios_uptime_hours % 1) * 60)}m",
                "frames": 1247892 + random.randint(0, 1000),
                "successRate": round(random.uniform(96.0, 99.5), 1),
                "cpu": random.randint(35, 65),
                "memory": round(random.uniform(1.8, 2.5), 1),
                "temperature": random.randint(38, 48)
            },
            "smartphone": {
                "status": "online",
                "uptime": f"{int(smartphone_uptime_hours)}h {int((smartphone_uptime_hours % 1) * 60)}m",
                "analyses": 3847 + random.randint(0, 100),
                "apiRate": round(random.uniform(94.0, 98.5), 1),
                "battery": random.randint(70, 85),
                "storage": round(random.uniform(44.0, 46.0), 1),
                "network": random.choice(["5G 良好", "5G 普通", "4G 良好"])
            },
            "integration": {
                "processingTime": round(random.uniform(1.8, 3.2), 1),
                "syncRate": round(random.uniform(98.0, 99.9), 1),
                "errorRate": round(random.uniform(0.1, 0.8), 1),
                "steps": {
                    "step1": "active",
                    "step2": "active", 
                    "step3": "active",
                    "step4": "active"
                }
            },
            "timestamp": datetime.now().isoformat()
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
