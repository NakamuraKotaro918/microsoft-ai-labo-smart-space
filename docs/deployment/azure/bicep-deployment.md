# Bicep による Azure デプロイ

## 🚀 **概要**

Microsoft AI Labo Smart Space プロジェクトを Azure Bicep テンプレートを使用して自動デプロイする方法を説明します。

## 📋 **前提条件**

### **必要なツール**
- Azure CLI 2.0+
- Bicep CLI
- Git
- Bash シェル

### **必要な権限**
- Azure サブスクリプションの所有者または共同作成者
- Azure AD でのサービスプリンシパル作成権限

## 🏗️ **アーキテクチャ**

### **デプロイされるリソース**
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
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Web Dashboard                               │
│                    (Static Web App)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **クイックスタート**

### **1. 環境の準備**

```bash
# Azure CLI のインストール確認
az version

# Bicep のインストール確認
az bicep version

# Azure へのログイン
az login
```

### **2. リポジトリのクローン**

```bash
git clone https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space.git
cd microsoft-ai-labo-smart-space
```

### **3. 開発環境へのデプロイ**

```bash
cd infrastructure

# テンプレートの検証
./deploy.sh dev --validate

# What-if 分析（変更内容の確認）
./deploy.sh dev --what-if

# 実際のデプロイ
./deploy.sh dev
```

### **4. 本番環境へのデプロイ**

```bash
# 本番環境へのデプロイ
./deploy.sh prod
```

## 📁 **ファイル構成**

```
infrastructure/
├── main.bicep              # メインのBicepテンプレート
├── parameters.dev.json     # 開発環境用パラメータ
├── parameters.prod.json    # 本番環境用パラメータ
├── deploy.sh               # デプロイスクリプト
└── README.md               # 詳細な説明
```

## ⚙️ **パラメータの設定**

### **開発環境 (parameters.dev.json)**
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "dev"
    },
    "appServicePlanSku": {
      "value": "B1"
    },
    "cosmosDbThroughput": {
      "value": 400
    }
  }
}
```

### **本番環境 (parameters.prod.json)**
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "prod"
    },
    "appServicePlanSku": {
      "value": "S1"
    },
    "cosmosDbThroughput": {
      "value": 1000
    }
  }
}
```

## 🔧 **デプロイスクリプトの使用方法**

### **基本的な使用方法**
```bash
./deploy.sh [environment] [options]
```

### **オプション**
- `--validate`: テンプレートの検証のみ実行
- `--what-if`: 変更内容の確認（What-if 分析）
- `--help`: ヘルプの表示

### **例**
```bash
# 開発環境の検証
./deploy.sh dev --validate

# 本番環境のWhat-if分析
./deploy.sh prod --what-if

# 開発環境のデプロイ
./deploy.sh dev
```

## 📊 **デプロイの監視**

### **Azure ポータルでの確認**
1. [Azure ポータル](https://portal.azure.com) にアクセス
2. リソースグループ `rg-mass-smart-space-[environment]` を確認
3. 各リソースの状態を確認

### **ログの確認**
```bash
# デプロイログの確認
az deployment group show \
  --resource-group "rg-mass-smart-space-dev" \
  --name "deployment-[timestamp]"

# リソースの一覧表示
az resource list \
  --resource-group "rg-mass-smart-space-dev" \
  --output table
```

## 🚨 **トラブルシューティング**

### **よくある問題**

#### **1. Bicep テンプレートの検証エラー**
```bash
# Bicep のバージョン確認
az bicep version

# 必要に応じて更新
az bicep upgrade
```

#### **2. 権限不足エラー**
```bash
# 現在のユーザーの権限確認
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

#### **3. リソース名の重複エラー**
- リソース名に一意の識別子を追加
- タイムスタンプやランダム文字列を使用

### **デバッグ方法**
```bash
# 詳細なログ出力
./deploy.sh dev --verbose

# 特定のリソースの状態確認
az resource show \
  --name "app-mass-smart-space-dev" \
  --resource-group "rg-mass-smart-space-dev" \
  --resource-type "Microsoft.Web/sites"
```

## 🔐 **セキュリティのベストプラクティス**

### **シークレット管理**
- 機密情報は Azure Key Vault に保存
- 環境変数に直接記述しない
- サービスプリンシパルの権限を最小限に設定

### **ネットワークセキュリティ**
- 必要最小限のポートのみ開放
- プライベートエンドポイントの使用を検討
- ネットワークセキュリティグループの設定

## 📈 **コスト最適化**

### **開発環境**
- Basic プランを使用
- 必要最小限のリソースのみデプロイ
- 自動シャットダウンの設定

### **本番環境**
- 適切な SKU を選択
- 自動スケーリングの設定
- 使用していないリソースの削除

## 🔗 **関連リンク**

- [Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure CLI ドキュメント](https://docs.microsoft.com/cli/azure/)
- [Azure Resource Manager ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/)

## 📞 **サポート**

問題が発生した場合や質問がある場合は、以下をご利用ください：

- **GitHub Issues**: プロジェクトの課題管理
- **Azure サポート**: 有料サポート（サブスクリプションに含まれる場合）
- **コミュニティ**: Stack Overflow, Microsoft Q&A

---

**最終更新**: 2024年8月21日  
**バージョン**: 1.0.0
