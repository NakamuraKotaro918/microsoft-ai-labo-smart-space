# 快適君 MQTT データ受信機能

## 概要

このAPIは快適君（温湿度CO2センサー）からのMQTTデータを受信し、Cosmos DBに保存する機能を提供します。

## 快適君のデータ形式

快適君からは以下の形式のJSONデータを受信します：

```json
{
  "DeviceNo": "KAITEKI001",
  "Illuminance": 300,
  "Temperature": 22.5,
  "Humidity": 55.0,
  "Pressure": 1013.2,
  "CO2": 450,
  "Human": true,
  "DataNo": 1234,
  "Ver": "1.0.0",
  "Rssi": -45,
  "MeasureTime": "2024-01-15 14:30:25",
  "Voltage": 4.1,
  "Power": 1.2,
  "SSID": "KAITEKI_WIFI",
  "PASS": "********",
  "Interval": 30,
  "MAC": "AA:BB:CC:DD:EE:FF",
  "DeciceName": "快適君-001"
}
```

### データ項目の説明

| 項目 | 型 | 説明 |
|------|----|------|
| DeviceNo | string | デバイス番号 |
| Illuminance | number | 照度 (lux) |
| Temperature | number | 温度 (°C) |
| Humidity | number | 湿度 (%) |
| Pressure | number | 気圧 (hPa) |
| CO2 | number | CO2濃度 (ppm) |
| Human | boolean | 人間検知 |
| DataNo | number | データ番号 |
| Ver | string | バージョン |
| Rssi | number | 無線信号強度 (dBm) |
| MeasureTime | string | 測定時刻 |
| Voltage | number | 電圧 (V) |
| Power | number | 消費電力 (W) |
| SSID | string | Wi-Fi SSID |
| PASS | string | Wi-Fi パスワード |
| Interval | number | 測定間隔 (秒) |
| MAC | string | MACアドレス |
| DeciceName | string | デバイス名 |

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

```bash
cp env.example .env
```

`.env`ファイルを編集して以下の値を設定：

```bash
# Cosmos DB設定
COSMOS_ENDPOINT=your_cosmos_db_endpoint
COSMOS_KEY=your_cosmos_db_key

# MQTT設定
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_TOPIC=kaiteki/sensor/data

# MQTTクライアントの有効/無効
ENABLE_MQTT=true
```

### 3. アプリケーションの起動

```bash
python app.py
```

## 使用方法

### MQTTクライアントの動作

1. **自動開始**: アプリケーション起動時にMQTTクライアントが自動的に開始されます
2. **データ受信**: 快適君からのデータを受信すると自動的にCosmos DBに保存されます
3. **ログ出力**: 受信したデータはログに出力されます

### API エンドポイント

#### 環境データ取得

```bash
GET /api/room/environment
```

レスポンス例：

```json
{
  "temperature": 22.5,
  "humidity": 55.0,
  "co2": 450,
  "pressure": 1013.2,
  "illuminance": 300,
  "isOccupied": true,
  "human": true,
  "deviceInfo": {
    "deviceNo": "KAITEKI001",
    "deviceName": "快適君-001",
    "version": "1.0.0",
    "mac": "AA:BB:CC:DD:EE:FF"
  },
  "networkInfo": {
    "rssi": -45,
    "ssid": "KAITEKI_WIFI",
    "voltage": 4.1,
    "power": 1.2
  },
  "temperatureHistory": [...],
  "humidityHistory": [...],
  "co2History": [...],
  "pressureHistory": [...],
  "illuminanceHistory": [...],
  "weeklyUsage": [...],
  "lastUpdate": "2024-01-15T14:30:25Z"
}
```

## テスト

### テスト用MQTTパブリッシャー

快適君のデータ形式に合わせたテストデータを送信できます：

```bash
# 30秒間隔でテストデータを送信
python test_mqtt_publisher.py

# 送信間隔を変更（例：10秒）
PUBLISH_INTERVAL=10 python test_mqtt_publisher.py
```

### テストデータの例

```json
{
  "DeviceNo": "KAITEKI001",
  "Illuminance": 245,
  "Temperature": 23.1,
  "Humidity": 52.3,
  "Pressure": 1012.8,
  "CO2": 467,
  "Human": true,
  "DataNo": 1,
  "Ver": "1.0.0",
  "Rssi": -42,
  "MeasureTime": "2024-01-15 14:30:25",
  "Voltage": 4.05,
  "Power": 1.15,
  "SSID": "KAITEKI_WIFI",
  "PASS": "********",
  "Interval": 30,
  "MAC": "AA:BB:CC:DD:EE:FF",
  "DeciceName": "快適君-001"
}
```

## データ保存形式

Cosmos DBに保存されるデータの形式：

```json
{
  "id": "kaiteki_KAITEKI001_2024-01-15T14:30:25Z",
  "deviceType": "kaiteki",
  "timestamp": "2024-01-15T14:30:25Z",
  "partitionKey": "kaiteki_2024-01-15",
  "data": {
    "deviceNo": "KAITEKI001",
    "illuminance": 245,
    "temperature": 23.1,
    "humidity": 52.3,
    "pressure": 1012.8,
    "co2": 467,
    "human": true,
    "dataNo": 1,
    "version": "1.0.0",
    "rssi": -42,
    "measureTime": "2024-01-15 14:30:25",
    "voltage": 4.05,
    "power": 1.15,
    "ssid": "KAITEKI_WIFI",
    "pass": "********",
    "interval": 30,
    "mac": "AA:BB:CC:DD:EE:FF",
    "deviceName": "快適君-001",
    "occupancy": true
  },
  "metadata": {
    "source": "kaiteki_mqtt",
    "version": "1.0",
    "processed_at": "2024-01-15T14:30:25Z",
    "raw_data": {...}
  }
}
```

## トラブルシューティング

### MQTT接続エラー

1. **ブローカーが起動しているか確認**
   ```bash
   # Mosquittoの場合
   systemctl status mosquitto
   ```

2. **ポートが開いているか確認**
   ```bash
   netstat -an | grep 1883
   ```

3. **認証情報を確認**
   - ユーザー名・パスワードが正しいか
   - アクセス権限があるか

### データ受信エラー

1. **ログを確認**
   ```bash
   tail -f app.log
   ```

2. **トピック名を確認**
   - 快適君の送信トピックと受信トピックが一致しているか

3. **JSON形式を確認**
   - 受信データが正しいJSON形式か

### Cosmos DB保存エラー

1. **接続情報を確認**
   - エンドポイントとキーが正しいか

2. **権限を確認**
   - Cosmos DBへの書き込み権限があるか

3. **パーティションキーを確認**
   - パーティションキーの設定が正しいか

## ログ

ログレベルは`INFO`に設定されており、以下の情報が出力されます：

- MQTT接続状況
- データ受信状況
- Cosmos DB保存状況
- エラー情報

ログ例：
```
INFO:快適君 MQTT クライアント初期化完了
INFO:MQTT Broker: localhost:1883
INFO:MQTT Topic: kaiteki/sensor/data
INFO:MQTT接続成功
INFO:トピック購読: kaiteki/sensor/data
INFO:メッセージ受信: kaiteki/sensor/data
INFO:受信データ: {'DeviceNo': 'KAITEKI001', ...}
INFO:データ保存成功: kaiteki_KAITEKI001_2024-01-15T14:30:25Z
```
