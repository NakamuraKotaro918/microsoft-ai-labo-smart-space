📘 Google AI Studio / Gemini API 調査関連
🔍 外部アプリからのアクセス可能性
一部アプリはカメラや連絡先などの機能利用が可能

ユーザーの明示的な許可が必要（初回起動時など）

使用中のみ権限が有効

🔗 Gemini Live APIの技術概要
WebSocketによるステートフル通信

Android / Flutter / Unity に対応

Firebaseプロジェクトごとに最大10セッション制限

インターネット接続必須、APIキー必要

Googleのプライバシーポリシーに準拠

🧠 Azure AI Visionとの連携構成
🎯 目的
AITRIOSで人物検出 → 別カメラで撮影 → Azureへ画像アップロード → AI Visionで内容理解

🧩 システム構成（Mermaid記法）
mermaid
flowchart LR
A[SONY AITRIOS Edgeカメラ<br>（人物検出）] -->|検出トリガー| B[別のWebカメラで静止画取得]
B -->|画像保存| C[ローカルデバイスまたはIoT Edge]
C -->|HTTP/Blob API| D[Azure Blob Storage]
D -->|トリガー| E[Azure Function]
E -->|API呼び出し| F[Azure AI Vision<br>Content Understanding]
F -->|説明テキスト| G[保存・表示・通知]
✅ 技術的実現性
要素	実現性	解説
AITRIOS人物検出	◎	SDK/IMX500で高速検知、MQTT連携可
別カメラ撮影	◎	Raspberry PiやIPカメラ対応
Azure Blob保存	◎	Python/Node.jsで簡単に実装可能
Vision API	◯	JPEG/PNG対応、数秒以内に応答
統合制御	◎	Logic AppsやFunctionsで柔軟に構成可能
🧠 出力例
json
{
  "captionResult": {
    "text": "Two workers assembling machinery in a factory setting",
    "confidence": 0.91
  },
  "objects": [
    {"name": "person", "confidence": 0.98},
    {"name": "machinery", "confidence": 0.85}
  ]
}
💡 メリットと工夫
観点	内容
精度	AITRIOSはトリガー用途、Azureで精緻な理解
通信負荷	必要時のみ静止画送信で軽量
実装自由度	MQTT/Webhookで柔軟な連携
データ拡張	GPTと組み合わせてレポート化可能
⚠️ 注意点・制約
項目	内容
レイテンシ	数秒〜数十秒、リアルタイム用途には不向き
セキュリティ	SASなど認証管理が必要
フォーマット制限	JPEG/PNGのみ、動画不可
トリガー制御	連続検知時の抑制・バッファリングが必要
🧩 GeminiのUX設計に関する仮説
実際にはクラウド処理による遅延があるが、UI設計により「リアルタイム風」体験を演出

スナップショットを逐次送信 → キャプション生成 → 動画に重ねて表示

フレーム単位の推論では一時的な動きが反映されない可能性あり