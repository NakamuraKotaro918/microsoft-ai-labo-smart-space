#!/usr/bin/env python3
"""
Microsoft AI Labo スマート空間最適化ダッシュボード
Azure App Service 用 Flask アプリケーション
"""

from flask import Flask, send_from_directory, jsonify
import json
import random
import os
from datetime import datetime, timedelta

app = Flask(__name__)

# 静的ファイルの配信


@app.route('/')
def index():
  return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
  return send_from_directory('.', path)

# API エンドポイント


@app.route('/api/entrance/current')
def get_entrance_data():
  """エントランスデータの生成"""
  current_hour = datetime.now().hour
  base_visitors = get_base_visitors_by_hour(current_hour)

  return jsonify({
      "currentVisitors": max(0, base_visitors + random.randint(-2, 4)),
      "dailyVisitors": random.randint(150, 250),
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
      "hourlyData": [max(0, get_base_visitors_by_hour(i) + random.randint(-2, 3)) for i in range(24)],
      "behaviorMetrics": {
          "interestLevel": random.randint(70, 90),
          "avgMovement": round(random.uniform(10, 15), 1),
          "groupBehavior": random.randint(35, 65)
      }
  })


@app.route('/api/room/environment')
def get_room_data():
  """個人開発部屋データの生成"""
  hour = datetime.now().hour
  temp_variation = 2 * (0.5 - abs(hour - 14) / 14)

  return jsonify({
      "temperature": round(22.5 + temp_variation + random.uniform(-1, 1), 1),
      "humidity": max(30, min(80, 55 + random.randint(-10, 10))),
      "co2": max(350, 450 + random.randint(-50, 150)),
      "isOccupied": random.random() < (0.8 if 9 <= hour <= 18 else 0.3),
      "temperatureHistory": [round(22.5 + 2 * (0.5 - abs(i - 14) / 14) + random.uniform(-1, 1), 1) for i in range(24)],
      "humidityHistory": [max(30, min(80, 55 + random.randint(-10, 10))) for _ in range(24)],
      "co2History": [max(350, 450 + (100 if 9 <= i <= 18 else 0) + random.randint(-50, 50)) for i in range(24)],
      "weeklyUsage": [max(0, min(100, usage + random.randint(-10, 10))) for usage in [85, 92, 78, 88, 95, 45, 30]]
  })


@app.route('/api/room/monitor')
def get_room_monitor_data():
  """部屋モニタリングデータの生成"""
  hour = datetime.now().hour

  return jsonify({
      "currentStatus": {
          "isOccupied": random.random() < (0.8 if 9 <= hour <= 18 else 0.3),
          "lastActivity": (datetime.now() - timedelta(minutes=random.randint(1, 30))).isoformat(),
          "occupancyDuration": random.randint(30, 480)  # 30分〜8時間
      },
      "environmentalData": {
          "temperature": round(22.5 + random.uniform(-2, 2), 1),
          "humidity": max(30, min(80, 55 + random.randint(-10, 10))),
          "co2": max(350, 450 + random.randint(-50, 150)),
          "lightLevel": random.randint(200, 800),
          "noiseLevel": random.randint(30, 70)
      },
      "usageStatistics": {
          "dailyUsage": random.randint(6, 12),  # 時間
          "weeklyUsage": random.randint(40, 60),  # 時間
          "monthlyUsage": random.randint(160, 240),  # 時間
          "peakHours": ["9:00-11:00", "14:00-16:00"],
          "averageSessionDuration": random.randint(60, 180)  # 分
      }
  })


