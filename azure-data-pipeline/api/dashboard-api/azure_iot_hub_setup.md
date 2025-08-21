# Azure IoT Hub での MQTT 動作確認

## 概要

Azure IoT Hubを使用して快適君からのMQTTデータを受信・確認する方法を説明します。

## 1. Azure IoT Hub のセットアップ

### 1.1 IoT Hub の作成

```bash
# Azure CLI での作成
az iot hub create \
  --resource-group rg-mass-smart-space \
  --name iot-hub-mass-smart-space \
  --sku S1 \
  --partition-count 4
```

### 1.2 デバイスの登録

```bash
# 快適君デバイスの登録
az iot hub device-identity create \
  --hub-name iot-hub-mass-smart-space \
  --device-id kaiteki-001

# 接続文字列の取得
az iot hub device-identity connection-string show \
  --hub-name iot-hub-mass-smart-space \
  --device-id kaiteki-001
```

## 2. Azure IoT Explorer での動作確認

### 2.1 Azure IoT Explorer のインストール

**Windows:**
```bash
# Microsoft Store からインストール
# "Azure IoT Explorer" で検索
```

**macOS:**
```bash
# Homebrew からインストール
brew install --cask azure-iot-explorer
```

**Linux:**
```bash
# 公式サイトからダウンロード
# https://github.com/Azure/azure-iot-explorer/releases
```

### 2.2 接続設定

1. **IoT Hub 接続**
   - IoT Hub の接続文字列を入力
   - または Azure アカウントでログイン

2. **デバイス選択**
   - 登録した `kaiteki-001` デバイスを選択

3. **メッセージ監視**
   - "Messages" タブでリアルタイムメッセージを確認

## 3. MQTT クライアントの修正

### 3.1 Azure IoT Hub 対応 MQTT クライアント

