#!/bin/bash

# MASS プロジェクト - Azure Bicep デプロイスクリプト
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
    echo "使用方法: $0 [dev|prod] [--what-if] [--validate]"
    echo ""
    echo "引数:"
    echo "  dev|prod    デプロイ環境を指定"
    echo ""
    echo "オプション:"
    echo "  --what-if   実際のデプロイを行わず、変更内容を確認"
    echo "  --validate  テンプレートの検証のみ実行"
    echo ""
    echo "例:"
    echo "  $0 dev                    # 開発環境にデプロイ"
    echo "  $0 prod --what-if         # 本番環境の変更内容を確認"
    echo "  $0 dev --validate         # 開発環境のテンプレートを検証"
}

# 引数チェック
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

ENVIRONMENT=$1
shift

# オプション解析
WHAT_IF=false
VALIDATE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --what-if)
            WHAT_IF=true
            shift
            ;;
        --validate)
            VALIDATE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            log_error "不明なオプション: $1"
            usage
            exit 1
            ;;
    esac
done

# 環境チェック
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log_error "無効な環境: $ENVIRONMENT (dev または prod を指定してください)"
    exit 1
fi

# 設定
PROJECT_NAME="mass-smart-space"
RESOURCE_GROUP_NAME="MS-Lab-Proj-RG"
LOCATION="Japan East"
TEMPLATE_FILE="main.bicep"
PARAMETERS_FILE="parameters.${ENVIRONMENT}.json"

log_info "デプロイ設定:"
log_info "  プロジェクト: $PROJECT_NAME"
log_info "  環境: $ENVIRONMENT"
log_info "  リソースグループ: $RESOURCE_GROUP_NAME"
log_info "  ロケーション: $LOCATION"
log_info "  テンプレート: $TEMPLATE_FILE"
log_info "  パラメータ: $PARAMETERS_FILE"

# Azure CLI ログイン確認
log_info "Azure CLI ログイン状態を確認中..."
if ! az account show > /dev/null 2>&1; then
    log_error "Azure CLI にログインしていません。'az login' を実行してください。"
    exit 1
fi

# サブスクリプション情報表示
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log_info "サブスクリプション: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# リソースグループの存在確認
if az group show --name "$RESOURCE_GROUP_NAME" > /dev/null 2>&1; then
    log_info "リソースグループ '$RESOURCE_GROUP_NAME' を使用します。"
    RG_LOCATION=$(az group show --name "$RESOURCE_GROUP_NAME" --query location -o tsv)
    log_info "リソースグループのロケーション: $RG_LOCATION"
else
    log_error "リソースグループ '$RESOURCE_GROUP_NAME' が存在しません。"
    log_error "Azure管理者にリソースグループへのアクセス権限を確認してください。"
    exit 1
fi

# テンプレート検証
if [ "$VALIDATE" = true ]; then
  log_info "Bicep テンプレートを検証中..."
  az deployment group validate \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "$PARAMETERS_FILE" \
    --output table
  
  if [ $? -eq 0 ]; then
    log_success "テンプレート検証成功"
    log_info "警告があっても、デプロイは可能です"
  else
    log_error "テンプレート検証失敗"
    exit 1
  fi
  exit 0
fi

# What-if 実行
if [ "$WHAT_IF" = true ]; then
    log_info "What-if 分析を実行中..."
    az deployment group what-if \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --template-file "$TEMPLATE_FILE" \
        --parameters "$PARAMETERS_FILE"
    exit 0
fi

# 実際のデプロイ
log_info "Azure リソースのデプロイを開始..."
log_warning "この操作には数分かかる場合があります。"

az deployment group create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "$PARAMETERS_FILE" \
    --verbose

if [ $? -eq 0 ]; then
    log_success "デプロイ完了！"
    
    # デプロイ結果の表示
    log_info "デプロイ結果:"
    az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "main" \
        --query "properties.outputs" \
        --output table
    
    # リソース一覧の表示
    log_info "作成されたリソース:"
    az resource list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].{Name:name, Type:type, Location:location}" \
        --output table
    
    # 次のステップ
    log_info "次のステップ:"
    log_info "1. Azure Portal でリソースを確認: https://portal.azure.com"
    log_info "2. App Service にアプリケーションをデプロイ"
    log_info "3. IoT Hub でデバイス接続を確認"
    log_info "4. Application Insights で監視を設定"
    
else
    log_error "デプロイ失敗"
    exit 1
fi
