# GitHub Actions ワークフロー

## 📋 概要

本システムでは、2つのGitHub Actionsワークフローを提供しています：

1. **`azure-deploy.yml`** - 自動デプロイ（push時・手動実行）
2. **`azure-destroy.yml`** - リソース削除（手動実行のみ）

## 🚀 1. 自動デプロイ (`azure-deploy.yml`)

### **トリガー**
- **自動**: `main`ブランチへのpush（`infrastructure/`、`azure-data-pipeline/`、`.github/workflows/azure-deploy.yml`の変更時）
- **手動**: GitHub Actionsの手動実行

### **機能**
- リソースグループの自動作成
- Bicepテンプレートによるインフラデプロイ
- APIアプリケーションの自動デプロイ
- 環境別デプロイ（dev/prod）

### **使用方法**
```bash
# 自動デプロイ（push時）
git push origin main

# 手動デプロイ
# GitHub → Actions → azure-deploy.yml → Run workflow
```

## 🗑️ 2. リソース削除 (`azure-destroy.yml`)

### **トリガー**
- **手動実行のみ**: `workflow_dispatch`

### **機能**
- **リソース削除**: リソースグループ全体の削除
- **安全確認**: 削除前の確認プロセス
- **詳細表示**: 削除対象リソースの一覧表示

### **入力パラメータ**

| パラメータ | 説明 | 必須 | デフォルト | オプション |
|-----------|------|------|------------|------------|
| `environment` | 削除する環境 | ✅ | `dev` | `dev`, `prod` |
| `resource_group` | リソースグループ名（カスタム指定時） | ❌ | 自動生成 | 任意の文字列 |
| `confirm_destroy` | 削除の確認（yes と入力してください） | ✅ | `no` | 任意の文字列 |

### **使用方法**

#### **リソース削除**
1. GitHub → Actions → azure-destroy.yml → Run workflow
2. `environment`: 削除したい環境を選択
3. `resource_group`: 必要に応じてカスタムリソースグループ名を入力
4. `confirm_destroy`: `yes` と入力
5. Run workflow をクリック

## ⚠️ 注意事項

### **削除時の注意**
- **リソースグループ内のすべてのリソースが削除されます**
- 削除前にリソース一覧が表示されます
- 削除は取り消しできません
- 本番環境での実行は特に注意してください
- `confirm_destroy` に `yes` と入力する必要があります

### **セキュリティ**
- 環境別の承認が必要です（`environment`設定）
- 手動実行制御
- サービスプリンシパルの認証情報が必要です
- 適切な権限を持つAzure ADアプリケーションを使用してください

## 🔧 設定

### **必要なSecrets**
```bash
AZURE_CLIENT_ID          # Azure AD アプリケーションID
AZURE_CLIENT_SECRET      # Azure AD アプリケーションシークレット
AZURE_TENANT_ID          # Azure AD テナントID
AZURE_CREDENTIALS        # Azure サービスプリンシパル認証情報
```

### **環境設定**
- **dev**: 開発環境（`MS-Lab-Proj-RG`）
- **prod**: 本番環境（`MS-Lab-Proj-RG`）
- **test**: テスト環境（`MSLab-test`）

## 📊 ワークフロー比較

| 機能 | azure-deploy.yml | azure-destroy.yml |
|------|------------------|-------------------|
| 自動実行 | ✅ | ❌ |
| 手動実行 | ✅ | ✅ |
| デプロイ | ✅ | ❌ |
| リソース削除 | ❌ | ✅ |
| 環境選択 | ✅ | ✅ |
| リソースグループ自動作成 | ✅ | ❌ |
| 安全確認 | ❌ | ✅ |

## 🎯 推奨使用パターン

### **開発時**
- `azure-deploy.yml` を使用（自動デプロイ）
- コード変更時に自動でインフラが更新される

### **テスト・検証**
- `azure-destroy.yml` で `dev` 環境を使用
- 必要に応じてリソースを削除してクリーンな状態を維持

### **本番環境**
- `azure-destroy.yml` は慎重に使用
- 本番環境での削除は特に注意が必要

## 🔒 安全機能

### **削除前の確認**
- リソースグループの存在確認
- 削除対象リソースの詳細表示
- リソース数の表示
- コスト停止の警告
- 確認入力の必須化

### **削除後の検証**
- 削除完了の確認
- タイムスタンプとGitHub Run IDの記録
- ローカル参照のクリーンアップ案内
