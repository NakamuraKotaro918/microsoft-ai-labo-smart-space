# Microsoft AI Labo Smart Space プロジェクト - ガイド集

## 📚 **概要**

このディレクトリには、Microsoft AI Labo Smart Space プロジェクトの各種ガイド・ドキュメントが整理されています。

## 🗂️ **ガイド一覧**

### 🚀 **デプロイメントガイド**

#### **Azure デプロイメント**
- [**Azure デプロイメント概要**](./deployment/azure/overview.md) - Azure へのデプロイ方法の概要
- [**Bicep によるデプロイ**](./deployment/azure/bicep-deployment.md) - Infrastructure as Code による自動デプロイ
- [**手動デプロイ**](./deployment/azure/manual-deployment.md) - Azure CLI による手動デプロイ

#### **GitHub Actions**
- [**GitHub Secrets 設定**](./deployment/github-actions/setup.md) - Azure 認証の設定方法
- [**ワークフロー設定**](./deployment/github-actions/workflow.md) - CI/CD パイプラインの設定

#### **IoT Hub 設定**
- [**Azure IoT Hub セットアップ**](./deployment/iot-hub/setup.md) - MQTT デバイスの設定方法

### 🛠️ **開発ガイド**

#### **開発環境**
- [**クイックスタート**](./development/quickstart.md) - 開発環境の構築手順
- [**アーキテクチャ**](./development/architecture.md) - システム設計と構成

## 🔍 **ガイドの選び方**

### **初めての方**
1. [開発環境のクイックスタート](./development/quickstart.md) から始める
2. [アーキテクチャ](./development/architecture.md) でシステム構成を理解する

### **Azure にデプロイしたい方**
1. [Azure デプロイメント概要](./deployment/azure/overview.md) を読む
2. [Bicep によるデプロイ](./deployment/azure/bicep-deployment.md) で自動化
3. [GitHub Actions 設定](./deployment/github-actions/setup.md) で CI/CD を構築

### **IoT デバイスを接続したい方**
1. [Azure IoT Hub セットアップ](./deployment/iot-hub/setup.md) を参照
2. MQTT クライアントの設定を行う

## 📖 **関連ドキュメント**

- **プロジェクト概要**: [../README.md](../README.md)
- **アーキテクチャ**: [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **機能仕様**: [../機能仕様書_データ取得元.md](../機能仕様書_データ取得元.md)

## 🆘 **サポート**

- **問題が発生した場合**: [GitHub Issues](https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space/issues)
- **質問がある場合**: [GitHub Discussions](https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space/discussions)

## 📝 **ドキュメントの更新**

このガイド集は継続的に更新されています。改善提案や追加したい内容があれば、Pull Request をお送りください。

---

**最終更新**: 2024年8月21日  
**バージョン**: 1.0.0
