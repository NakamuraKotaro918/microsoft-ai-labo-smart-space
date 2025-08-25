# GitHub Actions による Azure デプロイ設定

## 概要

このドキュメントでは、GitHub Actionsを使用してAzureに自動デプロイするための設定手順を説明します。

## 前提条件

- Azure CLI がインストールされている
- Azure サブスクリプションにアクセス権限がある
- GitHub リポジトリにアクセス権限がある

## 1. Azure Service Principal の作成

### 1.1 Azure CLI でログイン

```bash
az login
```

### 1.2 Service Principal の作成

```bash
# Service Principal を作成
az ad sp create-for-rbac \
  --name "github-actions-mass-deploy" \
  --role contributor \
  --scopes /subscriptions/83092a31-89e7-41fc-8a04-e18aae05c48d/resourceGroups/MS-Lab-Proj-RG \
  --sdk-auth
```

### 1.3 出力の保存

上記コマンドの出力を保存してください。以下のような形式で出力されます：

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "83092a31-89e7-41fc-8a04-e18aae05c48d",
  "tenantId": "5439446a-4d1f-4c4a-b9ce-43626669d4f4",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

## 2. GitHub Secrets の設定

### 2.1 GitHub リポジトリにアクセス

1. GitHub リポジトリにアクセス
2. **Settings** タブをクリック
3. 左側メニューから **Secrets and variables** → **Actions** をクリック

### 2.2 AZURE_CREDENTIALS の設定

1. **New repository secret** をクリック
2. **Name**: `AZURE_CREDENTIALS`
3. **Value**: 上記で取得したJSON全体をコピー&ペースト
4. **Add secret** をクリック

## 3. ワークフローの動作

### 3.1 自動トリガー

- **main ブランチへのプッシュ**: 自動的にdev環境にデプロイ
- **infrastructure/** ディレクトリの変更: デプロイが実行される
- **手動実行**: GitHub Actions ページから手動で実行可能

### 3.2 デプロイ手順

1. **Bicep テンプレートの検証**
2. **簡略化テンプレートのデプロイ** (Storage Account等)
3. **完全テンプレートのデプロイ** (全リソース)
4. **API アプリケーションのデプロイ**
5. **IoT デバイスの作成**
6. **デプロイ結果の確認**

## 4. トラブルシューティング

### 4.1 権限エラー

```
Error: Insufficient privileges to complete the operation.
```

**解決策**:
- Service Principal に適切な権限が付与されているか確認
- リソースグループへのアクセス権限を確認

### 4.2 デプロイエラー

```
Error: Deployment failed
```

**解決策**:
- Bicep テンプレートの構文を確認
- パラメータファイルの内容を確認
- Azure リソースの制限を確認

### 4.3 認証エラー

```
Error: Authentication failed
```

**解決策**:
- GitHub Secrets の設定を確認
- Service Principal の有効期限を確認
- テナントID とサブスクリプションID を確認

## 5. セキュリティ考慮事項

### 5.1 Service Principal の管理

- 定期的にService Principal の認証情報を更新
- 必要最小限の権限のみを付与
- 使用していないService Principal は削除

### 5.2 GitHub Secrets の管理

- Secrets へのアクセス権限を制限
- 定期的にSecrets を更新
- ログでSecrets の使用状況を監視

## 6. 監視とログ

### 6.1 GitHub Actions ログ

- GitHub Actions ページでデプロイログを確認
- 失敗したジョブの詳細を確認
- デプロイ時間と成功率を監視

### 6.2 Azure ログ

- Azure Portal でリソースグループのアクティビティログを確認
- Application Insights でアプリケーションログを確認
- Log Analytics で統合ログを確認

## 7. 今後の改善

### 7.1 段階的デプロイ

- 開発環境 → ステージング環境 → 本番環境
- 各環境でのテスト実行
- ロールバック機能の実装

### 7.2 セキュリティ強化

- マルチファクター認証の導入
- 条件付きアクセスポリシーの設定
- セキュリティスキャンの自動化

### 7.3 パフォーマンス最適化

- 並列デプロイの実装
- キャッシュ機能の活用
- デプロイ時間の短縮