```python
# azure_iot_mqtt_client.py
import paho.mqtt.client as mqtt
import json
import os
import logging
from datetime import datetime
import ssl

class AzureIoTHubMQTTClient:
    """Azure IoT Hub 対応 MQTT クライアント"""
    
    def __init__(self):
        # Azure IoT Hub 設定
        self.iot_hub_host = os.environ.get('IOT_HUB_HOST')
        self.device_id = os.environ.get('DEVICE_ID', 'kaiteki-001')
        self.sas_token = os.environ.get('SAS_TOKEN')
        
        # MQTT設定
        self.client = mqtt.Client(client_id=self.device_id)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # TLS設定
        self.client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2)
        self.client.tls_insecure_set(False)
        
        # 認証設定
        self.client.username_pw_set(username=f"{self.iot_hub_host}/{self.device_id}/?api-version=2021-04-12", 
                                   password=self.sas_token)
        
        logging.info(f"Azure IoT Hub MQTT クライアント初期化完了")
        logging.info(f"IoT Hub: {self.iot_hub_host}")
        logging.info(f"Device ID: {self.device_id}")
    
    def on_connect(self, client, userdata, flags, rc):
        """MQTT接続時のコールバック"""
        if rc == 0:
            logging.info("Azure IoT Hub 接続成功")
            # デバイスツインの購読
            client.subscribe(f"$iothub/twin/res/#")
            client.subscribe(f"$iothub/methods/POST/#")
        else:
            logging.error(f"Azure IoT Hub 接続失敗: {rc}")
    
    def on_message(self, client, userdata, msg):
        """MQTTメッセージ受信時のコールバック"""
        try:
            logging.info(f"メッセージ受信: {msg.topic}")
            payload = json.loads(msg.payload.decode('utf-8'))
            logging.info(f"受信データ: {payload}")
            
            # メッセージの処理
            self.handle_message(msg.topic, payload)
            
        except json.JSONDecodeError as e:
            logging.error(f"JSON解析エラー: {e}")
        except Exception as e:
            logging.error(f"メッセージ処理エラー: {e}")
    
    def on_disconnect(self, client, userdata, rc):
        """MQTT切断時のコールバック"""
        if rc != 0:
            logging.warning(f"予期しない切断: {rc}")
        else:
            logging.info("Azure IoT Hub 切断")
    
    def handle_message(self, topic, payload):
        """メッセージの処理"""
        if topic.startswith("$iothub/twin/res"):
            # デバイスツイン応答
            logging.info(f"デバイスツイン応答: {payload}")
        elif topic.startswith("$iothub/methods/POST"):
            # ダイレクトメソッド
            logging.info(f"ダイレクトメソッド: {payload}")
    
    def send_telemetry(self, data):
        """テレメトリデータの送信"""
        try:
            # 快適君データの正規化
            telemetry_data = {
                "deviceId": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "data": data
            }
            
            message = json.dumps(telemetry_data, ensure_ascii=False)
            topic = f"devices/{self.device_id}/messages/events/"
            
            result = self.client.publish(topic, message)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logging.info(f"テレメトリ送信成功: {data.get('DeviceNo', 'unknown')}")
            else:
                logging.error(f"テレメトリ送信失敗: {result.rc}")
                
        except Exception as e:
            logging.error(f"テレメトリ送信エラー: {e}")
    
    def update_device_twin(self, properties):
        """デバイスツインの更新"""
        try:
            twin_data = {
                "properties": {
                    "reported": properties
                }
            }
            
            message = json.dumps(twin_data, ensure_ascii=False)
            topic = f"$iothub/twin/PATCH/properties/reported/?$rid=1"
            
            result = self.client.publish(topic, message)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logging.info("デバイスツイン更新成功")
            else:
                logging.error(f"デバイスツイン更新失敗: {result.rc}")
                
        except Exception as e:
            logging.error(f"デバイスツイン更新エラー: {e}")
    
    def connect(self):
        """MQTT接続開始"""
        try:
            logging.info("Azure IoT Hub 接続開始...")
            self.client.connect(self.iot_hub_host, 8883, 60)
            self.client.loop_start()
        except Exception as e:
            logging.error(f"Azure IoT Hub 接続エラー: {e}")
    
    def disconnect(self):
        """MQTT接続終了"""
        try:
            self.client.loop_stop()
            self.client.disconnect()
            logging.info("Azure IoT Hub 接続終了")
        except Exception as e:
            logging.error(f"Azure IoT Hub 切断エラー: {e}")
    
    def start(self):
        """クライアント開始"""
        self.connect()
    
    def stop(self):
        """クライアント停止"""
        self.disconnect()
```

### 3.2 SAS トークンの生成

```python
# generate_sas_token.py
import hmac
import hashlib
import base64
import urllib.parse
from datetime import datetime, timedelta

def generate_sas_token(host, device_id, key, expiry=3600):
    """SAS トークンの生成"""
    
    # リソースURI
    resource_uri = f"{host}/devices/{device_id}"
    
    # 有効期限
    expiry_time = datetime.utcnow() + timedelta(seconds=expiry)
    expiry_str = str(int(expiry_time.timestamp()))
    
    # 署名文字列
    string_to_sign = f"{resource_uri}\n{expiry_str}"
    
    # 署名の生成
    signature = base64.b64encode(
        hmac.new(
            base64.b64decode(key),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).digest()
    ).decode('utf-8')
    
    # URLエンコード
    signature_encoded = urllib.parse.quote(signature, safe='')
    
    # SAS トークンの構築
    sas_token = f"SharedAccessSignature sr={resource_uri}&sig={signature_encoded}&se={expiry_str}"
    
    return sas_token

# 使用例
if __name__ == "__main__":
    host = "your-iot-hub.azure-devices.net"
    device_id = "kaiteki-001"
    key = "your-device-primary-key"
    
    sas_token = generate_sas_token(host, device_id, key)
    print(f"SAS Token: {sas_token}")
```

## 4. 環境変数の設定

```bash
# .env ファイルに追加
IOT_HUB_HOST=your-iot-hub.azure-devices.net
DEVICE_ID=kaiteki-001
SAS_TOKEN=SharedAccessSignature sr=...
```

