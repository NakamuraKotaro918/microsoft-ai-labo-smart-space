#!/bin/bash

# Azure Cosmos DB 作成スクリプト
# リアルタイムデータ保存用

set -e

# 設定
RESOURCE_GROUP="smart-space-rg"
LOCATION="japaneast"
COSMOS_ACCOUNT="smart-space-cosmos"
DATABASE_NAME="smart-space-db"
CONTAINER_SENSOR="sensor-data"
CONTAINER_ANALYSIS="analysis-data"
CONTAINER_USERS="user-data"

echo "🚀 Azure Cosmos DB を作成します..."

# Cosmos DB アカウントの作成
echo "📦 Cosmos DB アカウントを作成中..."
az cosmosdb create \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_ACCOUNT \
    --locations regionName=$LOCATION \
    --capabilities EnableServerless \
    --output table

# データベースの作成
echo "🗄️ データベースを作成中..."
az cosmosdb sql database create \
    --resource-group $RESOURCE_GROUP \
    --account-name $COSMOS_ACCOUNT \
    --name $DATABASE_NAME \
    --output table

# センサーデータコンテナの作成
echo "📊 センサーデータコンテナを作成中..."
az cosmosdb sql container create \
    --resource-group $RESOURCE_GROUP \
    --account-name $COSMOS_ACCOUNT \
    --database-name $DATABASE_NAME \
    --name $CONTAINER_SENSOR \
    --partition-key-path "/deviceId" \
    --throughput 400 \
    --output table

# 分析データコンテナの作成
echo "📈 分析データコンテナを作成中..."
az cosmosdb sql container create \
    --resource-group $RESOURCE_GROUP \
    --account-name $COSMOS_ACCOUNT \
    --database-name $DATABASE_NAME \
    --name $CONTAINER_ANALYSIS \
    --partition-key-path "/analysisType" \
    --throughput 400 \
    --output table

# ユーザーデータコンテナの作成
echo "👤 ユーザーデータコンテナを作成中..."
az cosmosdb sql container create \
    --resource-group $RESOURCE_GROUP \
    --account-name $COSMOS_ACCOUNT \
    --database-name $DATABASE_NAME \
    --name $CONTAINER_USERS \
    --partition-key-path "/userId" \
    --throughput 400 \
    --output table

# 接続文字列の取得
echo "🔑 接続文字列を取得中..."
CONNECTION_STRING=$(az cosmosdb keys list \
    --resource-group $RESOURCE_GROUP \
    --name $COSMOS_ACCOUNT \
    --type connection-strings \
    --query connectionStrings[0].connectionString \
    --output tsv)

echo ""
echo "✅ Cosmos DB の作成が完了しました！"
echo ""
echo "📋 作成されたリソース:"
echo "- アカウント: $COSMOS_ACCOUNT"
echo "- データベース: $DATABASE_NAME"
echo "- コンテナ:"
echo "  - $CONTAINER_SENSOR (センサーデータ)"
echo "  - $CONTAINER_ANALYSIS (分析データ)"
echo "  - $CONTAINER_USERS (ユーザーデータ)"
echo ""
echo "🔗 接続文字列:"
echo "$CONNECTION_STRING"
echo ""
echo "⚠️  この接続文字列は機密情報です。Azure Key Vaultに保存してください。"
