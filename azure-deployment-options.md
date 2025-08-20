# Azure デプロイメントオプション比較

## 概要
Microsoft AI Labo スマート空間最適化ダッシュボードをAzureで公開する際の複数の選択肢を比較します。

## 1. Azure App Service（推奨）

### 特徴
- **管理の簡単さ**: サーバー管理不要
- **自動スケーリング**: 負荷に応じて自動拡張
- **継続的デプロイ**: Git、GitHub、Azure DevOps対応
- **SSL証明書**: 自動管理
- **カスタムドメイン**: 簡単設定

### 適している用途
- 中小規模のWebアプリケーション
- 開発・テスト環境
- 本番環境（中規模まで）

### コスト
- **F1（Free）**: 月60分まで無料
- **B1（Basic）**: 約¥1,500/月
- **S1（Standard）**: 約¥3,000/月
- **P1V2（Premium）**: 約¥15,000/月

### デプロイ手順
詳細は `azure-deployment-guide.md` を参照

## 2. Azure Container Instances（ACI）

### 特徴
- **コンテナ化**: Dockerコンテナで実行
- **サーバーレス**: 使用時のみ課金
- **高速起動**: 数秒で起動
- **スケーリング**: 手動設定

### 適している用途
- マイクロサービス
- バッチ処理
- 一時的なワークロード

### コスト
- **vCPU**: 約¥0.05/時間
- **メモリ**: 約¥0.01/GB/時間
- **月額**: 約¥500-2,000（使用量による）

### デプロイ手順

#### 2.1 Dockerfile の作成
```dockerfile
# dashboard/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

#### 2.2 コンテナのビルドとデプロイ
```bash
# コンテナレジストリにプッシュ
az acr build --registry <registry-name> --image smart-dashboard:latest .

# コンテナインスタンスの作成
az container create \
  --resource-group smart-space-rg \
  --name smart-dashboard-aci \
  --image <registry-name>.azurecr.io/smart-dashboard:latest \
  --dns-name-label smart-dashboard \
  --ports 8000 \
  --environment-variables \
    PORT=8000
```

## 3. Azure Kubernetes Service（AKS）

### 特徴
- **高可用性**: 複数ノードでの冗長化
- **自動スケーリング**: 高度なスケーリング機能
- **コンテナオーケストレーション**: Kubernetes
- **マイクロサービス**: 複数サービス連携

### 適している用途
- 大規模アプリケーション
- マイクロサービスアーキテクチャ
- 高可用性が重要なシステム

### コスト
- **管理費**: 無料
- **ノード**: 約¥3,000/月/ノード
- **総額**: 約¥10,000-50,000/月

### デプロイ手順

#### 3.1 Kubernetes マニフェスト
```yaml
# dashboard/k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smart-dashboard
spec:
  replicas: 3
  selector:
    matchLabels:
      app: smart-dashboard
  template:
    metadata:
      labels:
        app: smart-dashboard
    spec:
      containers:
      - name: smart-dashboard
        image: smart-dashboard:latest
        ports:
        - containerPort: 8000
        env:
        - name: PORT
          value: "8000"
---
apiVersion: v1
kind: Service
metadata:
  name: smart-dashboard-service
spec:
  selector:
    app: smart-dashboard
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

#### 3.2 AKS クラスターの作成とデプロイ
```bash
# AKS クラスターの作成
az aks create \
  --resource-group smart-space-rg \
  --name smart-space-aks \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# kubectl の設定
az aks get-credentials --resource-group smart-space-rg --name smart-space-aks

# デプロイ
kubectl apply -f k8s/
```

## 4. Azure Static Web Apps

### 特徴
- **静的サイト**: HTML/CSS/JavaScript
- **サーバーレス**: API も含めてサーバーレス
- **自動デプロイ**: GitHub連携
- **認証**: 組み込み認証機能

### 適している用途
- 静的Webサイト
- SPA（Single Page Application）
- 軽量なWebアプリケーション

### コスト
- **無料プラン**: 月2GB、100GB転送
- **有料プラン**: 約¥1,000/月

### デプロイ手順

#### 4.1 静的サイト用の構成
```json
// dashboard/staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

#### 4.2 GitHub Actions でのデプロイ
```yaml
# .github/workflows/azure-static-web-apps.yml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/dashboard"
          output_location: ""
```

## 5. Azure Functions

### 特徴
- **サーバーレス**: イベント駆動
- **自動スケーリング**: 使用時のみ実行
- **多言語対応**: Python、JavaScript、C#等
- **統合**: 他のAzureサービスと連携

### 適している用途
- API エンドポイント
- バッチ処理
- イベント駆動処理

### コスト
- **消費プラン**: 実行時間とメモリ使用量に応じて課金
- **月額**: 約¥500-2,000（使用量による）

### デプロイ手順

#### 5.1 Functions プロジェクトの作成
```python
# functions/HttpTrigger/__init__.py
import azure.functions as func
import json
import random
from datetime import datetime

