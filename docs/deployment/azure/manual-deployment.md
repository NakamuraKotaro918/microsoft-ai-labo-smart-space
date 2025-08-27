# Azure App Service デプロイメントガイド

## 概要
Microsoft AI Labo スマート空間最適化ダッシュボードをAzure App Serviceで公開する手順です。

## 前提条件
- Azure サブスクリプション
- Azure CLI がインストール済み
- Git がインストール済み

## 1. プロジェクトの準備

### 1.1 requirements.txt の作成
```bash
# dashboard/requirements.txt
Flask==2.3.3
gunicorn==21.2.0
python-dateutil==2.8.2
```

### 1.2 app.py の作成（Flask版）
```python
# dashboard/app.py
from flask import Flask, send_from_directory, jsonify
import json
import random
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# 静的ファイルの配信
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# API エンドポイント
@app.route('/api/entrance/current')
def get_entrance_data():
    current_hour = datetime.now().hour
    base_visitors = get_base_visitors_by_hour(current_hour)
    
    return jsonify({
        "currentVisitors": max(0, base_visitors + random.randint(-2, 4)),
        "dailyVisitors": random.randint(150, 250),
        "ageDistribution": [
            35 + random.randint(-5, 5),
            40 + random.randint(-5, 5),
            20 + random.randint(-5, 5),
            5 + random.randint(-2, 2)
        ],
        "genderDistribution": [
            55 + random.randint(-10, 10),
            40 + random.randint(-10, 10),
            5 + random.randint(-2, 2)
        ],
        "hourlyData": [max(0, get_base_visitors_by_hour(i) + random.randint(-2, 3)) for i in range(24)],
        "behaviorMetrics": {
            "interestLevel": random.randint(70, 90),
            "avgMovement": round(random.uniform(10, 15), 1),
            "groupBehavior": random.randint(35, 65)
        }
    })

@app.route('/api/room/environment')
def get_room_data():
    hour = datetime.now().hour
    temp_variation = 2 * (0.5 - abs(hour - 14) / 14)
    
    return jsonify({
        "temperature": round(22.5 + temp_variation + random.uniform(-1, 1), 1),
        "humidity": max(30, min(80, 55 + random.randint(-10, 10))),
        "co2": max(350, 450 + random.randint(-50, 150)),
        "isOccupied": random.random() < (0.8 if 9 <= hour <= 18 else 0.3),
        "temperatureHistory": [round(22.5 + 2 * (0.5 - abs(i - 14) / 14) + random.uniform(-1, 1), 1) for i in range(24)],
        "humidityHistory": [max(30, min(80, 55 + random.randint(-10, 10))) for _ in range(24)],
        "co2History": [max(350, 450 + (100 if 9 <= i <= 18 else 0) + random.randint(-50, 50)) for i in range(24)],
        "weeklyUsage": [max(0, min(100, usage + random.randint(-10, 10))) for usage in [85, 92, 78, 88, 95, 45, 30]]
    })

# 他のAPIエンドポイントも同様に実装...

def get_base_visitors_by_hour(hour):
    """時間帯別基準来場者数"""
    pattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0]
    return pattern[hour] if 0 <= hour < 24 else 0

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
```

### 1.3 startup.txt の作成
```txt
# dashboard/startup.txt
gunicorn --bind=0.0.0.0 --timeout 600 app:app
```

## 2. Azure CLI でのデプロイ

### 2.1 Azure CLI にログイン
```bash
az login
```

### 2.2 リソースグループの作成
```bash
az group create --name smart-space-dashboard-rg --location japaneast
```

### 2.3 App Service Plan の作成
```bash
az appservice plan create \
  --name smart-space-dashboard-plan \
  --resource-group smart-space-dashboard-rg \
  --sku B1 \
  --is-linux
```

### 2.4 Web App の作成
```bash
az webapp create \
  --name smart-space-dashboard \
  --resource-group smart-space-dashboard-rg \
  --plan smart-space-dashboard-plan \
  --runtime "PYTHON|3.11"
```

### 2.5 アプリケーション設定
```bash
az webapp config appsettings set \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    PYTHON_VERSION=3.11
```

### 2.6 デプロイ
```bash
# プロジェクトディレクトリで実行
az webapp deployment source config-local-git \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard

# Git リモートの追加
git remote add azure <git-url-from-above-command>

# デプロイ
git add .
git commit -m "Initial deployment"
git push azure main
```

## 3. カスタムドメインの設定（オプション）

### 3.1 ドメインの追加
```bash
az webapp config hostname add \
  --webapp-name smart-space-dashboard \
  --resource-group smart-space-dashboard-rg \
  --hostname your-domain.com
```

### 3.2 SSL証明書の設定
```bash
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name smart-space-dashboard \
  --resource-group smart-space-dashboard-rg
```

## 4. 監視とログ

### 4.1 Application Insights の有効化
```bash
az monitor app-insights component create \
  --app smart-space-dashboard-insights \
  --location japaneast \
  --resource-group smart-space-dashboard-rg \
  --application-type web
```

### 4.2 ログの有効化
```bash
az webapp log config \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard \
  --web-server-logging filesystem
```

## 5. スケーリング設定

### 5.1 自動スケーリングの設定
```bash
az monitor autoscale create \
  --resource-group smart-space-dashboard-rg \
  --resource smart-space-dashboard \
  --resource-type Microsoft.Web/sites \
  --name smart-space-dashboard-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## 6. セキュリティ設定

### 6.1 認証の有効化（オプション）
```bash
az webapp auth update \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

## 7. コスト最適化

### 7.1 使用量ベースのプランへの変更
```bash
az appservice plan update \
  --name smart-space-dashboard-plan \
  --resource-group smart-space-dashboard-rg \
  --sku F1
```

## 8. トラブルシューティング

### 8.1 ログの確認
```bash
az webapp log tail \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard
```

### 8.2 アプリケーション設定の確認
```bash
az webapp config appsettings list \
  --resource-group smart-space-dashboard-rg \
  --name smart-space-dashboard
```

## 9. 更新デプロイ

### 9.1 継続的デプロイメント
```bash
# コード変更後
git add .
git commit -m "Update dashboard"
git push azure main
```

## 10. バックアップと復旧

### 10.1 バックアップの設定
```bash
az webapp config backup create \
  --resource-group smart-space-dashboard-rg \
  --webapp-name smart-space-dashboard \
  --backup-name daily-backup
```

## 推奨設定

### 本番環境推奨設定
- **SKU**: P1V2（Premium V2）
- **インスタンス数**: 2-3
- **リージョン**: japaneast（日本東部）
- **SSL**: 必須
- **CDN**: Azure CDN の有効化

### 開発環境推奨設定
- **SKU**: F1（Free）または B1（Basic）
- **インスタンス数**: 1
- **リージョン**: japaneast（日本東部）

## コスト見積もり

### 月額コスト（概算）
- **Basic B1**: 約¥1,500/月
- **Standard S1**: 約¥3,000/月
- **Premium P1V2**: 約¥15,000/月

### 無料枠
- **F1（Free）**: 月60分まで無料
- **開発・テスト用途に最適**
