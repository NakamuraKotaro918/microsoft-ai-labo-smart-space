#!/bin/bash

# Azure認証情報生成スクリプト
# GitHub Secrets用のサービスプリンシパルを作成

set -e

echo "🔐 Azure認証情報を生成します..."

# サービスプリンシパルの作成
echo "📋 サービスプリンシパルを作成中..."
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "github-actions-smart-space" \
    --role contributor \
    --scopes /subscriptions/$(az account show --query id -o tsv) \
    --sdk-auth \
    --output json)

echo "✅ サービスプリンシパルが作成されました"

# 認証情報をファイルに保存
echo "$SP_OUTPUT" > azure-credentials.json

echo ""
echo "🎉 Azure認証情報が生成されました！"
echo ""
echo "📋 次の手順でGitHub Secretsを設定してください："
echo ""
echo "1. GitHub リポジトリに移動"
echo "2. Settings > Secrets and variables > Actions を選択"
echo "3. 'New repository secret' をクリック"
echo "4. 以下のシークレットを追加："
echo ""
echo "   Name: AZURE_CREDENTIALS"
echo "   Value: (azure-credentials.jsonの内容をコピー)"
echo ""
echo "📄 azure-credentials.json の内容："
echo "----------------------------------------"
cat azure-credentials.json
echo "----------------------------------------"
echo ""
echo "⚠️  このファイルは機密情報を含むため、Gitにコミットしないでください！"
echo "   .gitignore に 'azure-credentials.json' を追加することを推奨します。"
