# Azure デプロイメント概要

## 🚀 **概要**

Microsoft AI Labo Smart Space プロジェクトを Azure にデプロイする方法を説明します。

## 📋 **デプロイ方法の選択**

### **1. Infrastructure as Code (推奨)**
- **Bicep テンプレート**を使用した自動デプロイ
- 環境の再現性が高い
- バージョン管理が可能
- CI/CD パイプラインとの統合が容易

### **2. 手動デプロイ**
- Azure CLI を使用した手動デプロイ
- 学習・テスト用途に適している
- 柔軟なカスタマイズが可能

### **3. GitHub Actions による自動化**
- コード変更時の自動デプロイ
- 環境別の管理（開発・本番）
- ロールバック機能

## 🏗️ **デプロイされるリソース**

### **コンピューティング**
- **Azure App Service Plan**: アプリケーションの実行環境
- **Azure App Service**: Web API のホスティング
- **Azure Static Web Apps**: フロントエンドのホスティング

### **データベース**
- **Azure Cosmos DB**: センサーデータの保存
- **Azure PostgreSQL**: メタデータの保存

### **IoT サービス**
- **Azure IoT Hub**: MQTT デバイスとの通信
- **Azure Stream Analytics**: リアルタイムデータ処理

### **ストレージ**
- **Azure Storage Account**: 静的ファイル・ログの保存
- **Azure CDN**: コンテンツ配信の最適化

### **監視・セキュリティ**
- **Application Insights**: アプリケーション監視
- **Azure Key Vault**: シークレット管理
- **Log Analytics**: ログ分析

## 🔧 **前提条件**

### **必要なツール**
- Azure CLI 2.0+
- Bicep CLI
- Git
- Python 3.8+

### **必要な権限**
- Azure サブスクリプションの所有者または共同作成者
- Azure AD でのサービスプリンシパル作成権限

## 📚 **詳細ガイド**

### **Bicep によるデプロイ**
詳細な手順は [Bicep によるデプロイ](./bicep-deployment.md) を参照してください。

### **手動デプロイ**
詳細な手順は [手動デプロイ](./manual-deployment.md) を参照してください。

## 🚨 **注意事項**

### **コスト管理**
- 開発環境では Basic プランを使用
- 本番環境では Standard プラン以上を推奨
- 使用していないリソースは削除

### **セキュリティ**
- 本番環境では Key Vault を使用
- 環境変数に機密情報を含めない
- ネットワークアクセス制限を設定

### **スケーラビリティ**
- 初期は小規模で開始
- 負荷に応じてスケールアップ
- 自動スケーリングの設定

## 🔗 **関連リンク**

- [Azure ポータル](https://portal.azure.com)
- [Azure CLI ドキュメント](https://docs.microsoft.com/cli/azure/)
- [Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure App Service ドキュメント](https://docs.microsoft.com/azure/app-service/)

## 📞 **サポート**

問題が発生した場合や質問がある場合は、以下をご利用ください：

- **GitHub Issues**: プロジェクトの課題管理
- **Azure サポート**: 有料サポート（サブスクリプションに含まれる場合）
- **コミュニティ**: Stack Overflow, Microsoft Q&A

---

**最終更新**: 2024年8月21日  
**バージョン**: 1.0.0
