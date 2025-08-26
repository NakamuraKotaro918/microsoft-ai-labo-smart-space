#!/usr/bin/env python3
"""
快適君 IoT デバイスシミュレーター
IoT Hubにセンサーデータを送信するダミーデバイス
"""

import asyncio
import json
import random
import time
from datetime import datetime
from azure.iot.device import IoTHubDeviceClient, Message

# IoT Hub接続設定
CONNECTION_STRING = "HostName=iot-masssmartspacetest.azure-devices.net;DeviceId=kaiteki-001;SharedAccessKey=qKw7BlD4+klpmRPuSvQU2QlC3o7h4yM/GLM/U7WT/FI="


class KaitekiSimulator:
  def __init__(self, connection_string):
    self.client = IoTHubDeviceClient.create_from_connection_string(connection_string)
    self.device_id = "kaiteki-001"
    self.device_type = "comfort-sensor"

  async def connect(self):
    """IoT Hubに接続"""
    await self.client.connect()
    print(f"✅ {self.device_id} がIoT Hubに接続されました")

  async def disconnect(self):
    """IoT Hubから切断"""
    await self.client.disconnect()
    print(f"❌ {self.device_id} がIoT Hubから切断されました")

  def generate_sensor_data(self):
    """快適君のセンサーデータを生成"""
    # 現実的な範囲でセンサーデータを生成
    temperature = round(random.uniform(20.0, 28.0), 1)  # 20-28°C
    humidity = round(random.uniform(40.0, 70.0), 1)     # 40-70%
    co2 = round(random.uniform(400.0, 800.0), 1)        # 400-800ppm
    person_count = random.randint(0, 5)                 # 0-5人

    # 快適度スコアを計算 (0-100)
    comfort_score = self.calculate_comfort_score(temperature, humidity, co2, person_count)

    return {
        "deviceId": self.device_id,
        "deviceType": self.device_type,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "temperature": temperature,
        "humidity": humidity,
        "co2": co2,
        "personCount": person_count,
        "comfortScore": comfort_score,
        "location": "会議室A",
        "status": "active"
    }

  def calculate_comfort_score(self, temp, humidity, co2, people):
    """快適度スコアを計算 (0-100)"""
    score = 100

    # 温度による減点 (最適: 22-24°C)
    if temp < 18 or temp > 30:
      score -= 30
    elif temp < 20 or temp > 26:
      score -= 15
    elif temp < 22 or temp > 24:
      score -= 5

    # 湿度による減点 (最適: 45-55%)
    if humidity < 30 or humidity > 80:
      score -= 20
    elif humidity < 40 or humidity > 60:
      score -= 10

    # CO2による減点 (最適: <600ppm)
    if co2 > 1000:
      score -= 25
    elif co2 > 800:
      score -= 15
    elif co2 > 600:
      score -= 5

    # 人数による減点
    if people > 4:
      score -= 10
    elif people > 2:
      score -= 5

    return max(0, score)

  async def send_data(self, data):
    """データをIoT Hubに送信"""
    message = Message(json.dumps(data))
    message.content_encoding = "utf-8"
    message.content_type = "application/json"

    await self.client.send_message(message)
    print(f"📤 データ送信: {data['timestamp']} - 温度: {data['temperature']}°C, 湿度: {data['humidity']}%, CO2: {data['co2']}ppm, 快適度: {data['comfortScore']}")

  async def run_simulation(self, interval=30):
    """シミュレーション実行"""
    print(f"🚀 快適君シミュレーション開始 (間隔: {interval}秒)")

    try:
      await self.connect()

      while True:
        data = self.generate_sensor_data()
        await self.send_data(data)
        await asyncio.sleep(interval)

    except KeyboardInterrupt:
      print("\n⏹️ シミュレーション停止")
    finally:
      await self.disconnect()


async def main():
  """メイン関数"""
  simulator = KaitekiSimulator(CONNECTION_STRING)
  await simulator.run_simulation(interval=30)  # 30秒間隔でデータ送信

if __name__ == "__main__":
  asyncio.run(main())
