import atexit
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
import azure.cosmos.cosmos_client as cosmos_client
import azure.cosmos.exceptions as exceptions
from azure.cosmos.partition_key import PartitionKey
import threading
import logging

# MQTTクライアントのインポート
from mqtt_client import KaitekiMQTTClient

app = Flask(__name__)
CORS(app)

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cosmos DB接続設定
COSMOS_ENDPOINT = os.environ.get('COSMOS_ENDPOINT')
COSMOS_KEY = os.environ.get('COSMOS_KEY')
COSMOS_DATABASE = 'smart-space-db'
COSMOS_CONTAINER_SENSOR = 'sensor-data'
COSMOS_CONTAINER_ANALYSIS = 'analysis-data'

# Cosmos DBクライアントの初期化
cosmos_client_instance = cosmos_client.CosmosClient(COSMOS_ENDPOINT, COSMOS_KEY)
database = cosmos_client_instance.get_database_client(COSMOS_DATABASE)
sensor_container = database.get_container_client(COSMOS_CONTAINER_SENSOR)
analysis_container = database.get_container_client(COSMOS_CONTAINER_ANALYSIS)

# MQTTクライアントの初期化
mqtt_client = None
mqtt_thread = None


def start_mqtt_client():
  """MQTTクライアントを別スレッドで開始"""
  global mqtt_client
  try:
    mqtt_client = KaitekiMQTTClient()
    mqtt_client.start()
    logger.info("MQTTクライアント開始完了")
  except Exception as e:
    logger.error(f"MQTTクライアント開始エラー: {e}")


def stop_mqtt_client():
  """MQTTクライアントを停止"""
  global mqtt_client
  if mqtt_client:
    try:
      mqtt_client.stop()
      logger.info("MQTTクライアント停止完了")
    except Exception as e:
      logger.error(f"MQTTクライアント停止エラー: {e}")

# アプリケーション起動時にMQTTクライアントを開始


@app.before_first_request
def initialize_mqtt():
  """アプリケーション初期化時にMQTTクライアントを開始"""
  global mqtt_thread
  if os.environ.get('ENABLE_MQTT', 'true').lower() == 'true':
    mqtt_thread = threading.Thread(target=start_mqtt_client, daemon=True)
    mqtt_thread.start()
    logger.info("MQTTクライアントスレッド開始")


# アプリケーション終了時のクリーンアップ
atexit.register(stop_mqtt_client)


@app.route('/api/health', methods=['GET'])
def health_check():
  """ヘルスチェック"""
  return jsonify({
      "status": "healthy",
      "timestamp": datetime.utcnow().isoformat(),
      "service": "Smart Space Dashboard API"
  })


@app.route('/api/entrance/current', methods=['GET'])
def get_entrance_data():
  """エントランスデータの取得（AITRIOS + Gemini）"""
  try:
  # 最新のAITRIOSデータを取得
    aitrios_query = "SELECT * FROM c WHERE c.deviceType = 'aitrios' ORDER BY c.timestamp DESC OFFSET 0 LIMIT 1"
    aitrios_items = list(sensor_container.query_items(query=aitrios_query, enable_cross_partition_query=True))

    # 最新のGeminiデータを取得
    gemini_query = "SELECT * FROM c WHERE c.deviceType = 'gemini' ORDER BY c.timestamp DESC OFFSET 0 LIMIT 1"
    gemini_items = list(sensor_container.query_items(query=gemini_query, enable_cross_partition_query=True))

    # 過去24時間のデータを取得（時間別集計用）
    yesterday = datetime.utcnow() - timedelta(hours=24)
    hourly_query = f"""
        SELECT 
            c.data.deviceType,
            c.data.personCount,
            c.data.temperature,
            c.data.humidity,
            c.data.co2,
            c.timestamp
        FROM c 
        WHERE c.timestamp >= '{yesterday.isoformat()}'
        ORDER BY c.timestamp
        """
    hourly_items = list(sensor_container.query_items(query=hourly_query, enable_cross_partition_query=True))

    # データの統合
    aitrios_data = aitrios_items[0] if aitrios_items else {}
    gemini_data = gemini_items[0] if gemini_items else {}

    # レスポンスデータの構築
    response_data = {
        "currentVisitors": aitrios_data.get('data', {}).get('personCount', 0),
        "dailyVisitors": sum(item.get('data', {}).get('personCount', 0) for item in hourly_items if item.get('data', {}).get('deviceType') == 'aitrios'),
        "ageDistribution": aitrios_data.get('data', {}).get('ageDistribution', [35, 40, 20, 5]),
        "genderDistribution": aitrios_data.get('data', {}).get('genderDistribution', [55, 40, 5]),
        "hourlyData": [item.get('data', {}).get('personCount', 0) for item in hourly_items if item.get('data', {}).get('deviceType') == 'aitrios'],
        "behaviorMetrics": {
            "interestLevel": gemini_data.get('data', {}).get('behaviorAnalysis', {}).get('interestLevel', 75),
            "avgMovement": gemini_data.get('data', {}).get('behaviorAnalysis', {}).get('avgMovement', 12.5),
            "groupBehavior": gemini_data.get('data', {}).get('behaviorAnalysis', {}).get('groupBehavior', 45)
        },
        "lastUpdate": aitrios_data.get('timestamp', datetime.utcnow().isoformat())
    }

    return jsonify(response_data)

  except Exception as e:
    return jsonify({
        "error": str(e),
        "currentVisitors": 0,
        "dailyVisitors": 0,
        "ageDistribution": [35, 40, 20, 5],
        "genderDistribution": [55, 40, 5],
        "hourlyData": [0] * 24,
        "behaviorMetrics": {
            "interestLevel": 75,
            "avgMovement": 12.5,
            "groupBehavior": 45
        }
    }), 500


