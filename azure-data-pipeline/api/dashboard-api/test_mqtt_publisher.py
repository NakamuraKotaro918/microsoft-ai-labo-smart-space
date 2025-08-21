#!/usr/bin/env python3
"""
快適君 MQTT テストパブリッシャー
快適君のデータ形式に合わせたテストデータをMQTTで送信する
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import os
from datetime import datetime


class KaitekiTestPublisher:
  """快適君テストパブリッシャークラス"""

  def __init__(self):
    # MQTT設定
    self.mqtt_broker = os.environ.get('MQTT_BROKER', 'localhost')
    self.mqtt_port = int(os.environ.get('MQTT_PORT', 1883))
    self.mqtt_username = os.environ.get('MQTT_USERNAME')
    self.mqtt_password = os.environ.get('MQTT_PASSWORD')
    self.mqtt_topic = os.environ.get('MQTT_TOPIC', 'kaiteki/sensor/data')

    # MQTTクライアント初期化
    self.client = mqtt.Client()
    self.client.on_connect = self.on_connect
    self.client.on_disconnect = self.on_disconnect

    # 認証設定
    if self.mqtt_username and self.mqtt_password:
      self.client.username_pw_set(self.mqtt_username, self.mqtt_password)

    # テストデータの初期値
    self.device_no = "KAITEKI001"
    self.data_no = 1

  def on_connect(self, client, userdata, flags, rc):
    """MQTT接続時のコールバック"""
    if rc == 0:
      print("MQTT接続成功")
    else:
      print(f"MQTT接続失敗: {rc}")

  def on_disconnect(self, client, userdata, rc):
    """MQTT切断時のコールバック"""
    if rc != 0:
      print(f"予期しない切断: {rc}")
    else:
      print("MQTT切断")

  def generate_test_data(self):
    """快適君のテストデータを生成"""
    # 現在時刻
    measure_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 環境データ（現実的な範囲でランダム生成）
    temperature = round(random.uniform(20.0, 26.0), 1)  # 20-26°C
    humidity = round(random.uniform(40.0, 70.0), 1)     # 40-70%
    pressure = round(random.uniform(1000, 1020), 1)     # 1000-1020 hPa
    co2 = random.randint(400, 800)                      # 400-800 ppm
    illuminance = random.randint(100, 500)              # 100-500 lux

    # 人間検知（ランダム、ただし営業時間中は高確率）
    current_hour = datetime.now().hour
    if 9 <= current_hour <= 18:  # 営業時間中
      human = random.choice([True, True, True, False])  # 75%の確率
    else:
      human = random.choice([True, False, False, False])  # 25%の確率

    # ネットワーク情報
    rssi = random.randint(-70, -30)  # -70 to -30 dBm
    voltage = round(random.uniform(3.8, 4.2), 2)  # 3.8-4.2V
    power = round(random.uniform(0.5, 2.0), 2)    # 0.5-2.0W

    # 快適君のデータ形式
    test_data = {
        "DeviceNo": self.device_no,
        "Illuminance": illuminance,
        "Temperature": temperature,
        "Humidity": humidity,
        "Pressure": pressure,
        "CO2": co2,
        "Human": human,
        "DataNo": self.data_no,
        "Ver": "1.0.0",
        "Rssi": rssi,
        "MeasureTime": measure_time,
        "Voltage": voltage,
        "Power": power,
        "SSID": "KAITEKI_WIFI",
        "PASS": "********",
        "Interval": 30,
        "MAC": "AA:BB:CC:DD:EE:FF",
        "DeciceName": "快適君-001"
    }

    self.data_no += 1
    return test_data

  def connect(self):
    """MQTT接続開始"""
    try:
      print(f"MQTT接続開始: {self.mqtt_broker}:{self.mqtt_port}")
      self.client.connect(self.mqtt_broker, self.mqtt_port, 60)
      self.client.loop_start()
    except Exception as e:
      print(f"MQTT接続エラー: {e}")

  def disconnect(self):
    """MQTT接続終了"""
    try:
      self.client.loop_stop()
      self.client.disconnect()
      print("MQTT接続終了")
    except Exception as e:
      print(f"MQTT切断エラー: {e}")

  def publish_test_data(self):
    """テストデータを送信"""
    try:
      test_data = self.generate_test_data()
      message = json.dumps(test_data, ensure_ascii=False)

      result = self.client.publish(self.mqtt_topic, message)
      if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"データ送信成功: {test_data['DataNo']}")
        print(f"  温度: {test_data['Temperature']}°C")
        print(f"  湿度: {test_data['Humidity']}%")
        print(f"  CO2: {test_data['CO2']} ppm")
        print(f"  照度: {test_data['Illuminance']} lux")
        print(f"  人間検知: {test_data['Human']}")
      else:
        print(f"データ送信失敗: {result.rc}")

    except Exception as e:
      print(f"データ送信エラー: {e}")

  def start_publishing(self, interval=30):
    """定期的にテストデータを送信"""
    print(f"テストデータ送信開始 (間隔: {interval}秒)")
    print(f"トピック: {self.mqtt_topic}")
    print("Ctrl+C で停止")

    try:
      while True:
        self.publish_test_data()
        time.sleep(interval)
    except KeyboardInterrupt:
      print("\n送信停止")
      self.disconnect()


# 使用例
if __name__ == "__main__":
  import signal
  import sys

  # シグナルハンドラー
  def signal_handler(sig, frame):
    print("\n終了シグナル受信")
    publisher.disconnect()
    sys.exit(0)

  signal.signal(signal.SIGINT, signal_handler)
  signal.signal(signal.SIGTERM, signal_handler)

  # パブリッシャー開始
  publisher = KaitekiTestPublisher()
  publisher.connect()

  # 送信間隔（秒）
  interval = int(os.environ.get('PUBLISH_INTERVAL', 30))

  # テストデータ送信開始
  publisher.start_publishing(interval)
