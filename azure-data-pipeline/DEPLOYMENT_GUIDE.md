# Azure データパイプライン デプロイガイド

SONY AITRIOS、Google Gemini API、快適君からデータを受けてAzure内のDBに蓄積し、ダッシュボードに表示するための完全なデプロイ手順です。

## 📋 前提条件

- Azure サブスクリプション
- Azure CLI がインストール済み
- Python 3.8以上
- 外部APIのアクセス権限（AITRIOS、Gemini、快適君）

## 🚀 Phase 1: 基盤リソースの作成

### 1.1 リソースグループの作成

```bash
az group create --name smart-space-rg --location japaneast
```

### 1.2 Cosmos DBの作成

```bash
chmod +x 02-create-cosmos-db.sh
./02-create-cosmos-db.sh
```

### 1.4 Azure Key Vaultの作成

```bash
az keyvault create \
    --name smart-space-kv \
    --resource-group smart-space-rg \
    --location japaneast \
    --sku standard
```

## 🔧 Phase 2: Azure Functions のデプロイ

### 2.1 Functions App の作成

```bash
az functionapp create \
    --resource-group smart-space-rg \
    --consumption-plan-location japaneast \
    --runtime python \
    --runtime-version 3.11 \
    --functions-version 4 \
    --name smart-space-functions \
    --storage-account smartspacestorage
```

### 2.2 環境変数の設定

```bash
# Cosmos DB接続文字列
az functionapp config appsettings set \
    --resource-group smart-space-rg \
    --name smart-space-functions \
    --settings CosmosDBConnectionString="<Cosmos DB接続文字列>"
```

### 2.3 Functions のデプロイ

```bash
cd functions
func azure functionapp publish smart-space-functions
```


    --resource-group smart-space-rg \
    --job-name smart-space-stream-analytics \
    --name cosmosdb-output \
    --datasource type=Microsoft.Storage/DocumentDB \
    --datasource properties.accountId=smart-space-cosmos \
    --datasource properties.accountKey="<Cosmos DB接続文字列>" \
    --datasource properties.database=smart-space-db \
    --datasource properties.collectionNamePattern=sensor-data \
    --datasource properties.documentId=id

## 🌐 Phase 3: API サーバーのデプロイ

### 4.1 App Service の作成

```bash
az appservice plan create \
    --name smart-space-api-plan \
    --resource-group smart-space-rg \
    --sku B1 \
    --is-linux

az webapp create \
    --resource-group smart-space-rg \
    --plan smart-space-api-plan \
    --name smart-space-api \
    --runtime "PYTHON|3.11"
```

### 4.2 環境変数の設定

```bash
az webapp config appsettings set \
    --resource-group smart-space-rg \
    --name smart-space-api \
    --settings \
    COSMOS_ENDPOINT="<Cosmos DBエンドポイント>" \
    COSMOS_KEY="<Cosmos DBキー>"
```

### 4.3 API のデプロイ

```bash
cd api/dashboard-api
az webapp deployment source config-local-git \
    --resource-group smart-space-rg \
    --name smart-space-api

git add .
git commit -m "Add dashboard API"
git push azure main
```

## 🔗 Phase 4: 外部API連携の設定

### 5.1 SONY AITRIOS データ送信

```bash
# データ送信エンドポイント
POST https://smart-space-functions.azurewebsites.net/api/collect/aitrios

# サンプルデータ
{
  "deviceId": "aitrios-001",
  "personCount": 5,
  "ageDistribution": [35, 40, 20, 5],
  "genderDistribution": [55, 40, 5],
  "confidence": 0.95,
  "location": {"x": 100, "y": 200}
}
```

### 5.2 Google Gemini データ送信

```bash
# データ送信エンドポイント
POST https://smart-space-functions.azurewebsites.net/api/collect/gemini

# サンプルデータ
{
  "deviceId": "gemini-001",
  "behaviorAnalysis": {
    "interestLevel": 85,
    "avgMovement": 12.5,
    "groupBehavior": 45
  },
  "emotionAnalysis": {
    "primaryEmotion": "interest",
    "confidence": 0.88
  },
  "interactionPatterns": ["group", "individual"]
}
```

### 5.3 快適君 データ送信

```bash
# データ送信エンドポイント
POST https://smart-space-functions.azurewebsites.net/api/collect/kaiteki

# サンプルデータ
{
  "deviceId": "kaiteki-001",
  "temperature": 22.5,
  "humidity": 55,
  "co2": 450,
  "lightLevel": 500,
  "noiseLevel": 45,
  "occupancy": true
}
```

## 📱 Phase 6: ダッシュボードの更新

### 6.1 データサービスの更新

`dashboard/scripts/data-service.js` を更新して、新しいAPIエンドポイントを使用：

```javascript
// 新しいAPIエンドポイント
this.baseUrl = 'https://smart-space-api.azurewebsites.net';
```

### 6.2 Static Web Apps の再デプロイ

```bash
cd dashboard
git add .
git commit -m "Update to use real-time data API"
git push origin main
```

## 🔍 Phase 7: 監視とテスト

### 7.1 Application Insights の設定

```bash
az monitor app-insights component create \
    --app smart-space-insights \
    --location japaneast \
    --resource-group smart-space-rg \
    --application-type web
```

### 7.2 テストデータの送信

```bash
# テストスクリプトの実行
python test_data_sender.py
```

### 7.3 ダッシュボードの確認

1. Static Web Apps URL にアクセス
2. リアルタイムデータの表示を確認
3. 各データソースからのデータ統合を確認

## 📊 料金見積もり

### 月額想定料金（Free プラン）

- **Static Web Apps**: ¥0
- **Cosmos DB**: ¥0 (1000 RU/秒まで)
- **Functions**: ¥0 (100万実行/月まで)
- **App Service**: ¥0 (F1 プラン)

### 本格運用時の料金

- **Cosmos DB**: 約¥5,000-20,000/月
- **Functions**: 約¥1,000-3,000/月
- **App Service**: 約¥1,000-5,000/月

## 🆘 トラブルシューティング

### よくある問題

1. **データが表示されない**
   - Cosmos DB接続を確認
   - Azure Functionsのログを確認

2. **APIエラー**
   - App Serviceのログを確認
   - 環境変数の設定を確認
   - CORS設定を確認

3. **リアルタイム性の問題**
   - Azure Functionsの実行頻度を確認
   - MQTT Brokerの接続状態を確認

## 📚 参考資料

- [Azure Cosmos DB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Functions ドキュメント](https://docs.microsoft.com/azure/azure-functions/)
- [Azure IoT Hub ドキュメント](https://docs.microsoft.com/azure/iot-hub/)
