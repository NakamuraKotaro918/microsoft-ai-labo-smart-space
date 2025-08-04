# 🚀 クイックスタートガイド

## 1分で起動！

### ステップ1: ファイルをダウンロード
```bash
git clone <repository-url>
cd microsoft-ai-labo-smart-space/dashboard
```

### ステップ2: サーバー起動

**最も簡単な方法:**

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

**または直接:**
```bash
python3 simple-server.py
```

### ステップ3: ブラウザでアクセス
```
http://localhost:8000
```

## 🎉 完了！

ダッシュボードが表示されます。データは30秒間隔で自動更新されます。

## 📱 スクリーンショット

### エントランスモニター
- リアルタイム来場者数
- 年齢・性別分布
- 時間別来場者数グラフ
- 行動パターン分析

### 個人開発部屋モニター  
- 温度・湿度・CO2データ
- 環境データトレンド
- 利用率分析
- 空調最適化提案

## 🔧 トラブルシューティング

### Pythonが見つからない場合
```bash
# Python 3をインストール
# Ubuntu/Debian:
sudo apt install python3

# macOS (Homebrew):
brew install python3

# Windows:
# https://www.python.org/downloads/ からダウンロード
```

### ポート8000が使用中の場合
```bash
# 別のポートを使用
python3 simple-server.py
# エラーが出た場合、simple-server.py内のPORT = 8000を変更
```

### ブラウザでアクセスできない場合
1. ファイアウォールの設定を確認
2. `http://127.0.0.1:8000` を試す
3. ブラウザのキャッシュをクリア

## 💡 ヒント

- **リアルタイム更新**: データは30秒ごとに自動更新
- **レスポンシブ**: スマートフォンでも表示可能
- **モックデータ**: 実際のセンサーがなくてもデモデータで動作
- **終了**: `Ctrl+C` でサーバー停止

## 📞 サポート

問題が発生した場合は、ブラウザの開発者ツール（F12）でエラーログを確認してください。
