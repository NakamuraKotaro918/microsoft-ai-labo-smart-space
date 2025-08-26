// MASS プロジェクト - 最小構成（Static Web Apps除外）
// Microsoft AI Labo スマート空間最適化ダッシュボード

@description('プロジェクト名')
param projectName string = 'mass-smart-space'

@description('環境名')
param environment string = 'dev'

@description('Azure リージョン')
param location string = 'East Asia'

@description('リソースグループ名')
param resourceGroupName string = 'MS-Lab-Proj-RG'

@description('Cosmos DB アカウント名')
param cosmosAccountName string = 'cosmos-${replace(projectName, '-', '')}${environment}'

@description('IoT Hub 名')
param iotHubName string = 'iot-${replace(projectName, '-', '')}${environment}'

@description('Storage Account 名')
param storageAccountName string = 'st${replace(projectName, '-', '')}${environment}'

// タグの定義
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
  version: '1.0.0'
}

// Cosmos DB アカウント
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2021-10-15' = {
  name: cosmosAccountName
  location: location
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
  tags: tags
}

// Cosmos DB データベース
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2021-10-15' = {
  parent: cosmosAccount
  name: 'smart-space-db'
  properties: {
    resource: {
      id: 'smart-space-db'
    }
  }
}

// Cosmos DB コンテナ - センサーデータ
resource sensorDataContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  parent: cosmosDatabase
  name: 'sensor-data'
  properties: {
    resource: {
      id: 'sensor-data'
      partitionKey: {
        paths: [
          '/partitionKey'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

// Cosmos DB コンテナ - 分析データ
resource analysisDataContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  parent: cosmosDatabase
  name: 'analysis-data'
  properties: {
    resource: {
      id: 'analysis-data'
      partitionKey: {
        paths: [
          '/partitionKey'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

// Azure IoT Hub
resource iotHub 'Microsoft.Devices/IotHubs@2021-07-02' = {
  name: iotHubName
  location: location
  sku: {
    name: 'S1'
    capacity: 1
  }
  properties: {
    enableFileUploadNotifications: false
    cloudToDevice: {
      maxDeliveryCount: 10
      defaultTtlAsIso8601: 'PT1H'
      feedback: {
        lockDurationAsIso8601: 'PT1M'
        ttlAsIso8601: 'PT1H'
        maxDeliveryCount: 10
      }
    }
    features: 'None'
  }
  tags: tags
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

// AI Search サービス
resource searchService 'Microsoft.Search/searchServices@2020-08-01' = {
  name: 'search-${replace(projectName, '-', '')}${environment}'
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
  }
  tags: tags
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${projectName}-${environment}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
  tags: tags
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-${projectName}-${environment}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: tags
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: 'kv-${replace(projectName, '-', '')}${environment}'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enabledForDeployment: true
    enabledForDiskEncryption: true
    enabledForTemplateDeployment: true
    enableRbacAuthorization: true
  }
  tags: tags
}

// Outputs
output resourceGroupName string = resourceGroupName
output cosmosAccountName string = cosmosAccount.name
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output iotHubName string = iotHub.name
output iotHubHostName string = '${iotHub.name}.azure-devices.net'
output keyVaultName string = keyVault.name
output appInsightsKey string = appInsights.properties.InstrumentationKey
output storageAccountName string = storageAccount.name
output searchServiceName string = searchService.name
output searchServiceUrl string = 'https://${searchService.name}.search.windows.net'
output blobContainerSensor string = sensorDataBlobContainer.name
output blobContainerAnalysis string = analysisDataBlobContainer.name
output blobContainerImage string = imageDataBlobContainer.name
