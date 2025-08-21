#!/bin/bash

# MASS プロジェクト - IoT Hub デバイス作成スクリプト
# Microsoft AI Labo スマート空間最適化ダッシュボード

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 使用方法
usage() {
    echo "使用方法: $0 [dev|prod] [device-name]"
    echo ""
    echo "引数:"
    echo "  dev|prod      デプロイ環境を指定"
    echo "  device-name   デバイス名（オプション、デフォルト: kaiteki-001）"
    echo ""
    echo "例:"
    echo "  $0 dev                    # 開発環境にkaiteki-001デバイスを作成"
    echo "  $0 prod kaiteki-002       # 本番環境にkaiteki-002デバイスを作成"
}

# 引数チェック
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

ENVIRONMENT=$1
DEVICE_NAME=${2:-kaiteki-001}

# 環境チェック
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "無効な環境: $ENVIRONMENT (dev または prod を指定してください)"
    exit 1
fi

# 設定
PROJECT_NAME="mass-smart-space"
RESOURCE_GROUP_NAME="rg-${PROJECT_NAME}-${ENVIRONMENT}"
IOT_HUB_NAME="iot${replace(projectName, '-', '')}${environment}"

log_info "IoT Hub デバイス作成設定:"
log_info "  プロジェクト: $PROJECT_NAME"
log_info "  環境: $ENVIRONMENT"
log_info "  リソースグループ: $RESOURCE_GROUP_NAME"
log_info "  IoT Hub: $IOT_HUB_NAME"
log_info "  デバイス名: $DEVICE_NAME"

# Azure CLI ログイン確認
log_info "Azure CLI ログイン状態を確認中..."
if ! az account show > /dev/null 2>&1; then
    log_error "Azure CLI にログインしていません。'az login' を実行してください。"
    exit 1
fi

# リソースグループの存在確認
if ! az group show --name "$RESOURCE_GROUP_NAME" > /dev/null 2>&1; then
    log_error "リソースグループ '$RESOURCE_GROUP_NAME' が存在しません。"
    log_info "先にインフラストラクチャをデプロイしてください: ./deploy.sh $ENVIRONMENT"
    exit 1
fi

# IoT Hub の存在確認
if ! az iot hub show --name "$IOT_HUB_NAME" --resource-group "$RESOURCE_GROUP_NAME" > /dev/null 2>&1; then
    log_error "IoT Hub '$IOT_HUB_NAME' が存在しません。"
    log_info "先にインフラストラクチャをデプロイしてください: ./deploy.sh $ENVIRONMENT"
    exit 1
fi

# デバイスの存在確認
if az iot hub device-identity show --hub-name "$IOT_HUB_NAME" --device-id "$DEVICE_NAME" > /dev/null 2>&1; then
    log_warning "デバイス '$DEVICE_NAME' は既に存在します。"
    read -p "上書きしますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "デバイス作成をキャンセルしました。"
        exit 0
    fi
fi

# IoT Hub デバイスの作成
log_info "IoT Hub デバイス '$DEVICE_NAME' を作成中..."
az iot hub device-identity create \
    --hub-name "$IOT_HUB_NAME" \
    --device-id "$DEVICE_NAME" \
    --edge-enabled false

if [ $? -eq 0 ]; then
    log_success "デバイス作成完了！"
    
    # デバイス情報の表示
    log_info "デバイス情報:"
    az iot hub device-identity show \
        --hub-name "$IOT_HUB_NAME" \
        --device-id "$DEVICE_NAME" \
        --query "{deviceId:deviceId, status:status, authentication:authentication}" \
        --output table
    
    # 接続文字列の取得
    log_info "接続文字列:"
    CONNECTION_STRING=$(az iot hub device-identity connection-string show \
        --hub-name "$IOT_HUB_NAME" \
        --device-id "$DEVICE_NAME" \
        --query connectionString \
        --output tsv)
    
    echo "接続文字列: $CONNECTION_STRING"
    
    # 接続文字列をファイルに保存
    CONNECTION_FILE="connection-string-${DEVICE_NAME}.txt"
    echo "$CONNECTION_STRING" > "$CONNECTION_FILE"
    log_info "接続文字列を '$CONNECTION_FILE' に保存しました。"
    
    # 次のステップ
    log_info "次のステップ:"
    log_info "1. 接続文字列を快適君デバイスに設定"
    log_info "2. MQTT クライアントで接続テスト"
    log_info "3. ダッシュボードでデータ確認"
    
else
    log_error "デバイス作成失敗"
    exit 1
fi