def main(req: func.HttpRequest) -> func.HttpResponse:
    # API エンドポイントの実装
    if req.route == "entrance-data":
        data = get_entrance_data()
    elif req.route == "room-data":
        data = get_room_data()
    else:
        data = {"error": "Unknown endpoint"}
    
    return func.HttpResponse(
        json.dumps(data),
        mimetype="application/json"
    )

def get_entrance_data():
    # エントランスデータの生成ロジック
    pass

def get_room_data():
    # 部屋データの生成ロジック
    pass
```

#### 5.2 Functions のデプロイ
```bash
# Functions の作成
az functionapp create \
  --resource-group smart-space-rg \
  --consumption-plan-location japaneast \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --name smart-dashboard-functions \
  --storage-account <storage-account-name>

# デプロイ
func azure functionapp publish smart-dashboard-functions
```

## 6. 比較表

| サービス | 管理の簡単さ | スケーラビリティ | コスト | 学習コスト | 推奨用途 |
|---------|-------------|-----------------|--------|-----------|----------|
| App Service | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 中小規模Webアプリ |
| Container Instances | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | マイクロサービス |
| AKS | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | 大規模システム |
| Static Web Apps | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 静的サイト |
| Functions | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | API/バッチ処理 |

## 7. 推奨アーキテクチャ

### 7.1 小規模（開発・テスト）
```
Azure App Service (F1/B1)
├── フロントエンド (HTML/CSS/JS)
├── バックエンド (Python Flask)
└── 静的ファイル配信
```

### 7.2 中規模（本番）
```
Azure App Service (S1/P1V2)
├── フロントエンド
├── バックエンド API
├── Application Insights
├── Azure CDN
└── カスタムドメイン + SSL
```

### 7.3 大規模（エンタープライズ）
```
Azure Kubernetes Service (AKS)
├── フロントエンド (Static Web Apps)
├── バックエンド API (Container)
├── データベース (Azure Database)
├── 監視 (Application Insights)
├── CDN (Azure CDN)
└── セキュリティ (Azure Front Door)
```

## 8. セキュリティ考慮事項

### 8.1 共通セキュリティ設定
- **HTTPS**: 全通信の暗号化
- **認証**: Azure AD統合
- **ネットワーク**: VNet統合
- **監視**: Application Insights
- **ログ**: セキュリティログの有効化

### 8.2 データ保護
- **暗号化**: 保存時・転送時の暗号化
- **バックアップ**: 定期的なバックアップ
- **アクセス制御**: RBAC（ロールベースアクセス制御）

## 9. パフォーマンス最適化

### 9.1 フロントエンド最適化
- **CDN**: Azure CDNの活用
- **圧縮**: Gzip圧縮の有効化
- **キャッシュ**: ブラウザキャッシュの設定

### 9.2 バックエンド最適化
- **データベース**: クエリ最適化
- **キャッシュ**: Redis Cacheの活用
- **非同期処理**: バックグラウンド処理

## 10. 監視とアラート

### 10.1 監視設定
```bash
# Application Insights の作成
az monitor app-insights component create \
  --app smart-dashboard-insights \
  --location japaneast \
  --resource-group smart-space-rg \
  --application-type web

# アラートルールの作成
az monitor metrics alert create \
  --name "high-cpu-alert" \
  --resource-group smart-space-rg \
  --scopes <app-service-id> \
  --condition "avg Percentage CPU > 80" \
  --description "CPU使用率が80%を超えた場合のアラート"
```

### 10.2 ログ分析
- **Application Insights**: パフォーマンス監視
- **Azure Monitor**: インフラ監視
- **Log Analytics**: ログ分析

## 11. コスト最適化のベストプラクティス

### 11.1 リソースの適切なサイジング
- 使用量に応じたプラン選択
- 自動スケーリングの活用
- 不要なリソースの削除

### 11.2 予約インスタンス
- 長期利用時の予約割引
- ハイブリッド使用特典

### 11.3 開発・テスト環境
- 開発環境は無料プラン活用
- 非営業時間の停止
- リソースの共有

## 12. 移行戦略

### 12.1 段階的移行
1. **フェーズ1**: 静的ファイルをStatic Web Appsに移行
2. **フェーズ2**: APIをFunctionsに移行
3. **フェーズ3**: 統合アプリケーションをApp Serviceに移行

### 12.2 ブルー・グリーンデプロイ
- 新環境でのテスト
- 段階的なトラフィック移行
- ロールバック機能の確保

## 結論

**推奨アプローチ**:
1. **開発・テスト**: Azure App Service (F1/B1)
2. **本番環境**: Azure App Service (S1/P1V2)
3. **大規模展開**: Azure Kubernetes Service (AKS)

**開始手順**:
1. Azure App Serviceでのデプロイから開始
2. 必要に応じて他のサービスに移行
3. 段階的な機能拡張と最適化
