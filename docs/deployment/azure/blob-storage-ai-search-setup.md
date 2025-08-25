# Blob Storage と AI Search セットアップガイド

## 概要

このガイドでは、Microsoft AI Labo スマート空間最適化システムに Blob Storage と AI Search を統合する方法について説明します。

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   快適君        │    │   SONY AITRIOS  │    │   SmartPhone    │
│   (MQTT)        │    │   (HTTP/API)    │    │   (HTTP/API)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure IoT Hub                               │
│                    (MQTT Broker)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure App Service                           │
│                    (Dashboard API)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Cosmos DB                             │
│                    (NoSQL Database)                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Blob Storage                          │
│                    (データ保存・画像保存)                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure AI Search                             │
│                    (全文検索・分析)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Web Dashboard                               │
│                    (Static Web App)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 1. インフラストラクチャのデプロイ

### 1.1 前提条件

- Azure CLI がインストールされている
- Azure サブスクリプションにアクセス権限がある
- Bicep CLI がインストールされている
- **リソースグループ「MS-Lab-Proj-RG」へのアクセス権限がある**

### 1.2 デプロイ実行

```bash
cd infrastructure

# 開発環境へのデプロイ
./deploy.sh dev

# 本番環境へのデプロイ
./deploy.sh prod
```

**注意**: このプロジェクトは、Azure管理者から提供されたリソースグループ「MS-Lab-Proj-RG」を使用します。リソースグループへのアクセス権限がない場合は、Azure管理者に確認してください。

### 1.3 デプロイされるリソース

- **Azure Storage Account**: Blob Storage用
- **Blob Containers**: 
  - `sensor-data`: センサーデータ保存
  - `analysis-data`: 分析データ保存
  - `image-data`: 画像データ保存
- **Azure AI Search**: 全文検索サービス
- **Search Index**: `sensor-data-index`
- **Search Data Source**: Cosmos DB連携
- **Search Indexer**: 自動インデックス更新

## 2. アプリケーションの設定

### 2.1 環境変数の設定

App Service の設定で以下の環境変数を追加：

```bash
# Blob Storage設定
STORAGE_ACCOUNT_NAME=stmasssmartspacedev
STORAGE_ACCOUNT_KEY=<your-storage-account-key>
BLOB_CONTAINER_SENSOR=sensor-data
BLOB_CONTAINER_ANALYSIS=analysis-data
BLOB_CONTAINER_IMAGE=image-data

# AI Search設定
SEARCH_SERVICE_NAME=search-masssmartspacedev
SEARCH_SERVICE_KEY=<your-search-service-key>
SEARCH_INDEX_NAME=sensor-data-index

# IoT Hub設定
IOT_HUB_CONNECTION_STRING=<your-iot-hub-connection-string>
```

### 2.2 依存関係のインストール

```bash
cd azure-data-pipeline/api/dashboard-api
pip install -r requirements.txt
```

## 3. API エンドポイント

### 3.1 Blob Storage API

#### センサーデータのアップロード
```http
POST /api/blob/upload-sensor
Content-Type: application/json

{
  "deviceId": "kaiteki-001",
  "data": {
    "temperature": 22.5,
    "humidity": 55,
    "co2": 450
  }
}
```

#### 分析データのアップロード
```http
POST /api/blob/upload-analysis
Content-Type: application/json

{
  "analysisType": "occupancy",
  "data": {
    "personCount": 5,
    "occupancyRate": 0.8
  }
}
```

#### センサーデータの取得
```http
GET /api/blob/sensor-data/kaiteki-001?start_time=2024-01-01T00:00:00Z&end_time=2024-01-02T00:00:00Z
```

#### 分析データの取得
```http
GET /api/blob/analysis-data/occupancy?start_time=2024-01-01T00:00:00Z&end_time=2024-01-02T00:00:00Z
```

### 3.2 AI Search API

#### ドキュメントのアップロード
```http
POST /api/search/upload
Content-Type: application/json

{
  "deviceId": "kaiteki-001",
  "deviceType": "kaiteki",
  "temperature": 22.5,
  "humidity": 55,
  "co2": 450,
  "personCount": 5,
  "data": {
    "additional": "information"
  }
}
```

#### 全文検索
```http
GET /api/search/query?q=温度&filters=deviceType eq 'kaiteki'&order_by=timestamp desc&top=10
```

#### デバイス別検索
```http
GET /api/search/device/kaiteki-001?start_time=2024-01-01T00:00:00Z&end_time=2024-01-02T00:00:00Z
```

#### デバイスタイプ別検索
```http
GET /api/search/device-type/kaiteki
```

#### 温度範囲検索
```http
GET /api/search/temperature-range?min_temp=20&max_temp=25
```

#### 人数範囲検索
```http
GET /api/search/person-count-range?min_count=1&max_count=10
```