@app.route('/api/room/environment', methods=['GET'])
def get_room_environment():
  """部屋環境データの取得（快適君）"""
  try:
    # 最新の快適君データを取得
    kaiteki_query = "SELECT * FROM c WHERE c.deviceType = 'kaiteki' ORDER BY c.timestamp DESC OFFSET 0 LIMIT 1"
    kaiteki_items = list(sensor_container.query_items(query=kaiteki_query, enable_cross_partition_query=True))

    # 過去24時間のデータを取得
    yesterday = datetime.utcnow() - timedelta(hours=24)
    history_query = f"""
        SELECT 
            c.data.temperature,
            c.data.humidity,
            c.data.co2,
            c.data.occupancy,
            c.data.illuminance,
            c.data.pressure,
            c.data.human,
            c.timestamp
        FROM c 
        WHERE c.deviceType = 'kaiteki' AND c.timestamp >= '{yesterday.isoformat()}'
        ORDER BY c.timestamp
        """
    history_items = list(sensor_container.query_items(query=history_query, enable_cross_partition_query=True))

    # 最新データ
    current_data = kaiteki_items[0] if kaiteki_items else {}

    # 週間使用率の計算（簡易版）
    weekly_usage = [85, 92, 78, 88, 95, 45, 30]  # モックデータ

    response_data = {
        "temperature": current_data.get('data', {}).get('temperature', 22.5),
        "humidity": current_data.get('data', {}).get('humidity', 55),
        "co2": current_data.get('data', {}).get('co2', 450),
        "pressure": current_data.get('data', {}).get('pressure', 1013),
        "illuminance": current_data.get('data', {}).get('illuminance', 300),
        "isOccupied": current_data.get('data', {}).get('occupancy', True),
        "human": current_data.get('data', {}).get('human', False),
        "deviceInfo": {
            "deviceNo": current_data.get('data', {}).get('deviceNo'),
            "deviceName": current_data.get('data', {}).get('deviceName'),
            "version": current_data.get('data', {}).get('version'),
            "mac": current_data.get('data', {}).get('mac')
        },
        "networkInfo": {
            "rssi": current_data.get('data', {}).get('rssi', 0),
            "ssid": current_data.get('data', {}).get('ssid'),
            "voltage": current_data.get('data', {}).get('voltage', 0),
            "power": current_data.get('data', {}).get('power', 0)
        },
        "temperatureHistory": [item.get('data', {}).get('temperature', 22.5) for item in history_items],
        "humidityHistory": [item.get('data', {}).get('humidity', 55) for item in history_items],
        "co2History": [item.get('data', {}).get('co2', 450) for item in history_items],
        "pressureHistory": [item.get('data', {}).get('pressure', 1013) for item in history_items],
        "illuminanceHistory": [item.get('data', {}).get('illuminance', 300) for item in history_items],
        "weeklyUsage": weekly_usage,
        "lastUpdate": current_data.get('timestamp', datetime.utcnow().isoformat())
    }

    return jsonify(response_data)

  except Exception as e:
    return jsonify({
        "error": str(e),
        "temperature": 22.5,
        "humidity": 55,
        "co2": 450,
        "isOccupied": True,
        "temperatureHistory": [22.5] * 24,
        "humidityHistory": [55] * 24,
        "co2History": [450] * 24,
        "weeklyUsage": [85, 92, 78, 88, 95, 45, 30]
    }), 500


@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
  """分析サマリーデータの取得"""
  try:
    # 最新の分析データを取得
    analysis_query = "SELECT * FROM c WHERE c.collectionName = 'analysis-data' ORDER BY c.windowEnd DESC OFFSET 0 LIMIT 10"
    analysis_items = list(analysis_container.query_items(query=analysis_query, enable_cross_partition_query=True))

    # 異常検知データの取得
    anomaly_query = "SELECT * FROM c WHERE c.anomalyStatus != 'Normal' ORDER BY c.windowEnd DESC OFFSET 0 LIMIT 5"
    anomaly_items = list(analysis_container.query_items(query=anomaly_query, enable_cross_partition_query=True))

    response_data = {
        "recentAnalysis": analysis_items,
        "recentAnomalies": anomaly_items,
        "summary": {
            "totalDevices": 3,  # AITRIOS, Gemini, 快適君
            "activeDevices": len(set(item.get('deviceType') for item in analysis_items)),
            "anomalyCount": len(anomaly_items),
            "lastUpdate": datetime.utcnow().isoformat()
        }
    }

    return jsonify(response_data)

  except Exception as e:
    return jsonify({
        "error": str(e),
        "recentAnalysis": [],
        "recentAnomalies": [],
        "summary": {
            "totalDevices": 3,
            "activeDevices": 0,
            "anomalyCount": 0,
            "lastUpdate": datetime.utcnow().isoformat()
        }
    }), 500


if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=5000)
