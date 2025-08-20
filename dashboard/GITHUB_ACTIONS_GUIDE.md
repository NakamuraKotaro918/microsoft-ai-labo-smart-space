# GitHub Actions による Azure Static Web Apps 管理ガイド

このガイドでは、GitHub Actionsを使用してAzure Static Web Appsの作成、デプロイ、削除を管理する方法を説明します。

## 📋 前提条件

1. **Azure サブスクリプション**: 有効なAzureサブスクリプション
2. **GitHub リポジトリ**: このプロジェクトがGitHubにプッシュされていること
3. **Azure CLI**: ローカル環境にAzure CLIがインストールされていること

## 🔐 1. Azure認証情報の設定

### 1.1 サービスプリンシパルの作成

```bash
# プロジェクトルートで実行
cd dashboard
./generate-azure-credentials.sh
```

このスクリプトは以下を実行します：
- Azureサービスプリンシパルを作成
- 必要な権限を付与
- 認証情報を`azure-credentials.json`に保存

### 1.2 GitHub Secretsの設定

1. GitHubリポジトリに移動
2. **Settings** → **Secrets and variables** → **Actions** を選択
3. **New repository secret** をクリック
4. 以下のシークレットを追加：

```
Name: AZURE_CREDENTIALS
Value: (azure-credentials.jsonの内容をコピー)
```

## 🚀 2. Azure Static Web Appsリソースの作成

### 2.1 GitHub Actions ワークフローを使用

1. GitHubリポジトリの **Actions** タブに移動
2. **Create Azure Static Web App** ワークフローを選択
3. **Run workflow** をクリック
4. 以下のパラメータを設定：

```
Resource Group: smart-space-rg
Static Web App Name: smart-space-dashboard
Location: japaneast
GitHub Repository: kyokko-electric/microsoft-ai-labo-smart-space
Branch: azure-deployment
App Location: dashboard
```

5. **Run workflow** をクリックして実行

### 2.2 作成後の設定

ワークフロー実行後、以下の手順でデプロイトークンを設定：

1. Azure Portal で Static Web App リソースに移動
2. **管理** タブを選択
3. **デプロイトークン** をコピー
4. GitHub Secrets に追加：

```
Name: AZURE_STATIC_WEB_APPS_API_TOKEN
Value: (デプロイトークンをコピー)
```

## 🔄 3. デプロイの管理

### 3.1 自動デプロイ

コードをプッシュすると自動的にデプロイされます：

```bash
git add .
git commit -m "Update dashboard"
git push origin azure-deployment
```

### 3.2 手動デプロイ

1. GitHub Actions タブで **Azure Static Web Apps CI/CD** ワークフローを選択
2. **Run workflow** をクリック
3. **Action** で `deploy` を選択
4. **Run workflow** をクリック

## 🗑️ 4. リソースの削除

### 4.1 Static Web App の削除

1. GitHub Actions タブで **Azure Static Web Apps CI/CD** ワークフローを選択
2. **Run workflow** をクリック
3. 以下のパラメータを設定：

```
Action: destroy
Resource Group: smart-space-rg
Static Web App Name: smart-space-dashboard
```

4. **Run workflow** をクリック

### 4.2 リソースグループの削除

削除ワークフローは自動的にリソースグループも削除します。

## 📊 5. ワークフローの監視

### 5.1 実行状況の確認

- GitHub Actions タブでワークフローの実行状況を確認
- 各ステップのログを確認
- エラーが発生した場合はログを確認して対処

### 5.2 よくある問題

1. **認証エラー**
   - `AZURE_CREDENTIALS` シークレットが正しく設定されているか確認
   - サービスプリンシパルの権限を確認

2. **デプロイエラー**
   - `AZURE_STATIC_WEB_APPS_API_TOKEN` が正しく設定されているか確認
   - ファイルパスが正しいか確認

3. **リソース作成エラー**
   - リソース名が一意であることを確認
   - サブスクリプションの制限を確認

## 🔧 6. カスタマイズ

### 6.1 ワークフローのカスタマイズ

各ワークフローファイルを編集して、以下のカスタマイズが可能：

- ビルドプロセスの変更
- 追加のステップの挿入
- 通知の設定
- 条件分岐の追加

### 6.2 環境別の設定

複数の環境（開発、ステージング、本番）を管理する場合：

1. 環境別のブランチを作成
2. 環境別のワークフローを作成
3. 環境別のシークレットを設定

## 📚 7. 参考資料

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions ドキュメント](https://docs.github.com/actions)
- [Azure CLI ドキュメント](https://docs.microsoft.com/cli/azure/)

## 🆘 8. サポート

問題が発生した場合は、以下を確認してください：

1. GitHub Actions のログ
2. Azure Portal のログ
3. このガイドのトラブルシューティングセクション
4. Azure サポート
