// MASS プロジェクト - 簡略化されたAzure インフラストラクチャ
// Microsoft AI Labo スマート空間最適化ダッシュボード

@description('プロジェクト名')
param projectName string = 'mass-smart-space'

@description('環境名')
param environment string = 'dev'

@description('Azure リージョン')
param location string = 'Japan East'

// リソースグループ名と管理者パスワードは現在使用していません

@description('Storage Account 名')
param storageAccountName string = 'st${replace(projectName, '-', '')}${environment}'

// タグの定義
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
  version: '1.0.0'
}

// Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
  tags: tags
}

// Blob Service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2021-09-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 86400
        }
      ]
    }
  }
}

// Blob Container - センサーデータ
resource sensorDataBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  parent: blobService
  name: 'sensor-data'
  properties: {
    publicAccess: 'None'
    metadata: {
      type: 'sensor-data'
      description: 'センサーデータのBlobストレージ'
    }
  }
}

// Blob Container - 分析データ
resource analysisDataBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  parent: blobService
  name: 'analysis-data'
  properties: {
    publicAccess: 'None'
    metadata: {
      type: 'analysis-data'
      description: '分析データのBlobストレージ'
    }
  }
}

// Blob Container - 画像データ
resource imageDataBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  parent: blobService
  name: 'image-data'
  properties: {
    publicAccess: 'None'
    metadata: {
      type: 'image-data'
      description: 'AITRIOS画像データのBlobストレージ'
    }
  }
}

// Outputs
output storageAccountName string = storageAccount.name
output blobContainerSensor string = sensorDataBlobContainer.name
output blobContainerAnalysis string = analysisDataBlobContainer.name
output blobContainerImage string = imageDataBlobContainer.name
