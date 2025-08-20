#!/bin/bash

# Azure Static Web App 作成スクリプト
# Microsoft AI Labo スマート空間最適化ダッシュボード

set -e

# 設定
RESOURCE_GROUP="smart-space-rg"
LOCATION="japaneast"
STATIC_WEB_APP_NAME="smart-space-dashboard"
GITHUB_REPO="your-username/microsoft-ai-labo-smart-space"
BRANCH="main"
APP_LOCATION="dashboard"

echo "🚀 Azure Static Web App を作成します..."

# リソースグループの作成
echo "📦 リソースグループを作成中..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

# Static Web App の作成
echo "🌐 Static Web App を作成中..."
az staticwebapp create \
    --name $STATIC_WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --source https://github.com/$GITHUB_REPO \
    --branch $BRANCH \
    --app-location $APP_LOCATION \
    --output table

echo ""
echo "✅ Static Web App の作成が完了しました！"
echo ""
echo "📋 次の手順："
echo "1. Azure Portal で Static Web App リソースに移動"
echo "2. '管理' タブでデプロイトークンを確認"
echo "3. GitHub リポジトリの Settings > Secrets で以下を設定："
echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN: [デプロイトークン]"
echo ""
echo "🔗 アクセスURL:"
echo "   https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
echo ""
echo "📚 詳細は AZURE_DEPLOYMENT.md を参照してください"