#### ファセット検索
```http
GET /api/search/facets/deviceType?count=10
```

#### 統計情報取得
```http
GET /api/search/statistics
```

### 3.3 IoT Hub管理 API

#### デバイスリスト取得
```http
GET /api/iot/devices?max_count=100
```

#### デバイス作成
```http
POST /api/iot/devices
Content-Type: application/json

{
  "deviceId": "kaiteki-001",
  "deviceType": "sensor"
}
```

#### デバイス削除
```http
DELETE /api/iot/devices/kaiteki-001
```

#### デバイスツイン取得
```http
GET /api/iot/devices/kaiteki-001/twin
```

#### デバイスツイン更新
```http
PUT /api/iot/devices/kaiteki-001/twin
Content-Type: application/json

{
  "properties": {
    "telemetryInterval": 60,
    "reportingEnabled": true
  }
}
```

#### メッセージ送信
```http
POST /api/iot/devices/kaiteki-001/message
Content-Type: application/json

{
  "message": {
    "command": "restart",
    "parameters": {}
  }
}
```

#### デバイス有効化/無効化
```http
POST /api/iot/devices/kaiteki-001/enable
POST /api/iot/devices/kaiteki-001/disable
```

#### テレメトリ設定
```http
PUT /api/iot/devices/kaiteki-001/telemetry
Content-Type: application/json

{
  "interval": 30
}
```

#### 統計情報取得
```http
GET /api/iot/statistics
```

## 4. データフロー

### 4.1 センサーデータの流れ

1. **データ収集**: 快適君、AITRIOS、SmartPhoneからデータ収集
2. **IoT Hub**: MQTT経由でデータを受信
3. **App Service**: APIでデータを処理
4. **Cosmos DB**: リアルタイムデータを保存
5. **Blob Storage**: 長期保存用データを保存
6. **AI Search**: 検索用インデックスを作成
7. **Dashboard**: データを可視化

### 4.2 検索フロー

1. **ユーザー検索**: ダッシュボードから検索クエリ送信
2. **AI Search**: 全文検索・フィルタリング実行
3. **結果取得**: 検索結果をJSON形式で返却
4. **可視化**: ダッシュボードで結果を表示

## 5. 監視・運用

### 5.1 ログ監視

```bash
# App Service ログの確認
az webapp log tail --name api-mass-smart-space-dev --resource-group rg-mass-smart-space-dev
```

### 5.2 メトリクス監視

- **Blob Storage**: ストレージ使用量、アクセス頻度
- **AI Search**: 検索クエリ数、レイテンシー
- **IoT Hub**: デバイス接続数、メッセージ数

### 5.3 アラート設定

- ストレージ使用量が80%を超えた場合
- 検索レイテンシーが1秒を超えた場合
- IoT Hubデバイスがオフラインになった場合

## 6. セキュリティ

### 6.1 アクセス制御

- **Blob Storage**: SAS トークン、アクセスポリシー
- **AI Search**: API キー認証
- **IoT Hub**: デバイス認証、TLS暗号化

### 6.2 データ保護

- 保存時暗号化（Azure Storage）
- 転送時暗号化（HTTPS/TLS）
- アクセスログ記録

## 7. トラブルシューティング

### 7.1 よくある問題

#### Blob Storage接続エラー
```bash
# 接続文字列の確認
echo $STORAGE_ACCOUNT_NAME
echo $STORAGE_ACCOUNT_KEY
```

#### AI Search接続エラー
```bash
# サービス名とキーの確認
echo $SEARCH_SERVICE_NAME
echo $SEARCH_SERVICE_KEY
```

#### IoT Hub接続エラー
```bash
# 接続文字列の確認
echo $IOT_HUB_CONNECTION_STRING
```

### 7.2 ログ確認

```bash
# アプリケーションログ
tail -f /var/log/app.log

# エラーログ
grep "ERROR" /var/log/app.log
```

## 8. パフォーマンス最適化

### 8.1 Blob Storage

- 適切なコンテナ設計
- アクセス層の設定（Hot/Cool/Archive）
- CDN統合

### 8.2 AI Search

- インデックス最適化
- クエリパフォーマンス改善
- スケーリング設定

### 8.3 IoT Hub

- パーティション設定
- メッセージルーティング
- デバイス管理

## 9. コスト最適化

### 9.1 料金見積もり

- **Blob Storage**: ¥1,000-5,000/月
- **AI Search**: ¥5,000-20,000/月
- **IoT Hub**: ¥1,000-3,000/月

### 9.2 コスト削減策

- データライフサイクル管理
- 適切なSKU選択
- 使用量監視

## 10. 今後の拡張

### 10.1 機能拡張

- 機械学習統合
- 予測分析
- リアルタイムアラート

### 10.2 統合拡張

- Power BI連携
- Logic Apps統合
- Azure Functions統合
