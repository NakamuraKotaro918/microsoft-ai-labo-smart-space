#!/bin/bash

# Azure Event Hub 作成スクリプト
# リアルタイムデータストリーミング用

set -e

# 設定
RESOURCE_GROUP="smart-space-rg"
LOCATION="japaneast"
EVENT_HUB_NAMESPACE="smart-space-events"
EVENT_HUB_NAME="sensor-data"
CONSUMER_GROUP="dashboard-consumer"

echo "🚀 Azure Event Hub を作成します..."

# Event Hub Namespace の作成
echo "📦 Event Hub Namespace を作成中..."
az eventhubs namespace create \
    --resource-group $RESOURCE_GROUP \
    --name $EVENT_HUB_NAMESPACE \
    --location $LOCATION \
    --sku Standard \
    --enable-auto-inflate \
    --maximum-throughput-units 10 \
    --enable-kafka \
    --output table

# Event Hub の作成
echo "🌐 Event Hub を作成中..."
az eventhubs eventhub create \
    --resource-group $RESOURCE_GROUP \
    --namespace-name $EVENT_HUB_NAMESPACE \
    --name $EVENT_HUB_NAME \
    --message-retention 7 \
    --partition-count 4 \
    --output table

# Consumer Group の作成
echo "👥 Consumer Group を作成中..."
az eventhubs eventhub consumer-group create \
    --resource-group $RESOURCE_GROUP \
    --namespace-name $EVENT_HUB_NAMESPACE \
    --eventhub-name $EVENT_HUB_NAME \
    --name $CONSUMER_GROUP \
    --output table

# 接続文字列の取得
echo "🔑 接続文字列を取得中..."
CONNECTION_STRING=$(az eventhubs namespace authorization-rule keys list \
    --resource-group $RESOURCE_GROUP \
    --namespace-name $EVENT_HUB_NAMESPACE \
    --name RootManageSharedAccessKey \
    --query primaryConnectionString \
    --output tsv)

echo ""
echo "✅ Event Hub の作成が完了しました！"
echo ""
echo "📋 作成されたリソース:"
echo "- Namespace: $EVENT_HUB_NAMESPACE"
echo "- Event Hub: $EVENT_HUB_NAME"
echo "- Consumer Group: $CONSUMER_GROUP"
echo ""
echo "🔗 接続文字列:"
echo "$CONNECTION_STRING"
echo ""
echo "⚠️  この接続文字列は機密情報です。Azure Key Vaultに保存してください。"
