# Azure Static Web Apps デプロイガイド

このガイドでは、Microsoft AI Labo スマート空間最適化ダッシュボードをAzure Static Web Appsにデプロイする手順を説明します。

## 前提条件

- Azure サブスクリプション
- GitHub アカウント
- このリポジトリがGitHubにプッシュされていること

## デプロイ手順

### 1. Azure Static Web Apps リソースの作成

1. [Azure Portal](https://portal.azure.com) にログイン
2. 「リソースの作成」をクリック
3. 「Static Web App」を検索して選択
4. 「作成」をクリック

### 2. 基本設定

- **サブスクリプション**: 使用するサブスクリプションを選択
- **リソースグループ**: 新規作成または既存のグループを選択
- **名前**: アプリケーション名（例: `smart-space-dashboard`）
- **リージョン**: 最寄りのリージョンを選択
- **ホスティングプラン**: Free（無料プラン）

### 3. ソース設定

- **ソース**: GitHub
- **組織**: あなたのGitHub組織またはユーザー名
- **リポジトリ**: このプロジェクトのリポジトリ名
- **ブランチ**: `main`
- **ビルドプリセット**: Custom
- **アプリの場所**: `/dashboard`
- **APIの場所**: 空白のまま
- **出力場所**: 空白のまま

### 4. デプロイの実行

1. 「確認および作成」をクリック
2. 設定を確認して「作成」をクリック
3. デプロイが完了するまで待機（通常5-10分）

### 5. カスタムドメインの設定（オプション）

1. デプロイ完了後、Static Web Appリソースに移動
2. 左メニューから「カスタムドメイン」を選択
3. 「追加」をクリック
4. ドメイン名を入力して設定

## 環境変数の設定

必要に応じて、以下の環境変数を設定できます：

1. Static Web Appリソースで「設定」→「アプリケーション設定」を選択
2. 以下の設定を追加：

```
WEBSITE_NODE_DEFAULT_VERSION=18
```

## トラブルシューティング

### よくある問題

1. **デプロイが失敗する場合**
   - GitHub Actionsのログを確認
   - ファイルパスが正しいか確認
   - `staticwebapp.config.json`の設定を確認

2. **アプリケーションが表示されない場合**
   - ブラウザのキャッシュをクリア
   - ネットワークタブでエラーを確認
   - コンソールログを確認

3. **APIエンドポイントが動作しない場合**
   - `staticwebapp.config.json`のルート設定を確認
   - 静的ファイルとして動作するよう設計されていることを確認

## セキュリティ設定

### Content Security Policy

`staticwebapp.config.json`でCSPが設定されています：

- Chart.js CDNからの読み込みを許可
- インラインスクリプトとevalを許可（開発用）
- 画像とフォントの読み込みを制限

### 本番環境での推奨設定

本番環境では、より厳格なCSP設定を推奨します：

```json
{
  "globalHeaders": {
    "content-security-policy": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"
  }
}
```

## パフォーマンス最適化

1. **ファイル圧縮**: Azure Static Web Appsは自動的にgzip圧縮を提供
2. **キャッシュ設定**: `staticwebapp.config.json`でキャッシュヘッダーを設定
3. **CDN**: Azure CDNを有効化してグローバル配信を改善

## 監視とログ

1. **Application Insights**: 有効化してパフォーマンス監視
2. **ログ**: Azure Portalでアクセスログを確認
3. **メトリクス**: トラフィックとエラー率を監視

## 更新とメンテナンス

1. **自動デプロイ**: GitHubにプッシュすると自動的にデプロイ
2. **手動デプロイ**: Azure Portalから手動でデプロイ可能
3. **ロールバック**: 以前のバージョンに戻すことが可能

## サポート

問題が発生した場合は、以下を確認してください：

1. [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/azure/static-web-apps/)
2. [GitHub Actions ログ](https://github.com/your-repo/actions)
3. [Azure サポート](https://azure.microsoft.com/support/)
