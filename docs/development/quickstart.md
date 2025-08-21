# 開発環境クイックスタート

## 🚀 **概要**

Microsoft AI Labo Smart Space プロジェクトの開発環境を構築する手順を説明します。

## 📋 **前提条件**

### **必要なツール**
- **Git**: バージョン管理
- **Python**: 3.8以上
- **Node.js**: 16以上（フロントエンド開発用）
- **Azure CLI**: Azure リソース管理用
- **Docker**: コンテナ化（オプション）

### **推奨環境**
- **OS**: Windows 10/11, macOS, Ubuntu 20.04+
- **メモリ**: 8GB以上
- **ストレージ**: 10GB以上の空き容量

## 🚀 **セットアップ手順**

### **1. リポジトリのクローン**

```bash
# リポジトリをクローン
git clone https://github.com/NakamuraKotaro918/microsoft-ai-labo-smart-space.git
cd microsoft-ai-labo-smart-space

# サブモジュールの初期化（存在する場合）
git submodule update --init --recursive
```

### **2. Python 環境のセットアップ**

```bash
# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

### **3. 環境変数の設定**

```bash
# 環境変数ファイルのコピー
cp env.example .env

# 環境変数の編集
# .env ファイルを編集して必要な値を設定
```

#### **必要な環境変数**
```bash
# Azure Cosmos DB
COSMOS_ENDPOINT=your_cosmos_endpoint
COSMOS_KEY=your_cosmos_key
COSMOS_DATABASE=your_database_name

# MQTT 設定
MQTT_BROKER=your_mqtt_broker
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC=your_topic
ENABLE_MQTT=true
```

### **4. フロントエンド環境のセットアップ**

```bash
# ダッシュボードディレクトリに移動
cd dashboard

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### **5. バックエンド API の起動**

```bash
# 別のターミナルで
cd azure-data-pipeline/api/dashboard-api

# 仮想環境の有効化
source ../../../venv/bin/activate

# API サーバーの起動
python app.py
```

## 🧪 **動作確認**

### **1. フロントエンドの確認**
- ブラウザで `http://localhost:3000` にアクセス
- ダッシュボードが表示されることを確認

### **2. バックエンド API の確認**
- ブラウザで `http://localhost:5000/api/health` にアクセス
- 正常なレスポンスが返されることを確認

### **3. MQTT クライアントの確認**
```bash
# テスト用パブリッシャーの実行
python test_mqtt_publisher.py
```

## 🔧 **開発ツール**

### **推奨 IDE**
- **VS Code**: Python, JavaScript, YAML サポート
- **PyCharm**: Python 開発に特化
- **WebStorm**: JavaScript/TypeScript 開発に特化

### **推奨拡張機能**
- **Python**: Python 言語サポート
- **Azure Tools**: Azure リソース管理
- **GitLens**: Git 履歴表示
- **YAML**: YAML ファイルサポート

## 📁 **プロジェクト構造**

```
microsoft-ai-labo-smart-space/
├── azure-data-pipeline/          # バックエンド API
│   ├── api/
│   │   └── dashboard-api/        # Flask API
│   ├── functions/                # Azure Functions
│   └── stream-analytics/         # Stream Analytics
├── dashboard/                    # フロントエンド
│   ├── api/                     # フロントエンド API
│   ├── scripts/                 # JavaScript ファイル
│   └── styles/                  # CSS ファイル
├── infrastructure/               # Azure Bicep テンプレート
├── docs/                        # ドキュメント
└── .github/                     # GitHub Actions
```

## 🚨 **トラブルシューティング**

### **よくある問題**

#### **1. Python 依存関係のインストールエラー**
```bash
# pip の更新
pip install --upgrade pip

# 仮想環境の再作成
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### **2. 環境変数の読み込みエラー**
```bash
# python-dotenv のインストール確認
pip install python-dotenv

# .env ファイルの存在確認
ls -la .env
```

#### **3. MQTT 接続エラー**
```bash
# MQTT ブローカーの確認
ping your_mqtt_broker

# ポートの確認
telnet your_mqtt_broker 1883
```

## 📚 **次のステップ**

### **開発の継続**
1. [アーキテクチャガイド](./architecture.md) でシステム構成を理解
2. [Azure デプロイメントガイド](../deployment/azure/overview.md) でデプロイ方法を学習
3. [GitHub Actions 設定](../deployment/github-actions/setup.md) で CI/CD を構築

### **学習リソース**
- [Flask ドキュメント](https://flask.palletsprojects.com/)
- [Azure Python SDK](https://docs.microsoft.com/python/azure/)
- [MQTT プロトコル](https://mqtt.org/)

## 🔗 **関連リンク**

- **プロジェクト概要**: [../README.md](../README.md)
- **アーキテクチャ**: [./architecture.md](./architecture.md)
- **Azure デプロイメント**: [../deployment/azure/overview.md](../deployment/azure/overview.md)

## 📞 **サポート**

問題が発生した場合や質問がある場合は、以下をご利用ください：

- **GitHub Issues**: プロジェクトの課題管理
- **GitHub Discussions**: コミュニティでの質問・議論

---

**最終更新**: 2024年8月21日  
**バージョン**: 1.0.0