## 5. テスト用パブリッシャーの修正

```python
# test_azure_iot_publisher.py
from azure_iot_mqtt_client import AzureIoTHubMQTTClient
import time
import random
from datetime import datetime

class AzureIoTHubTestPublisher:
    """Azure IoT Hub テストパブリッシャー"""
    
    def __init__(self):
        self.mqtt_client = AzureIoTHubMQTTClient()
        self.device_no = "KAITEKI001"
        self.data_no = 1
    
    def generate_test_data(self):
        """快適君のテストデータを生成"""
        measure_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        test_data = {
            "DeviceNo": self.device_no,
            "Illuminance": random.randint(100, 500),
            "Temperature": round(random.uniform(20.0, 26.0), 1),
            "Humidity": round(random.uniform(40.0, 70.0), 1),
            "Pressure": round(random.uniform(1000, 1020), 1),
            "CO2": random.randint(400, 800),
            "Human": random.choice([True, False]),
            "DataNo": self.data_no,
            "Ver": "1.0.0",
            "Rssi": random.randint(-70, -30),
            "MeasureTime": measure_time,
            "Voltage": round(random.uniform(3.8, 4.2), 2),
            "Power": round(random.uniform(0.5, 2.0), 2),
            "SSID": "KAITEKI_WIFI",
            "PASS": "********",
            "Interval": 30,
            "MAC": "AA:BB:CC:DD:EE:FF",
            "DeciceName": "快適君-001"
        }
        
        self.data_no += 1
        return test_data
    
    def start_publishing(self, interval=30):
        """定期的にテストデータを送信"""
        print(f"Azure IoT Hub テストデータ送信開始 (間隔: {interval}秒)")
        
        try:
            while True:
                test_data = self.generate_test_data()
                self.mqtt_client.send_telemetry(test_data)
                
                # デバイスツインの更新
                twin_properties = {
                    "lastTelemetry": test_data,
                    "deviceStatus": "online",
                    "lastUpdate": datetime.utcnow().isoformat()
                }
                self.mqtt_client.update_device_twin(twin_properties)
                
                print(f"データ送信: {test_data['DataNo']}")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n送信停止")
            self.mqtt_client.stop()

if __name__ == "__main__":
    publisher = AzureIoTHubTestPublisher()
    publisher.mqtt_client.start()
    publisher.start_publishing(30)
```

## 6. 動作確認手順

### 6.1 Azure IoT Explorer での確認

1. **IoT Hub に接続**
2. **デバイスを選択** (`kaiteki-001`)
3. **Messages タブでリアルタイム確認**
4. **Device Twin タブで状態確認**

### 6.2 Azure CLI での確認

```bash
# デバイスメッセージの監視
az iot hub monitor-events \
  --hub-name iot-hub-mass-smart-space \
  --device-id kaiteki-001

# デバイスツインの確認
az iot hub device-twin show \
  --hub-name iot-hub-mass-smart-space \
  --device-id kaiteki-001
```

## 7. AWS IoT Core との比較表

| 機能 | AWS IoT Core | Azure IoT Hub |
|------|-------------|---------------|
| **MQTT ブローカー** | AWS IoT Core | Azure IoT Hub |
| **デバイス管理** | Thing Registry | Device Registry |
| **認証** | X.509証明書 | X.509証明書 / SAS |
| **メッセージルーティング** | Rules Engine | Message Routing |
| **デバイスツイン** | Device Shadow | Device Twin |
| **テストツール** | AWS IoT Device Advisor | Azure IoT Explorer |
| **CLI ツール** | AWS CLI | Azure CLI |
| **SDK** | AWS IoT SDK | Azure IoT SDK |

## 8. 推奨構成

**MASS プロジェクトでの推奨構成：**

```
快適君 → MQTT → Azure IoT Hub → Message Routing → Cosmos DB
                ↓
            Azure IoT Explorer (動作確認)
```

この構成により、AWS IoT Coreと同様の機能をAzureで実現できます。
