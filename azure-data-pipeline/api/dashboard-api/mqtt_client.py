#!/usr/bin/env python3
"""
快適君 MQTT クライアント
快適君からのセンサーデータを受信し、Cosmos DBに保存する
"""

import paho.mqtt.client as mqtt
import json
import os
import logging
from datetime import datetime
import azure.cosmos.cosmos_client as cosmos_client
from azure.cosmos.exceptions import CosmosHttpResponseError

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class KaitekiMQTTClient:
  """快適君 MQTT クライアントクラス"""

  def __init__(self):
    # MQTT設定
    self.mqtt_broker = os.environ.get('MQTT_BROKER', 'localhost')
    self.mqtt_port = int(os.environ.get('MQTT_PORT', 1883))
    self.mqtt_username = os.environ.get('MQTT_USERNAME')
    self.mqtt_password = os.environ.get('MQTT_PASSWORD')
    self.mqtt_topic = os.environ.get('MQTT_TOPIC', 'kaiteki/sensor/data')

    # Cosmos DB設定
    self.cosmos_endpoint = os.environ.get('COSMOS_ENDPOINT')
    self.cosmos_key = os.environ.get('COSMOS_KEY')
    self.cosmos_database = 'smart-space-db'
    self.cosmos_container = 'sensor-data'

    # MQTTクライアント初期化
    self.client = mqtt.Client()
    self.client.on_connect = self.on_connect
    self.client.on_message = self.on_message
    self.client.on_disconnect = self.on_disconnect

    # 認証設定
    if self.mqtt_username and self.mqtt_password:
      self.client.username_pw_set(self.mqtt_username, self.mqtt_password)

    # Cosmos DBクライアント初期化
    self.cosmos_client = cosmos_client.CosmosClient(self.cosmos_endpoint, self.cosmos_key)
    self.database = self.cosmos_client.get_database_client(self.cosmos_database)
    self.container = self.database.get_container_client(self.cosmos_container)

    logger.info("快適君 MQTT クライアント初期化完了")
    logger.info(f"MQTT Broker: {self.mqtt_broker}:{self.mqtt_port}")
    logger.info(f"MQTT Topic: {self.mqtt_topic}")

  def on_connect(self, client, userdata, flags, rc):
    """MQTT接続時のコールバック"""
    if rc == 0:
      logger.info("MQTT接続成功")
      # トピックの購読
      client.subscribe(self.mqtt_topic)
      logger.info(f"トピック購読: {self.mqtt_topic}")
    else:
      logger.error(f"MQTT接続失敗: {rc}")

  def on_message(self, client, userdata, msg):
    """MQTTメッセージ受信時のコールバック"""
    try:
      logger.info(f"メッセージ受信: {msg.topic}")

      # JSONデータの解析
      payload = json.loads(msg.payload.decode('utf-8'))
      logger.info(f"受信データ: {payload}")

      # データの正規化
      normalized_data = self.normalize_data(payload)

      # Cosmos DBに保存
      self.save_to_cosmos(normalized_data)

    except json.JSONDecodeError as e:
      logger.error(f"JSON解析エラー: {e}")
    except Exception as e:
      logger.error(f"メッセージ処理エラー: {e}")

  def on_disconnect(self, client, userdata, rc):
    """MQTT切断時のコールバック"""
    if rc != 0:
      logger.warning(f"予期しない切断: {rc}")
    else:
      logger.info("MQTT切断")

  def normalize_data(self, payload):
    """受信データの正規化"""
    timestamp = datetime.utcnow().isoformat()

    # 快適君の実際のデータ形式に対応
    normalized = {
        "id": f"kaiteki_{payload.get('DeviceNo', 'unknown')}_{timestamp}",
        "deviceType": "kaiteki",
        "timestamp": timestamp,
        "data": {
            "deviceNo": payload.get('DeviceNo'),
            "illuminance": payload.get('Illuminance', 0),
            "temperature": payload.get('Temperature', 0),
            "humidity": payload.get('Humidity', 0),
            "pressure": payload.get('Pressure', 0),
            "co2": payload.get('CO2', 0),
            "human": payload.get('Human', False),
            "dataNo": payload.get('DataNo'),
            "version": payload.get('Ver'),
            "rssi": payload.get('Rssi', 0),
            "measureTime": payload.get('MeasureTime'),
            "voltage": payload.get('Voltage', 0),
            "power": payload.get('Power', 0),
            "ssid": payload.get('SSID'),
            "pass": payload.get('PASS'),
            "interval": payload.get('Interval', 0),
            "mac": payload.get('MAC'),
            "deviceName": payload.get('DeciceName'),
            # 利用状況の判定（Humanデータまたは照度データから推定）
            "occupancy": payload.get('Human', False) or payload.get('Illuminance', 0) > 100
        },
        "metadata": {
            "source": "kaiteki_mqtt",
            "version": "1.0",
            "processed_at": timestamp,
            "raw_data": payload  # 元データも保存
        }
    }

    return normalized

  def save_to_cosmos(self, data):
    """Cosmos DBにデータを保存"""
    try:
      # パーティションキーの設定
      data['partitionKey'] = f"kaiteki_{datetime.utcnow().strftime('%Y-%m-%d')}"

      # Cosmos DBに保存
      self.container.create_item(body=data)
      logger.info(f"データ保存成功: {data['id']}")

    except CosmosHttpResponseError as e:
      logger.error(f"Cosmos DB保存エラー: {e}")
    except Exception as e:
      logger.error(f"データ保存エラー: {e}")

  def connect(self):
    """MQTT接続開始"""
    try:
      logger.info("MQTT接続開始...")
      self.client.connect(self.mqtt_broker, self.mqtt_port, 60)
      self.client.loop_start()
    except Exception as e:
      logger.error(f"MQTT接続エラー: {e}")

  def disconnect(self):
    """MQTT接続終了"""
    try:
      self.client.loop_stop()
      self.client.disconnect()
      logger.info("MQTT接続終了")
    except Exception as e:
      logger.error(f"MQTT切断エラー: {e}")

  def start(self):
    """クライアント開始"""
    self.connect()

  def stop(self):
    """クライアント停止"""
    self.disconnect()


# 使用例
if __name__ == "__main__":
  import signal
  import sys

  # シグナルハンドラー
  def signal_handler(sig, frame):
    logger.info("終了シグナル受信")
    mqtt_client.stop()
    sys.exit(0)

  signal.signal(signal.SIGINT, signal_handler)
  signal.signal(signal.SIGTERM, signal_handler)

  # MQTTクライアント開始
  mqtt_client = KaitekiMQTTClient()
  mqtt_client.start()

  try:
    # 無限ループで実行
    while True:
      import time
      time.sleep(1)
  except KeyboardInterrupt:
    logger.info("キーボード割り込み受信")
    mqtt_client.stop()
