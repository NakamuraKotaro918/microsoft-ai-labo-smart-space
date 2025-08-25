import atexit
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import azure.cosmos.cosmos_client as cosmos_client
import threading
import logging

# MQTTクライアントのインポート
from mqtt_client import KaitekiMQTTClient

# Blob StorageとAI Searchのインポート
from blob_storage import BlobStorageManager
from ai_search import AISearchManager

# IoT Hub管理のインポート
from iot_hub_manager import IoTHubManager

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

# Blob StorageとAI Searchの初期化
blob_storage = BlobStorageManager()
ai_search = AISearchManager()

# IoT Hub管理の初期化
iot_hub_manager = IoTHubManager()

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


# Blob Storage API エンドポイント
@app.route('/api/blob/upload-sensor', methods=['POST'])
def upload_sensor_data_to_blob():
  """センサーデータをBlob Storageにアップロード"""
  try:
    data = request.get_json()
    device_id = data.get('deviceId', 'unknown')
    sensor_data = data.get('data', {})

    success = blob_storage.upload_sensor_data(sensor_data, device_id)

    if success:
      return jsonify({"status": "success", "message": "センサーデータをアップロードしました"}), 200
    else:
      return jsonify({"status": "error", "message": "アップロードに失敗しました"}), 500

  except Exception as e:
    logger.error(f"Blob Storageアップロードエラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/blob/upload-analysis', methods=['POST'])
def upload_analysis_data_to_blob():
  """分析データをBlob Storageにアップロード"""
  try:
    data = request.get_json()
    analysis_type = data.get('analysisType', 'general')
    analysis_data = data.get('data', {})

    success = blob_storage.upload_analysis_data(analysis_data, analysis_type)

    if success:
      return jsonify({"status": "success", "message": "分析データをアップロードしました"}), 200
    else:
      return jsonify({"status": "error", "message": "アップロードに失敗しました"}), 500

  except Exception as e:
    logger.error(f"Blob Storageアップロードエラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/blob/sensor-data/<device_id>', methods=['GET'])
def get_sensor_data_from_blob(device_id):
  """Blob Storageからセンサーデータを取得"""
  try:
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')

    data = blob_storage.get_sensor_data(device_id, start_time, end_time)

    return jsonify({
        "status": "success",
        "data": data,
        "count": len(data)
    }), 200

  except Exception as e:
    logger.error(f"Blob Storage取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/blob/analysis-data/<analysis_type>', methods=['GET'])
def get_analysis_data_from_blob(analysis_type):
  """Blob Storageから分析データを取得"""
  try:
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')

    data = blob_storage.get_analysis_data(analysis_type, start_time, end_time)

    return jsonify({
        "status": "success",
        "data": data,
        "count": len(data)
    }), 200

  except Exception as e:
    logger.error(f"Blob Storage取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


# AI Search API エンドポイント
@app.route('/api/search/upload', methods=['POST'])
def upload_document_to_search():
  """ドキュメントをAI Searchにアップロード"""
  try:
    data = request.get_json()

    success = ai_search.upload_document(data)

    if success:
      return jsonify({"status": "success", "message": "ドキュメントをアップロードしました"}), 200
    else:
      return jsonify({"status": "error", "message": "アップロードに失敗しました"}), 500

  except Exception as e:
    logger.error(f"AI Searchアップロードエラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/query', methods=['GET'])
def search_documents():
  """AI Searchでドキュメントを検索"""
  try:
    search_text = request.args.get('q', '')
    filters = request.args.get('filters')
    order_by = request.args.get('order_by')
    top = int(request.args.get('top', 50))

    if order_by:
      order_by = order_by.split(',')

    results = ai_search.search_documents(search_text, filters, order_by, top)

    return jsonify({
        "status": "success",
        "results": results,
        "count": len(results)
    }), 200

  except Exception as e:
    logger.error(f"AI Search検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/device/<device_id>', methods=['GET'])
def search_by_device(device_id):
  """デバイスIDで検索"""
  try:
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')

    results = ai_search.search_by_device(device_id, start_time, end_time)

    return jsonify({
        "status": "success",
        "results": results,
        "count": len(results)
    }), 200

  except Exception as e:
    logger.error(f"AI Searchデバイス検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/device-type/<device_type>', methods=['GET'])
def search_by_device_type(device_type):
  """デバイスタイプで検索"""
  try:
    results = ai_search.search_by_device_type(device_type)

    return jsonify({
        "status": "success",
        "results": results,
        "count": len(results)
    }), 200

  except Exception as e:
    logger.error(f"AI Searchデバイスタイプ検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/temperature-range', methods=['GET'])
def search_by_temperature_range():
  """温度範囲で検索"""
  try:
    min_temp = float(request.args.get('min_temp', 0))
    max_temp = float(request.args.get('max_temp', 50))

    results = ai_search.search_by_temperature_range(min_temp, max_temp)

    return jsonify({
        "status": "success",
        "results": results,
        "count": len(results)
    }), 200

  except Exception as e:
    logger.error(f"AI Search温度範囲検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/person-count-range', methods=['GET'])
def search_by_person_count_range():
  """人数範囲で検索"""
  try:
    min_count = int(request.args.get('min_count', 0))
    max_count = int(request.args.get('max_count', 100))

    results = ai_search.search_by_person_count(min_count, max_count)

    return jsonify({
        "status": "success",
        "results": results,
        "count": len(results)
    }), 200

  except Exception as e:
    logger.error(f"AI Search人数範囲検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/facets/<field_name>', methods=['GET'])
def get_facets(field_name):
  """ファセット検索"""
  try:
    count = int(request.args.get('count', 10))

    facets = ai_search.get_facets(field_name, count)

    return jsonify({
        "status": "success",
        "facets": facets
    }), 200

  except Exception as e:
    logger.error(f"AI Searchファセット検索エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/statistics', methods=['GET'])
def get_search_statistics():
  """検索統計情報を取得"""
  try:
    stats = ai_search.get_statistics()

    return jsonify({
        "status": "success",
        "statistics": stats
    }), 200

  except Exception as e:
    logger.error(f"AI Search統計情報取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/search/create-index', methods=['POST'])
def create_search_index():
  """AI Searchインデックスを作成"""
  try:
    success = ai_search.create_index_if_not_exists()

    if success:
      return jsonify({"status": "success", "message": "インデックスを作成しました"}), 200
    else:
      return jsonify({"status": "error", "message": "インデックス作成に失敗しました"}), 500

  except Exception as e:
    logger.error(f"AI Searchインデックス作成エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


# IoT Hub管理 API エンドポイント
@app.route('/api/iot/devices', methods=['GET'])
def get_iot_devices():
  """IoT Hubデバイスリストを取得"""
  try:
    max_count = int(request.args.get('max_count', 100))
    devices = iot_hub_manager.get_device_list(max_count)

    return jsonify({
        "status": "success",
        "devices": devices,
        "count": len(devices)
    }), 200

  except Exception as e:
    logger.error(f"IoT Hubデバイスリスト取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices', methods=['POST'])
def create_iot_device():
  """IoT Hubデバイスを作成"""
  try:
    data = request.get_json()
    device_id = data.get('deviceId')
    device_type = data.get('deviceType', 'sensor')

    if not device_id:
      return jsonify({"status": "error", "message": "deviceIdは必須です"}), 400

    success = iot_hub_manager.create_device(device_id, device_type)

    if success:
      return jsonify({"status": "success", "message": "デバイスを作成しました"}), 200
    else:
      return jsonify({"status": "error", "message": "デバイス作成に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイス作成エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>', methods=['DELETE'])
def delete_iot_device(device_id):
  """IoT Hubデバイスを削除"""
  try:
    success = iot_hub_manager.delete_device(device_id)

    if success:
      return jsonify({"status": "success", "message": "デバイスを削除しました"}), 200
    else:
      return jsonify({"status": "error", "message": "デバイス削除に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイス削除エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/twin', methods=['GET'])
def get_device_twin(device_id):
  """デバイスツインを取得"""
  try:
    twin = iot_hub_manager.get_device_twin(device_id)

    if twin:
      return jsonify({
          "status": "success",
          "twin": twin
      }), 200
    else:
      return jsonify({"status": "error", "message": "デバイスツインの取得に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイスツイン取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/twin', methods=['PUT'])
def update_device_twin(device_id):
  """デバイスツインを更新"""
  try:
    data = request.get_json()
    properties = data.get('properties', {})

    success = iot_hub_manager.update_device_twin(device_id, properties)

    if success:
      return jsonify({"status": "success", "message": "デバイスツインを更新しました"}), 200
    else:
      return jsonify({"status": "error", "message": "デバイスツイン更新に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイスツイン更新エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/message', methods=['POST'])
def send_device_message(device_id):
  """デバイスにメッセージを送信"""
  try:
    data = request.get_json()
    message = data.get('message', {})

    success = iot_hub_manager.send_cloud_to_device_message(device_id, message)

    if success:
      return jsonify({"status": "success", "message": "メッセージを送信しました"}), 200
    else:
      return jsonify({"status": "error", "message": "メッセージ送信に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubメッセージ送信エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/enable', methods=['POST'])
def enable_device(device_id):
  """デバイスを有効化"""
  try:
    success = iot_hub_manager.enable_device(device_id)

    if success:
      return jsonify({"status": "success", "message": "デバイスを有効化しました"}), 200
    else:
      return jsonify({"status": "error", "message": "デバイス有効化に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイス有効化エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/disable', methods=['POST'])
def disable_device(device_id):
  """デバイスを無効化"""
  try:
    success = iot_hub_manager.disable_device(device_id)

    if success:
      return jsonify({"status": "success", "message": "デバイスを無効化しました"}), 200
    else:
      return jsonify({"status": "error", "message": "デバイス無効化に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubデバイス無効化エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/devices/<device_id>/telemetry', methods=['PUT'])
def configure_device_telemetry(device_id):
  """デバイスのテレメトリ設定を更新"""
  try:
    data = request.get_json()
    interval = data.get('interval', 30)

    success = iot_hub_manager.configure_device_telemetry(device_id, interval)

    if success:
      return jsonify({"status": "success", "message": "テレメトリ設定を更新しました"}), 200
    else:
      return jsonify({"status": "error", "message": "テレメトリ設定更新に失敗しました"}), 500

  except Exception as e:
    logger.error(f"IoT Hubテレメトリ設定エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/iot/statistics', methods=['GET'])
def get_iot_statistics():
  """IoT Hub統計情報を取得"""
  try:
    stats = iot_hub_manager.get_device_statistics()

    return jsonify({
        "status": "success",
        "statistics": stats
    }), 200

  except Exception as e:
    logger.error(f"IoT Hub統計情報取得エラー: {e}")
    return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=5000)
