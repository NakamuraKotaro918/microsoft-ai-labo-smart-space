#!/bin/bash

# Microsoft AI Labo Smart Space プロジェクト
# 不要ファイルクリーンアップスクリプト

echo "🧹 プロジェクト内の不要ファイルをクリーンアップ中..."

# 削除前のサイズ確認
echo "📊 削除前のサイズ:"
du -sh ./* | sort -hr

# Python関連の一時ファイル
echo "🐍 Pythonキャッシュファイルを削除中..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.pyo" -delete
find . -name "*.pyd" -delete

# ログファイル
echo "📝 ログファイルを削除中..."
find . -name "*.log" -delete
find . -name "logs" -type d -exec rm -rf {} + 2>/dev/null

# 一時ファイル
echo "🗂️ 一時ファイルを削除中..."
find . -name "*.tmp" -delete
find . -name "*.temp" -delete
find . -name "*.bak" -delete
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete

# OS固有のファイル
echo "💻 OS固有ファイルを削除中..."
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# IDE設定ファイル
echo "🔧 IDE設定ファイルを削除中..."
find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".idea" -type d -exec rm -rf {} + 2>/dev/null

# 環境変数ファイル
echo "🔐 環境変数ファイルを削除中..."
find . -name ".env" -delete
find . -name ".env.local" -delete
find . -name ".env.development.local" -delete
find . -name ".env.test.local" -delete
find . -name ".env.production.local" -delete

# 仮想環境
echo "🌍 仮想環境を削除中..."
find . -name "venv" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".venv" -type d -exec rm -rf {} + 2>/dev/null
find . -name "env" -type d -exec rm -rf {} + 2>/dev/null

# Node.js関連
echo "📦 Node.js関連ファイルを削除中..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find . -name "npm-debug.log*" -delete
find . -name "yarn-debug.log*" -delete
find . -name "yarn-error.log*" -delete

# ビルド出力
echo "🏗️ ビルド出力を削除中..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "build" -type d -exec rm -rf {} + 2>/dev/null
find . -name "out" -type d -exec rm -rf {} + 2>/dev/null

# カバレッジレポート
echo "📊 カバレッジレポートを削除中..."
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".nyc_output" -type d -exec rm -rf {} + 2>/dev/null

# 削除後のサイズ確認
echo "📊 削除後のサイズ:"
du -sh ./* | sort -hr

# 削除されたファイル数の確認
echo "✅ クリーンアップ完了！"
echo "💡 今後のクリーンアップは 'bash cleanup.sh' で実行できます"
