# Microsoft AI Labo スマート空間最適化システム アーキテクチャ

## システム概要

SONY AITRIOS、Google Gemini API、快適君からリアルタイムデータを収集し、Azureクラウド上で処理・分析して、ダッシュボードで可視化するスマート空間最適化システムです。

## アーキテクチャ図

```mermaid
graph TB
    %% 外部データソース
    subgraph "外部データソース"
        AITRIOS[SONY AITRIOS<br/>人物検知・分析]
        GEMINI[Google Gemini API<br/>行動・感情分析]
        KAITEKI[快適君<br/>環境センサー]
    end

    %% Azure Functions
    subgraph "データ収集層"
        FUNCTIONS[Azure Functions<br/>データ収集・正規化]
    end

    %% Event Hub
    subgraph "ストリーミング層"
        EVENTHUB[Azure Event Hub<br/>リアルタイムデータストリーミング]
    end

    %% Stream Analytics
    subgraph "リアルタイム処理層"
        STREAM[Azure Stream Analytics<br/>リアルタイムデータ処理・分析]
    end

    %% Cosmos DB
    subgraph "データストレージ層"
        COSMOS[Azure Cosmos DB<br/>NoSQL データベース]
        subgraph "コンテナ"
            SENSOR[センサーデータ]
            ANALYSIS[分析データ]
            USERS[ユーザーデータ]
        end
    end

    %% API Server
    subgraph "API層"
        API[Azure App Service<br/>REST API]
    end

    %% Static Web Apps
    subgraph "フロントエンド層"
        STATIC[Azure Static Web Apps<br/>ダッシュボードUI]
    end

    %% 監視・セキュリティ
    subgraph "監視・セキュリティ"
        INSIGHTS[Application Insights<br/>監視・ログ]
        KEYVAULT[Azure Key Vault<br/>シークレット管理]
    end

    %% データフロー
    AITRIOS --> FUNCTIONS
    GEMINI --> FUNCTIONS
    KAITEKI --> FUNCTIONS
    
    FUNCTIONS --> EVENTHUB
    EVENTHUB --> STREAM
    STREAM --> COSMOS
    
    COSMOS --> API
    API --> STATIC
    
    %% 監視・セキュリティ接続
    FUNCTIONS -.-> INSIGHTS
    API -.-> INSIGHTS
    STATIC -.-> INSIGHTS
    
    FUNCTIONS -.-> KEYVAULT
    API -.-> KEYVAULT
    STREAM -.-> KEYVAULT

    %% スタイル
    classDef external fill:#ff9999,stroke:#333,stroke-width:2px
    classDef azure fill:#0078d4,stroke:#333,stroke-width:2px,color:#fff
    classDef storage fill:#00a1f1,stroke:#333,stroke-width:2px,color:#fff
    classDef monitoring fill:#68217a,stroke:#333,stroke-width:2px,color:#fff

    class AITRIOS,GEMINI,KAITEKI external
    class FUNCTIONS,EVENTHUB,STREAM,API,STATIC azure
    class COSMOS,SENSOR,ANALYSIS,USERS storage
    class INSIGHTS,KEYVAULT monitoring
```

## 詳細アーキテクチャ

### 1. データ収集層

```mermaid
sequenceDiagram
    participant AITRIOS as SONY AITRIOS
    participant GEMINI as Google Gemini
    participant KAITEKI as 快適君
    participant FUNCTIONS as Azure Functions
    participant EVENTHUB as Event Hub

    AITRIOS->>FUNCTIONS: 人物検知データ
    GEMINI->>FUNCTIONS: 行動分析データ
    KAITEKI->>FUNCTIONS: 環境センサーデータ
    
    FUNCTIONS->>FUNCTIONS: データ正規化
    FUNCTIONS->>EVENTHUB: 正規化データ送信
```

### 2. リアルタイム処理層

```mermaid
flowchart LR
    subgraph "Stream Analytics クエリ"
        INPUT[Event Hub 入力]
        PROCESS[リアルタイム処理]
        OUTPUT1[Cosmos DB 出力]
        OUTPUT2[異常検知アラート]
        
        INPUT --> PROCESS
        PROCESS --> OUTPUT1
        PROCESS --> OUTPUT2
    end
```

### 3. データフロー詳細

