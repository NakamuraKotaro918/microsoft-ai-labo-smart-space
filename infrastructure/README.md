# MASS プロジェクト - Azure インフラストラクチャ

Microsoft AI Labo スマート空間最適化ダッシュボードのAzureインフラストラクチャを管理するためのBicepテンプレートです。

## 📋 概要

このプロジェクトは以下のAzureリソースをデプロイします：

- **Azure IoT Hub** - 快適君からのMQTTデータ受信
- **Azure Cosmos DB** - センサーデータと分析データの保存
- **Azure App Service** - Dashboard API のホスティング
- **Azure PostgreSQL** - リレーショナルデータの保存
- **Azure Storage Account** - 静的ファイルの保存
- **Application Insights** - アプリケーション監視
- **Azure CDN** - コンテンツ配信
- **Azure Key Vault** - シークレット管理

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   快適君        │    │   SONY ITRIOS   │    │   SmartPhone    │
│   (MQTT)        │    │   (HTTP/API)    │    │   (HTTP/API)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure IoT Hub                               │
│                    (MQTT Broker)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure App Service                           │
│                    (Dashboard API)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Cosmos DB                             │
│                    (NoSQL Database)                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure CDN                                   │
│                    (Content Delivery)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Web Dashboard                               │
│                    (Static Web App)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

1. **Azure CLI** がインストールされている
2. **Azure サブスクリプション** にアクセス権限がある
3. **Bicep CLI** がインストールされている

```bash
# Azure CLI のインストール確認
az version

# Bicep のインストール確認
az bicep version

# Azure へのログイン
az login
```

### 1. リポジトリのクローン

```bash
git clone <your-repository-url>
cd microsoft-ai-labo-smart-space
```

### 2. 開発環境へのデプロイ

```bash
cd infrastructure

# テンプレートの検証
./deploy.sh dev --validate

# What-if 分析（変更内容の確認）
./deploy.sh dev --what-if

# 実際のデプロイ
./deploy.sh dev
```

### 3. 本番環境へのデプロイ

```bash
# What-if 分析
./deploy.sh prod --what-if

# 実際のデプロイ
./deploy.sh prod
```

## 📁 ファイル構成

```
infrastructure/
├── main.bicep              # メインBicepテンプレート
├── parameters.dev.json     # 開発環境用パラメータ
├── parameters.prod.json    # 本番環境用パラメータ
├── deploy.sh              # デプロイスクリプト
└── README.md              # このファイル
```

## ⚙️ パラメータ

### 共通パラメータ

| パラメータ | 説明 | デフォルト値 |
|-----------|------|-------------|
| `projectName` | プロジェクト名 | `mass-smart-space` |
| `environment` | 環境名 | `dev` / `prod` |
| `location` | Azure リージョン | `Japan East` |
| `adminPassword` | 管理者パスワード | 必須 |

### リソース固有パラメータ

| パラメータ | 説明 | デフォルト値 |
|-----------|------|-------------|
| `cosmosAccountName` | Cosmos DB アカウント名 | `cosmos{projectName}{env}` |
| `iotHubName` | IoT Hub 名 | `iot{projectName}{env}` |
| `appServicePlanSku` | App Service Plan SKU | `B1` (dev) / `S1` (prod) |
| `postgresqlServerName` | PostgreSQL サーバー名 | `psql{projectName}{env}` |
| `storageAccountName` | Storage Account 名 | `st{projectName}{env}` |

## 🔧 カスタマイズ

### 新しい環境の追加

1. 新しいパラメータファイルを作成
   ```bash
   cp parameters.dev.json parameters.staging.json
   ```

2. パラメータ値を環境に合わせて編集

3. デプロイスクリプトに新しい環境を追加

### リソースの追加

1. `main.bicep` に新しいリソースを追加
2. 必要に応じてパラメータを追加
3. 出力値を追加（必要に応じて）

## 🔍 デプロイの確認

### Azure Portal での確認

1. [Azure Portal](https://portal.azure.com) にアクセス
2. リソースグループ `rg-mass-smart-space-{environment}` を確認
3. 各リソースの状態を確認

### Azure CLI での確認

```bash
# リソースグループの確認
az group show --name rg-mass-smart-space-dev

# リソース一覧の確認
az resource list --resource-group rg-mass-smart-space-dev

# デプロイ履歴の確認
az deployment group list --resource-group rg-mass-smart-space-dev
```

## 🛠️ トラブルシューティング

### よくある問題

1. **リソース名の重複**
   - エラー: `The resource name is already taken`
   - 解決策: パラメータファイルでリソース名を変更

2. **権限不足**
   - エラー: `Authorization failed`
   - 解決策: 適切な権限を持つアカウントでログイン

3. **リージョンの制限**
   - エラー: `The resource provider is not registered`
   - 解決策: 別のリージョンを試す

### ログの確認

```bash
# デプロイログの確認
az deployment group show \
  --resource-group rg-mass-smart-space-dev \
  --name main \
  --query "properties.error"

# リソースの詳細ログ
az monitor activity-log list \
  --resource-group rg-mass-smart-space-dev \
  --max-events 10
```

## 🔐 セキュリティ

### 推奨事項

1. **パスワードの管理**
   - 本番環境では強力なパスワードを使用
   - Key Vault でシークレットを管理

2. **ネットワークセキュリティ**
   - 必要最小限のポートのみ開放
   - プライベートエンドポイントの使用を検討

3. **アクセス制御**
   - RBAC で適切な権限を設定
   - サービスプリンシパルの使用

### セキュリティ設定

```bash
# Key Vault にシークレットを保存
az keyvault secret set \
  --vault-name kv-masssmartspacedev \
  --name admin-password \
  --value "your-secure-password"

# パラメータファイルで Key Vault 参照を使用
{
  "adminPassword": {
    "reference": {
      "keyVault": {
        "id": "/subscriptions/{subscription-id}/resourceGroups/rg-mass-smart-space-dev/providers/Microsoft.KeyVault/vaults/kv-masssmartspacedev"
      },
      "secretName": "admin-password"
    }
  }
}
```

## 📊 コスト管理

### コスト最適化

1. **開発環境**
   - Basic SKU の使用
   - 自動シャットダウンの設定

2. **本番環境**
   - 適切な SKU の選択
   - リソースの自動スケーリング

### コスト監視

```bash
# リソースグループのコスト確認
az consumption usage list \
  --resource-group rg-mass-smart-space-dev \
  --start-date 2024-01-01 \
  --end-date 2024-01-31
```

## 🔄 CI/CD

### GitHub Actions

このプロジェクトには GitHub Actions ワークフローが含まれています：

- **自動検証**: プルリクエスト時にテンプレートを検証
- **自動デプロイ**: 開発環境（develop ブランチ）、本番環境（main ブランチ）
- **What-if 分析**: 変更内容の事前確認

### 手動デプロイ

```bash
# 開発環境
./deploy.sh dev

# 本番環境
./deploy.sh prod
```

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. [Azure Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
2. [Azure CLI ドキュメント](https://docs.microsoft.com/cli/azure/)
3. [GitHub Issues](https://github.com/your-repo/issues)

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
