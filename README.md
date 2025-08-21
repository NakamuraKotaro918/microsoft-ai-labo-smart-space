# MASS プロジェクト - Microsoft AI Labo スマート空間最適化ダッシュボード

## 📋 プロジェクト概要

Microsoft AI Labo スマート空間最適化ダッシュボードは、エントランスと個人開発部屋の環境データを統合的に監視・分析するシステムです。

### 🎯 主な機能

- **エントランス監視**: SONY ITRIOS カメラによる人物認識・分析
- **環境監視**: 快適君による温湿度・CO2・照度データの収集
- **リアルタイムダッシュボード**: Webベースの統合監視画面
- **データ分析**: 行動パターン・環境最適化の分析

## 🏗️ システムアーキテクチャ

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
│                    Web Dashboard                               │
│                    (Static Web App)                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 クイックスタート

### 前提条件

- Azure CLI がインストールされている
- Azure サブスクリプションにアクセス権限がある
- Bicep CLI がインストールされている

### 1. リポジトリのクローン

```bash
git clone https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space.git
cd microsoft-ai-labo-smart-space
```

### 2. Azure インフラストラクチャのデプロイ

```bash
cd infrastructure

# 開発環境へのデプロイ
./deploy.sh dev

# 本番環境へのデプロイ
./deploy.sh prod
```

### 3. アプリケーションのデプロイ

```bash
# API アプリケーションのデプロイ
cd azure-data-pipeline/api/dashboard-api
# Azure App Service にデプロイ

# ダッシュボードのデプロイ
cd dashboard
# Azure Static Web Apps にデプロイ
```

## 📁 プロジェクト構成

```
microsoft-ai-labo-smart-space/
├── infrastructure/                 # Azure Bicep インフラストラクチャ
│   ├── main.bicep                 # メインテンプレート
│   ├── parameters.dev.json        # 開発環境パラメータ
│   ├── parameters.prod.json       # 本番環境パラメータ
│   ├── deploy.sh                  # デプロイスクリプト
│   └── README.md                  # インフラストラクチャドキュメント
├── azure-data-pipeline/           # データパイプライン
│   └── api/
│       └── dashboard-api/         # Dashboard API
│           ├── app.py             # Flask アプリケーション
│           ├── mqtt_client.py     # MQTT クライアント
│           ├── requirements.txt   # Python 依存関係
│           └── README_MQTT.md     # MQTT ドキュメント
├── dashboard/                     # Web ダッシュボード
│   ├── index.html                # メインHTML
│   ├── styles/                   # CSS スタイル
│   ├── scripts/                  # JavaScript
│   └── README.md                 # ダッシュボードドキュメント
├── .github/
│   └── workflows/                # GitHub Actions CI/CD
│       └── deploy-azure.yml      # Azure デプロイワークフロー
└── README.md                     # このファイル
```

## 🔧 技術スタック

### フロントエンド
- **HTML5/CSS3/JavaScript**: モダンなWeb技術
- **Chart.js**: データ可視化ライブラリ
- **Azure Static Web Apps**: ホスティング

### バックエンド
- **Python Flask**: API サーバー
- **Azure App Service**: ホスティング
- **Azure IoT Hub**: MQTT ブローカー
- **Azure Cosmos DB**: NoSQL データベース

### インフラストラクチャ
- **Azure Bicep**: インフラストラクチャ・アズ・コード
- **Azure CLI**: デプロイメントツール
- **GitHub Actions**: CI/CD パイプライン

## 📊 データフロー

### 1. センサーデータ収集
- **快適君**: MQTT プロトコルで環境データを送信
- **SONY ITRIOS**: HTTP/API で人物認識データを送信
- **SmartPhone**: HTTP/API で行動分析データを送信

### 2. データ処理
- **Azure IoT Hub**: MQTT データの受信・処理
- **Azure App Service**: API によるデータ統合
- **Azure Cosmos DB**: データの永続化

### 3. データ可視化
- **Web ダッシュボード**: リアルタイムデータ表示
- **Chart.js**: グラフ・チャート表示
- **レスポンシブデザイン**: モバイル対応

## 🔐 セキュリティ

- **Azure Key Vault**: シークレット管理
- **Azure AD**: 認証・認可
- **TLS/SSL**: 通信暗号化
- **RBAC**: ロールベースアクセス制御

## 📈 監視・ログ

- **Application Insights**: アプリケーション監視
- **Azure Monitor**: インフラストラクチャ監視
- **Log Analytics**: ログ分析
- **Azure CDN**: パフォーマンス最適化

## 🚀 デプロイメント

### 自動デプロイ (GitHub Actions)

1. **develop ブランチ**: 開発環境に自動デプロイ
2. **main ブランチ**: 本番環境に自動デプロイ
3. **プルリクエスト**: テンプレート検証・What-if 分析

### 手動デプロイ

```bash
# 開発環境
cd infrastructure
./deploy.sh dev

# 本番環境
cd infrastructure
./deploy.sh prod
```

## 🛠️ 開発環境

### ローカル開発

```bash
# API サーバーの起動
cd azure-data-pipeline/api/dashboard-api
pip install -r requirements.txt
python app.py

# ダッシュボードの起動
cd dashboard
python simple-server.py
```

### テスト

```bash
# MQTT テストパブリッシャー
cd azure-data-pipeline/api/dashboard-api
python test_mqtt_publisher.py

# Bicep テンプレート検証
cd infrastructure
./deploy.sh dev --validate
```

## 📚 ドキュメント

- [インフラストラクチャガイド](infrastructure/README.md)
- [MQTT クライアントガイド](azure-data-pipeline/api/dashboard-api/README_MQTT.md)
- [Azure IoT Hub セットアップ](azure-data-pipeline/api/dashboard-api/azure_iot_hub_setup.md)
- [ダッシュボードガイド](dashboard/README.md)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 📞 サポート

問題や質問がある場合は、以下をご確認ください：

1. [GitHub Issues](https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space/issues)
2. [Azure ドキュメント](https://docs.microsoft.com/azure/)
3. [Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

## 🎉 謝辞

- Microsoft AI Labo チーム
- Azure サービスチーム
- オープンソースコミュニティ
