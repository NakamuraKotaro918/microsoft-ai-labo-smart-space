#!/bin/bash

# Azure Static Web Apps デプロイスクリプト
# Microsoft AI Labo スマート空間最適化ダッシュボード

set -e

echo "🚀 Azure Static Web Apps デプロイを開始します..."

# 必要なファイルの存在確認
echo "📋 ファイルの存在確認..."
required_files=(
    "index.html"
    "staticwebapp.config.json"
    "package.json"
    ".github/workflows/azure-static-web-apps.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 必要なファイルが見つかりません: $file"
        exit 1
    fi
done

echo "✅ 必要なファイルが確認されました"

# Git の状態確認
echo "🔍 Git の状態確認..."
if [ -d ".git" ]; then
    echo "📊 現在のブランチ: $(git branch --show-current)"
    echo "📝 未コミットの変更:"
    git status --porcelain || echo "   変更なし"
else
    echo "⚠️  Git リポジトリが見つかりません"
fi

# ファイルサイズの確認
echo "📏 ファイルサイズの確認..."
total_size=$(du -sh . | cut -f1)
echo "   総サイズ: $total_size"

# 静的ファイルの確認
echo "📁 静的ファイルの確認..."
html_files=$(find . -name "*.html" | wc -l)
css_files=$(find . -name "*.css" | wc -l)
js_files=$(find . -name "*.js" | wc -l)

echo "   HTML ファイル: $html_files"
echo "   CSS ファイル: $css_files"
echo "   JavaScript ファイル: $js_files"

# デプロイ準備完了
echo ""
echo "🎉 デプロイ準備が完了しました！"
echo ""
echo "📋 次の手順でデプロイしてください："
echo ""
echo "1. Azure Portal で Static Web App リソースを作成"
echo "2. ソース設定で以下を指定："
echo "   - ソース: GitHub"
echo "   - リポジトリ: このプロジェクトのリポジトリ"
echo "   - ブランチ: main"
echo "   - アプリの場所: dashboard"
echo "   - APIの場所: 空白"
echo "   - 出力場所: 空白"
echo ""
echo "3. デプロイが完了すると、以下のURLでアクセス可能になります："
echo "   https://[your-app-name].azurestaticapps.net"
echo ""
echo "📚 詳細な手順は AZURE_DEPLOYMENT.md を参照してください"
echo ""
echo "🔧 トラブルシューティング："
echo "   - GitHub Actions のログを確認"
echo "   - Azure Portal でデプロイログを確認"
echo "   - ブラウザの開発者ツールでエラーを確認"
