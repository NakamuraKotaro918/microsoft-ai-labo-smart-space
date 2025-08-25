# MASS プロジェクト - Microsoft AI Labo スマート空間最適化ダッシュボード

## 📋 プロジェクト概要

Microsoft AI Labo スマート空間最適化ダッシュボードは、エントランスと個人開発部屋の環境データを統合的に監視・分析するシステムです。

### 🎯 主な機能

- **エントランス監視**: SONY ITRIOS カメラによる人物認識・分析
- **環境監視**: 快適君による温湿度・CO2・照度データの収集
- **リアルタイムダッシュボード**: Webベースの統合監視画面
- **データ分析**: 行動パターン・環境最適化の分析
- **データ保存**: Azure Blob Storageによる長期データ保存
- **全文検索**: Azure AI Searchによる高度な検索・分析機能
- **デバイス管理**: Azure IoT Hubによる統合デバイス管理

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
│                    (MQTT Broker + デバイス管理)                 │
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
│                    Azure Blob Storage                          │
│                    (長期データ保存・画像保存)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure AI Search                             │
│                    (全文検索・分析)                             │
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

### 2. 開発環境のセットアップ

詳細な手順は [📚 開発ガイド](./docs/development/quickstart.md) を参照してください。

### 3. Azure インフラストラクチャのデプロイ

詳細な手順は [🚀 Azure デプロイメントガイド](./docs/deployment/azure/overview.md) を参照してください。

**注意**: このプロジェクトは、Azure管理者から提供されたリソースグループ「MS-Lab-Proj-RG」を使用します。

```bash
cd infrastructure

# 開発環境へのデプロイ
./deploy.sh dev

# 本番環境へのデプロイ
./deploy.sh prod
```

### 4. Blob Storage と AI Search のセットアップ

詳細な手順は [📦 Blob Storage と AI Search セットアップガイド](./docs/deployment/azure/blob-storage-ai-search-setup.md) を参照してください。

### 5. アプリケーションのデプロイ

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
├── docs/                          # 📚 ガイド・ドキュメント集
│   ├── README.md                  # メインガイドインデックス
│   ├── deployment/                # デプロイメントガイド
│   │   ├── azure/                 # Azure デプロイメント
│   │   │   └── blob-storage-ai-search-setup.md  # Blob Storage & AI Search セットアップ
│   │   ├── github-actions/        # GitHub Actions 設定
│   │   └── iot-hub/               # IoT Hub 設定
│   └── development/               # 開発ガイド
├── infrastructure/                 # Azure Bicep インフラストラクチャ
│   ├── main.bicep                 # メインテンプレート（Blob Storage & AI Search含む）
│   ├── parameters.dev.json        # 開発環境パラメータ
│   ├── parameters.prod.json       # 本番環境パラメータ
│   ├── deploy.sh                  # デプロイスクリプト
│   └── README.md                  # インフラストラクチャドキュメント
├── azure-data-pipeline/           # データパイプライン
│   └── api/
│       └── dashboard-api/         # Dashboard API
│           ├── app.py             # Flask アプリケーション（Blob Storage & AI Search統合）
│           ├── blob_storage.py    # Blob Storage操作モジュール
│           ├── ai_search.py       # AI Search操作モジュール
│           ├── iot_hub_manager.py # IoT Hub管理モジュール
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
- **Azure IoT Hub**: MQTT ブローカー + デバイス管理
- **Azure Cosmos DB**: NoSQL データベース
- **Azure Blob Storage**: 長期データ保存・画像保存
- **Azure AI Search**: 全文検索・分析

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
- **Azure IoT Hub**: MQTT データの受信・処理 + デバイス管理
- **Azure App Service**: API によるデータ統合
- **Azure Cosmos DB**: リアルタイムデータの永続化
- **Azure Blob Storage**: 長期保存用データの保存
- **Azure AI Search**: 検索用インデックスの作成

### 3. データ可視化
- **Web ダッシュボード**: リアルタイムデータ表示
- **Chart.js**: グラフ・チャート表示
- **レスポンシブデザイン**: モバイル対応

## 🔐 セキュリティ

- **Azure Key Vault**: シークレット管理
- **Azure AD**: 認証・認可
- **TLS/SSL**: 通信暗号化
- **RBAC**: ロールベースアクセス制御
- **Blob Storage**: 保存時暗号化
- **IoT Hub**: デバイス認証

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
- [Blob Storage & AI Search セットアップガイド](docs/deployment/azure/blob-storage-ai-search-setup.md)
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
