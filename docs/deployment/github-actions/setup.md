# GitHub Secrets 設定ガイド

GitHub ActionsでAzureにデプロイするために必要なシークレットの設定方法を説明します。

## 🔐 必要なシークレット

以下の3つのシークレットをGitHubリポジトリに設定する必要があります：

1. `AZURE_CLIENT_ID` - Azure AD アプリケーションのクライアントID
2. `AZURE_CLIENT_SECRET` - Azure AD アプリケーションのクライアントシークレット
3. `AZURE_TENANT_ID` - Azure AD テナントID

## 🚀 設定手順

### 1. Azure AD アプリケーションの作成

Azure CLIを使用してサービスプリンシパルを作成します：

```bash
# Azure CLI にログイン
az login

# サービスプリンシパルの作成
az ad sp create-for-rbac \
  --name "mass-smart-space-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

### 2. 出力の保存

上記コマンドの出力例：

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 3. GitHub Secrets の設定

1. GitHubリポジトリのページに移動
2. **Settings** タブをクリック
3. 左サイドバーから **Secrets and variables** → **Actions** を選択
4. **New repository secret** ボタンをクリック

以下の3つのシークレットを追加：

#### AZURE_CLIENT_ID
- **Name**: `AZURE_CLIENT_ID`
- **Value**: 上記出力の `clientId` の値

#### AZURE_CLIENT_SECRET
- **Name**: `AZURE_CLIENT_SECRET`
- **Value**: 上記出力の `clientSecret` の値

#### AZURE_TENANT_ID
- **Name**: `AZURE_TENANT_ID`
- **Value**: 上記出力の `tenantId` の値

### 4. 環境の設定（オプション）

本番環境へのデプロイを制限するために、環境を設定できます：

1. **Settings** → **Environments** を選択
2. **New environment** をクリック
3. 環境名を入力（例：`production`）
4. **Protection rules** を設定（必要に応じて）

## 🔍 権限の確認

サービスプリンシパルに適切な権限が付与されていることを確認：

```bash
# サブスクリプションの確認
az account show

# リソースグループの作成権限をテスト
az group create --name test-rg --location "Japan East"
az group delete --name test-rg --yes
```

## 🛠️ トラブルシューティング

### よくある問題

1. **認証エラー**
   ```
   Error: AADSTS700016: Application with identifier 'xxx' was not found in the directory 'xxx'
   ```
   - 解決策: サービスプリンシパルが正しく作成されているか確認

2. **権限不足**
   ```
   Error: Authorization failed
   ```
   - 解決策: サービスプリンシパルに適切なロールが付与されているか確認

3. **シークレットが見つからない**
   ```
   Error: Required secret 'AZURE_CLIENT_ID' not found
   ```
   - 解決策: GitHub Secretsが正しく設定されているか確認

### デバッグ方法

1. **GitHub Actions ログの確認**
   - Actions タブでワークフローの実行ログを確認

2. **Azure CLI の手動テスト**
   ```bash
   az login --service-principal \
     --username $AZURE_CLIENT_ID \
     --password $AZURE_CLIENT_SECRET \
     --tenant $AZURE_TENANT_ID
   ```

3. **権限の確認**
   ```bash
   az role assignment list --assignee $AZURE_CLIENT_ID
   ```

### GitHub Actions のトラブルシューティング

#### Azure CLI インストールエラー
```
E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)
```

**解決策**: 
- `sudo` を使用してインストール: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
- または公式のaptリポジトリを使用
- または `pip install azure-cli` を使用

#### GitHub Actions アクションエラー
```
Error: Unable to resolve action azure/setup-azure-cli, repository not found
```

**解決策**:
- 直接インストール方法を使用: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
- または `pip install azure-cli` を使用
- または `snap install azure-cli --classic` を使用

#### 認証エラー
```
Error: AADSTS700016: Application with identifier 'xxx' was not found
```

**解決策**:
- サービスプリンシパルが正しく作成されているか確認
- GitHub Secretsの値が正しく設定されているか確認

#### 権限不足エラー
```
Error: Authorization failed
```

**解決策**:
- サービスプリンシパルに適切なロールが付与されているか確認
- サブスクリプションレベルでの権限を確認

## 🔒 セキュリティのベストプラクティス

1. **最小権限の原則**
   - 必要最小限の権限のみを付与
   - 特定のリソースグループに限定

2. **シークレットのローテーション**
   - 定期的にクライアントシークレットを更新
   - 古いシークレットは削除

3. **監査ログの確認**
   - Azure AD のサインインログを定期的に確認
   - 異常なアクセスを検出

## 📚 参考リンク

- [Azure CLI サービスプリンシパル作成](https://docs.microsoft.com/cli/azure/create-an-azure-service-principal-azure-cli)
- [GitHub Actions Azure 認証](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [Azure RBAC ロール](https://docs.microsoft.com/azure/role-based-access-control/built-in-roles)
