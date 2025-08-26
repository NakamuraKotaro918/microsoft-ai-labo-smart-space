#!/bin/bash

# MASS プロジェクト デプロイスクリプト
# MSLab-test リソースグループにデプロイ

set -e

# 設定
RESOURCE_GROUP="MSLab-test"
TEMPLATE_FILE="infrastructure/main.bicep"
PARAMETERS_FILE="infrastructure/parameters.json"
SERVICE_PRINCIPAL_NAME="my-local-deploy-sp"

echo "=== MASS プロジェクト デプロイ開始 ==="
echo "リソースグループ: $RESOURCE_GROUP"
echo "テンプレートファイル: $TEMPLATE_FILE"
echo "パラメータファイル: $PARAMETERS_FILE"
echo ""

# 1. サービスプリンシパルの情報を確認
echo "1. サービスプリンシパルの情報を確認中..."
SP_INFO=$(az ad sp list --display-name "$SERVICE_PRINCIPAL_NAME" --query "[0].{appId:appId, objectId:id}" --output json)
if [ "$SP_INFO" == "null" ]; then
    echo "エラー: サービスプリンシパル '$SERVICE_PRINCIPAL_NAME' が見つかりません"
    exit 1
fi
echo "✓ サービスプリンシパルが見つかりました"

# 2. リソースグループの存在確認
echo ""
echo "2. リソースグループの存在を確認中..."
if ! az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "エラー: リソースグループ '$RESOURCE_GROUP' が存在しません"
    exit 1
fi
echo "✓ リソースグループ '$RESOURCE_GROUP' が存在します"

# 3. サービスプリンシパルの権限確認
echo ""
echo "3. サービスプリンシパルの権限を確認中..."
SP_APP_ID=$(az ad sp list --display-name "$SERVICE_PRINCIPAL_NAME" --query "[0].appId" --output tsv)
ROLE_ASSIGNMENTS=$(az role assignment list --assignee "$SP_APP_ID" --resource-group "$RESOURCE_GROUP" --query "[?roleDefinitionName=='Contributor']" --output json)
if [ "$ROLE_ASSIGNMENTS" == "[]" ]; then
    echo "警告: サービスプリンシパルにContributor権限が付与されていません"
    echo "権限を付与してください:"
    echo "az role assignment create --assignee '$SP_APP_ID' --role 'Contributor' --resource-group '$RESOURCE_GROUP'"
    exit 1
fi
echo "✓ サービスプリンシパルにContributor権限が付与されています"

# 4. リソースプロバイダーの確認
echo ""
echo "4. 必要なリソースプロバイダーを確認中..."
REQUIRED_PROVIDERS=(
    "Microsoft.DocumentDB"
    "Microsoft.Devices"
    "Microsoft.Web"
    "Microsoft.DBforPostgreSQL"
    "Microsoft.Storage"
    "Microsoft.Search"
    "Microsoft.Insights"
    "Microsoft.OperationalInsights"
    "Microsoft.Cdn"
    "Microsoft.KeyVault"
)

for provider in "${REQUIRED_PROVIDERS[@]}"; do
    STATE=$(az provider show --namespace "$provider" --query "registrationState" --output tsv)
    if [ "$STATE" != "Registered" ]; then
        echo "警告: $provider が登録されていません (状態: $STATE)"
        echo "登録中: $provider"
        az provider register --namespace "$provider"
    else
        echo "✓ $provider は登録済み"
    fi
done

# 5. テンプレートの検証
echo ""
echo "5. テンプレートを検証中..."
VALIDATION_OUTPUT=$(az deployment group validate --resource-group "$RESOURCE_GROUP" --template-file "$TEMPLATE_FILE" --parameters "@$PARAMETERS_FILE" 2>&1)
if echo "$VALIDATION_OUTPUT" | grep -q "error"; then
    echo "エラー: テンプレートの検証に失敗しました"
    echo "$VALIDATION_OUTPUT"
    exit 1
fi
echo "✓ テンプレートの検証が完了しました"

# 6. デプロイの実行
echo ""
echo "6. デプロイを実行中..."
echo "注意: この処理には数分かかる場合があります..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "@$PARAMETERS_FILE" \
    --verbose

echo ""
echo "=== デプロイが完了しました ==="
echo ""
echo "デプロイ結果の確認:"
echo "az deployment group show --resource-group '$RESOURCE_GROUP' --name 'main'"
echo ""
echo "作成されたリソースの確認:"
echo "az resource list --resource-group '$RESOURCE_GROUP' --output table"
