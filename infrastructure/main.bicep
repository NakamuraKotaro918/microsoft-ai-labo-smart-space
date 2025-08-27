// MASS プロジェクト - Azure インフラストラクチャ
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

// Cosmos DB コンテナ - 来場者データ
resource visitorDataContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  parent: cosmosDatabase
  name: 'visitor-data'
  properties: {
    resource: {
      id: 'visitor-data'
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

// Cosmos DB コンテナ - システムログ
resource systemLogsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2021-10-15' = {
  parent: cosmosDatabase
  name: 'system-logs'
  properties: {
    resource: {
      id: 'system-logs'
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

// IoT Hub デバイス - 快適君
// 注意: デバイスはデプロイ後に手動で作成することを推奨
// resource iotDevice 'Microsoft.Devices/IotHubs/devices@2021-07-02' = {
//   parent: iotHub
//   name: 'kaiteki-001'
//   properties: {
//     status: 'enabled'
//     authentication: {
//       symmetricKey: {
//         primaryKey: 'auto-generated'
//         secondaryKey: 'auto-generated'
//       }
//     }
//   }
// }

// App Service Plan - Consumption SKU (VMクォータを消費しない)
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'asp-${projectName}-${environment}'
  location: location
  sku: {
    name: 'Y1'  // Consumption SKU
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: false
  }
  tags: tags
}

// App Service - Dashboard API (Function Appとして)
resource dashboardApi 'Microsoft.Web/sites@2021-02-01' = {
  name: 'api-${projectName}-${environment}'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
              linuxFxVersion: 'PYTHON|3.11'
      appSettings: [
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_KEY'
          value: cosmosAccount.listKeys().primaryMasterKey
        }
        {
          name: 'COSMOS_DATABASE'
          value: 'smart-space-db'
        }
        {
          name: 'COSMOS_CONTAINER_SENSOR'
          value: 'sensor-data'
        }
        {
          name: 'COSMOS_CONTAINER_ANALYSIS'
          value: 'analysis-data'
        }
        {
          name: 'COSMOS_CONTAINER_VISITOR'
          value: 'visitor-data'
        }
        {
          name: 'COSMOS_CONTAINER_SYSTEM_LOGS'
          value: 'system-logs'
        }
        {
          name: 'IOT_HUB_HOST'
          value: '${iotHub.name}.azure-devices.net'
        }
        {
          name: 'DEVICE_ID'
          value: 'kaiteki-001'
        }
        {
          name: 'ENABLE_MQTT'
          value: 'true'
        }
        {
          name: 'WEBSITES_PORT'
          value: '5000'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'STORAGE_ACCOUNT_KEY'
          value: storageAccount.listKeys().keys[0].value
        }
        {
          name: 'BLOB_CONTAINER_AITRIOS_IMAGES'
          value: 'aitrios-images'
        }
        // AI Search関連の設定は削除済み（初期実装では不要）
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
      ]
    }
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





// Blob Container - AITRIOS画像データ
resource aitriosImageBlobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2021-09-01' = {
  parent: blobService
  name: 'aitrios-images'
  properties: {
    publicAccess: 'None'
    metadata: {
      type: 'aitrios-images'
      description: 'AITRIOS人物検知画像のBlobストレージ'
    }
  }
}

// AI Search関連のコードは削除済み（初期実装では不要）

// AI Search関連のリソースは削除済み（初期実装では不要）

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



// Static Web App - VMクォータを消費しない代替案
resource staticWebApp 'Microsoft.Web/staticSites@2021-02-01' = {
  name: 'swa-${projectName}-${environment}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    branch: 'main'
    buildProperties: {
      apiLocation: '/api'
      appLocation: '/'
      outputLocation: '/dist'
    }
  }
  tags: tags
}

// Static Web App の API 設定
resource staticWebAppApi 'Microsoft.Web/staticSites/config@2021-02-01' = {
  parent: staticWebApp
  name: 'api'
  properties: {
    apiKey: 'auto-generated'
    cors: {
      allowedOrigins: ['*']
    }
    routes: [
      {
        route: '/api/*'
        allowedRoles: ['anonymous']
      }
    ]
  }
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
output dashboardApiUrl string = dashboardApi.properties.defaultHostName

output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output keyVaultName string = keyVault.name
output appInsightsKey string = appInsights.properties.InstrumentationKey
output storageAccountName string = storageAccount.name
// AI Search関連のoutputsは削除済み（初期実装では不要）
output blobContainerAitriosImages string = aitriosImageBlobContainer.name