```mermaid
graph LR
    subgraph "データソース"
        A[SONY AITRIOS<br/>人物数・年齢・性別]
        B[Google Gemini<br/>行動・感情分析]
        C[快適君<br/>温度・湿度・CO2]
    end
    
    subgraph "データ処理"
        D[Azure Functions<br/>データ正規化]
        E[Event Hub<br/>ストリーミング]
        F[Stream Analytics<br/>リアルタイム分析]
        G[Cosmos DB<br/>データ保存]
    end
    
    subgraph "API・フロントエンド"
        H[App Service<br/>REST API]
        I[Static Web Apps<br/>ダッシュボード]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
```

## 技術スタック

### フロントエンド
- **Azure Static Web Apps**: ダッシュボードUI
- **HTML/CSS/JavaScript**: フロントエンド実装
- **Chart.js**: グラフ・チャート表示

### バックエンド
- **Azure Functions**: サーバーレスデータ収集
- **Azure App Service**: REST APIサーバー
- **Python/Flask**: API実装

### データ処理
- **Azure Event Hub**: リアルタイムデータストリーミング
- **Azure Stream Analytics**: リアルタイムデータ処理
- **Azure Cosmos DB**: NoSQLデータベース

### 監視・セキュリティ
- **Azure Application Insights**: 監視・ログ
- **Azure Key Vault**: シークレット管理
- **Azure Active Directory**: 認証・認可

## データモデル

### センサーデータ（Cosmos DB - sensor-data）

```json
{
  "id": "uuid",
  "source": "aitrios|gemini|kaiteki",
  "timestamp": "2024-01-01T12:00:00Z",
  "deviceId": "device-001",
  "deviceType": "aitrios",
  "data": {
    "personCount": 5,
    "ageDistribution": [35, 40, 20, 5],
    "genderDistribution": [55, 40, 5],
    "confidence": 0.95
  },
  "type": "sensor_data"
}
```

### 分析データ（Cosmos DB - analysis-data）

```json
{
  "id": "window-timestamp",
  "deviceType": "aitrios",
  "messageCount": 100,
  "avgConfidence": 0.92,
  "totalPersonCount": 25,
  "avgTemperature": 22.5,
  "avgHumidity": 55,
  "avgCO2": 450,
  "anomalyStatus": "Normal"
}
```

## セキュリティ設計

### 認証・認可
- **Azure AD**: ユーザー認証
- **API Keys**: 外部API連携
- **CORS**: クロスオリジン制御

### データ保護
- **Azure Key Vault**: シークレット管理
- **暗号化**: 保存時・転送時
- **ネットワークセキュリティ**: VNet統合

## スケーラビリティ

### 水平スケーリング
- **Event Hub**: パーティション分割
- **Cosmos DB**: 自動スケーリング
- **Functions**: サーバーレス自動スケール

### パフォーマンス
- **CDN**: グローバル配信
- **キャッシュ**: Redis Cache
- **負荷分散**: Application Gateway

## 監視・運用

### 監視項目
- **アプリケーション**: レスポンス時間、エラー率
- **インフラ**: CPU、メモリ、ディスク使用率
- **データ**: 処理量、遅延時間

### アラート
- **異常検知**: 環境値の異常
- **パフォーマンス**: レスポンス時間の悪化
- **可用性**: サービスの停止

## 料金見積もり

### 開発・テスト環境（Free プラン）
- **Static Web Apps**: ¥0
- **Event Hub**: ¥0 (100万メッセージ/月)
- **Cosmos DB**: ¥0 (1000 RU/秒)
- **Functions**: ¥0 (100万実行/月)
- **Stream Analytics**: ¥0 (1時間/月)

### 本格運用環境
- **Event Hub**: ¥1,000-5,000/月
- **Cosmos DB**: ¥5,000-20,000/月
- **Functions**: ¥1,000-3,000/月
- **Stream Analytics**: ¥10,000-30,000/月
- **App Service**: ¥1,000-5,000/月

## 今後の拡張性

### 機能拡張
- **機械学習**: Azure Machine Learning統合
- **予測分析**: 来場者数予測
- **最適化**: 空調・照明制御

### 統合拡張
- **IoT Hub**: デバイス管理
- **Power BI**: 高度な分析・レポート
- **Logic Apps**: ワークフロー自動化
