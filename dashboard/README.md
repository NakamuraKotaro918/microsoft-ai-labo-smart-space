# Microsoft AI Labo スマート空間最適化ダッシュボード

## 概要

Microsoft AI Laboのエントランスおよび個人開発部屋における空間利用状況と環境データを可視化するWebダッシュボードです。

## 🚀 簡単な起動方法

### 方法1: 起動スクリプトを使用（推奨）

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

### 方法2: 直接Pythonで起動

```bash
python3 simple-server.py
```

または

```bash
python simple-server.py
```

### 3. ブラウザでアクセス

```
http://localhost:8000
```

## 📋 必要な環境

- **Python 3.6以上**
- **モダンなWebブラウザ**（Chrome, Firefox, Safari, Edge）

## 🎯 機能

### エントランスモニター
- **リアルタイム統計**
  - 現在の来場者数
  - 本日の累計来場者数
  - 平均滞在時間

- **SONY ITRIOS 人物認識**
  - 個別人物の年齢・性別検出
  - 認識精度表示
  - リアルタイム人物リスト

- **SmartPhone + Google Gemini 人物特徴分析**
  - 行動パターン分析
  - 感情・特徴認識
  - インタラクション分析

- **来場者属性分析**
  - 年齢層分布（ドーナツチャート）
  - 性別分布（ドーナツチャート）

- **時系列分析**
  - 時間別来場者数（折れ線グラフ）

- **統合行動パターン分析**
  - 展示物への関心度
  - 平均移動距離
  - グループ行動率
  - 滞在時間分析

### 個人開発部屋モニター
- **環境データ**
  - 温度（°C）
  - 湿度（%）
  - CO2濃度（ppm）
  - 利用状況（在室/不在）

- **環境データトレンド**
  - 温度・湿度トレンド（24時間）
  - CO2濃度トレンド（24時間）

- **利用率分析**
  - 部屋利用率（週間）

- **空調最適化提案**
  - 温度調整提案
  - 換気推奨
  - 照明最適化

## 技術仕様

### フロントエンド
- **HTML5** - セマンティックマークアップ
- **CSS3** - レスポンシブデザイン、グラデーション、アニメーション
- **JavaScript (ES6+)** - モジュラー設計
- **Chart.js** - データ可視化ライブラリ

### データ通信
- **WebSocket** - リアルタイムデータ更新
- **REST API** - データ取得（フォールバック）
- **MQTT(S)** - センサーデータ収集（バックエンド）

### 対応デバイス
- デスクトップブラウザ
- タブレット
- スマートフォン（レスポンシブ対応）

## ファイル構成

```
dashboard/
├── index.html              # メインHTMLファイル
├── styles/
│   └── main.css            # メインスタイルシート
├── scripts/
│   ├── main.js             # メインアプリケーション制御
│   ├── charts.js           # チャート管理
│   └── data-service.js     # データサービス
└── README.md               # このファイル
```

## セットアップ

### 1. ファイルの配置
```bash
# プロジェクトルートに移動
cd /root/microsoft-ai-labo-smart-space

# ダッシュボードファイルが正しく配置されていることを確認
ls -la dashboard/
```

### 2. Webサーバーの起動
```bash
# 簡易HTTPサーバーの起動（Python 3の場合）
cd dashboard
python3 -m http.server 8000

# または Node.js の場合
npx http-server -p 8000
```

### 3. ブラウザでアクセス
```
http://localhost:8000
```

## データソース連携

### センサーデータ
- **快適君（温湿度CO2センサ）**: MQTT(S)プロトコル
- **SONY ITRIOS カメラ**: 人物認識API
- **SmartPhone カメラ**: Google Gemini API

### API エンドポイント
```
GET /api/entrance/current    # エントランス現在データ
GET /api/room/environment    # 個人開発部屋環境データ
WS  /ws                      # WebSocketリアルタイム更新
```

## カスタマイズ

### 1. データ更新間隔の変更
```javascript
// scripts/main.js
this.updateInterval = 30000; // ミリ秒単位（デフォルト: 30秒）
```

### 2. チャートの色変更
```javascript
// scripts/charts.js
backgroundColor: [
    '#3498db',  // 青
    '#e74c3c',  // 赤
    '#f39c12',  // オレンジ
    '#9b59b6'   // 紫
]
```

### 3. 閾値の設定
```javascript
// scripts/data-service.js
// CO2濃度の警告レベル
const CO2_WARNING_LEVEL = 600;  // ppm
const CO2_DANGER_LEVEL = 800;   // ppm
```

## トラブルシューティング

### WebSocket接続エラー
1. WebSocketサーバーが起動していることを確認
2. ファイアウォール設定を確認
3. ブラウザの開発者ツールでエラーログを確認

### チャートが表示されない
1. Chart.js ライブラリが正しく読み込まれているか確認
2. Canvas要素のIDが正しく設定されているか確認
3. ブラウザのJavaScriptが有効になっているか確認

### データが更新されない
1. APIエンドポイントが正しく設定されているか確認
2. CORS設定を確認
3. ネットワーク接続を確認

## 開発者向け情報

### クラス構造
- **SmartSpaceDashboard**: メインアプリケーション制御
- **ChartManager**: チャート管理と設定
- **DataService**: データ取得とWebSocket通信

### イベント
- **dataUpdate**: データ更新時に発火
- **connectionStatusChange**: 接続状態変更時に発火

### デバッグモード
```javascript
// ブラウザコンソールで実行
window.dashboard.dataService.sendTestData('entrance', {
    currentVisitors: 10,
    dailyVisitors: 200
});
```

## ライセンス

このプロジェクトは旭光電機株式会社の所有物です。

## 更新履歴

- **v1.0.0** (2025-08-04): 初回リリース
  - エントランスモニター機能
  - 個人開発部屋モニター機能
  - レスポンシブデザイン対応
  - WebSocketリアルタイム更新
