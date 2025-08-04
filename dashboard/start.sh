#!/bin/bash

echo "Microsoft AI Labo スマート空間最適化ダッシュボード"
echo "=================================================="
echo ""

# Pythonのバージョンチェック
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "エラー: Pythonがインストールされていません"
    echo "Python 3.6以上をインストールしてください"
    exit 1
fi

echo "使用するPython: $PYTHON_CMD"
echo ""

# 現在のディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "ダッシュボードディレクトリ: $SCRIPT_DIR"
echo ""

# サーバー起動
echo "サーバーを起動しています..."
echo "ブラウザで http://localhost:8000 にアクセスしてください"
echo ""
echo "終了するには Ctrl+C を押してください"
echo "=================================================="
echo ""

$PYTHON_CMD simple-server.py