@app.route('/api/person/analysis')
def get_person_analysis_data():
  """人物分析データの生成"""
  person_count = random.randint(1, 5)
  persons = []

  for i in range(person_count):
    person_data = {
        "id": f"P{random.randint(1000, 9999)}",
        "age": random.randint(20, 80),
        "gender": random.choice(["male", "female"]),
        "detectionTime": (datetime.now() - timedelta(minutes=random.randint(1, 10))).isoformat(),
        "confidence": round(random.uniform(0.8, 1.0), 3),
        "position": {
            "x": random.randint(100, 500),
            "y": random.randint(100, 400)
        }
    }
    persons.append(person_data)

  return jsonify({
      "persons": persons,
      "totalCount": person_count,
      "analysisTimestamp": datetime.now().isoformat()
  })


@app.route('/api/system/status')
def get_system_status_data():
  """システム稼働状況データの生成"""
  import time

  base_time = time.time()
  itrios_uptime_hours = 24 + (base_time % 86400) / 3600
  smartphone_uptime_hours = 18 + (base_time % 86400) / 3600

  return jsonify({
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
  })


@app.route('/api/environment/analysis')
def get_environment_analysis_data():
  """環境分析データの生成"""
  hour = datetime.now().hour

  # 環境データの生成
  temperature = round(22.5 + random.uniform(-2, 2), 1)
  humidity = max(30, min(80, 55 + random.randint(-10, 10)))
  co2 = max(350, 450 + random.randint(-50, 150))

  # 快適度指数の計算
  comfort_score = 100
  if temperature < 18 or temperature > 28:
    comfort_score -= 20
  if humidity < 30 or humidity > 70:
    comfort_score -= 15
  if co2 > 600:
    comfort_score -= 25

  comfort_score = max(0, comfort_score)

  # 最適化提案
  recommendations = []
  if temperature < 20:
    recommendations.append("温度を上げることを推奨")
  elif temperature > 26:
    recommendations.append("温度を下げることを推奨")

  if humidity < 40:
    recommendations.append("加湿器の使用を推奨")
  elif humidity > 60:
    recommendations.append("除湿器の使用を推奨")

  if co2 > 600:
    recommendations.append("換気を推奨")

  return jsonify({
      "environmentalMetrics": {
          "temperature": temperature,
          "humidity": humidity,
          "co2": co2,
          "comfortScore": comfort_score
      },
      "trends": {
          "temperatureTrend": "stable",
          "humidityTrend": "stable",
          "co2Trend": "stable"
      },
      "recommendations": recommendations,
      "analysisTimestamp": datetime.now().isoformat()
  })


@app.route('/api/person/integrated')
def get_integrated_person_data():
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

    # 人物認識カメラ データ
    itrios_data = {
        "id": person_id,
        "age": age,
        "ageRange": get_age_range(age),
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

    # AI分析システム 分析データ
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
        "age": age,
        "gender": gender,
        "ageRange": get_age_range(age),
        "behavior": gemini_data["behavior"]["action"],
        "interestLevel": gemini_data["characteristics"]["interestLevel"],
        "emotion": gemini_data["emotions"]["primary"],
        "confidence": round(overall_confidence, 3),
        "detectionTime": itrios_data["detectionTime"],
        "analysisTime": gemini_data["analysisTime"]
    }

    persons.append(integrated_data)

  return jsonify({
      "persons": persons,
      "totalCount": person_count,
      "analysisTimestamp": datetime.now().isoformat()
  })


@app.route('/api/behavior/patterns')
def get_behavior_pattern_data():
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

  return jsonify({
      'patterns': {
          'high': {
              'count': high_count,
              'percentage': high_percentage,
              'behaviors': behavior_patterns['high']
          },
          'medium': {
              'count': medium_count,
              'percentage': medium_percentage,
              'behaviors': behavior_patterns['medium']
          },
          'low': {
              'count': low_count,
              'percentage': low_percentage,
              'behaviors': behavior_patterns['low']
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
  })


def get_age_range(age):
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


def get_base_visitors_by_hour(hour):
  """時間帯別基準来場者数"""
  pattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0]
  return pattern[hour] if 0 <= hour < 24 else 0


if __name__ == '__main__':
  app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
