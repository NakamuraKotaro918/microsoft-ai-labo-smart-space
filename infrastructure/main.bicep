// MASS プロジェクト - Azure インフラストラクチャ
// Microsoft AI Labo スマート空間最適化ダッシュボード

@description('プロジェクト名')
param projectName string = 'mass-smart-space'

@description('環境名')
param environment string = 'dev'

@description('Azure リージョン')
param location string = 'Japan East'

@description('リソースグループ名')
param resourceGroupName string = 'MS-Lab-Proj-RG'

@description('管理者パスワード')
@secure()
param adminPassword string

@description('Cosmos DB アカウント名')
param cosmosAccountName string = 'cosmos-${replace(projectName, '-', '')}${environment}'

@description('IoT Hub 名')
param iotHubName string = 'iot-${replace(projectName, '-', '')}${environment}'

@description('App Service Plan SKU')
param appServicePlanSku string = 'B1'

@description('PostgreSQL サーバー名')
param postgresqlServerName string = 'psql-${replace(projectName, '-', '')}${environment}'

@description('PostgreSQL 管理者ユーザー名')
param postgresqlAdminUsername string = 'admin'

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

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: 'asp-${projectName}-${environment}'
  location: location
  sku: {
    name: appServicePlanSku
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
  tags: tags
}

// App Service - Dashboard API
resource dashboardApi 'Microsoft.Web/sites@2021-02-01' = {
  name: 'api-${projectName}-${environment}'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.9'
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
          name: 'BLOB_CONTAINER_SENSOR'
          value: 'sensor-data'
        }
        {
          name: 'BLOB_CONTAINER_ANALYSIS'
          value: 'analysis-data'
        }
        {
          name: 'BLOB_CONTAINER_IMAGE'
          value: 'image-data'
        }
        {
          name: 'SEARCH_SERVICE_NAME'
          value: searchService.name
        }
        {
          name: 'SEARCH_SERVICE_KEY'
          value: searchService.listAdminKeys().primaryKey
        }
        {
          name: 'SEARCH_INDEX_NAME'
          value: 'sensor-data-index'
        }
      ]
    }
  }
  tags: tags
}

// PostgreSQL サーバー
resource postgresqlServer 'Microsoft.DBforPostgreSQL/servers@2017-12-01' = {
  name: postgresqlServerName
  location: location
  sku: {
    name: 'B_Gen5_1'
    tier: 'Basic'
    capacity: 1
    family: 'Gen5'
  }
  properties: {
    administratorLogin: postgresqlAdminUsername
    administratorLoginPassword: adminPassword
    version: '11'
    createMode: 'Default'
    sslEnforcement: 'Enabled'
    minimalTlsVersion: 'TLS1_2'
    storageProfile: {
      storageMB: 5120
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
      storageAutogrow: 'Enabled'
    }
  }
  tags: tags
}

// PostgreSQL データベース
resource postgresqlDatabase 'Microsoft.DBforPostgreSQL/servers/databases@2017-12-01' = {
  parent: postgresqlServer
  name: 'smart_space_db'
  properties: {
    charset: 'utf8'
    collation: 'utf8_general_ci'
  }
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

// AI Search インデックス - センサーデータ
resource sensorDataIndex 'Microsoft.Search/searchServices/indexes@2020-08-01' = {
  parent: searchService
  name: 'sensor-data-index'
  properties: {
    fields: [
      {
        name: 'id'
        type: 'Edm.String'
        key: true
        searchable: false
        filterable: false
        sortable: false
        facetable: false
        retrievable: true
      }
      {
        name: 'deviceId'
        type: 'Edm.String'
        searchable: true
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'deviceType'
        type: 'Edm.String'
        searchable: true
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'timestamp'
        type: 'Edm.DateTimeOffset'
        searchable: false
        filterable: true
        sortable: true
        facetable: false
        retrievable: true
      }
      {
        name: 'temperature'
        type: 'Edm.Double'
        searchable: false
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'humidity'
        type: 'Edm.Double'
        searchable: false
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'co2'
        type: 'Edm.Double'
        searchable: false
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'personCount'
        type: 'Edm.Int32'
        searchable: false
        filterable: true
        sortable: true
        facetable: true
        retrievable: true
      }
      {
        name: 'content'
        type: 'Edm.String'
        searchable: true
        filterable: false
        sortable: false
        facetable: false
        retrievable: true
        analyzer: 'ja.microsoft'
      }
    ]
    suggesters: [
      {
        name: 'sg'
        searchMode: 'analyzingInfixMatching'
        sourceFields: ['deviceId', 'deviceType', 'content']
      }
    ]
  }
}

// AI Search データソース - Cosmos DB
resource cosmosDataSource 'Microsoft.Search/searchServices/dataSources@2020-08-01' = {
  parent: searchService
  name: 'cosmos-datasource'
  properties: {
    type: 'cosmosdb'
    credentials: {
      connectionString: 'AccountEndpoint=${cosmosAccount.properties.documentEndpoint};AccountKey=${cosmosAccount.listKeys().primaryMasterKey};Database=smart-space-db'
    }
    container: {
      name: 'sensor-data'
      query: 'SELECT * FROM c WHERE c.type = "sensor_data"'
    }
    dataChangeDetectionPolicy: {
      '@odata.type': '#Microsoft.Azure.Search.HighWaterMarkChangeDetectionPolicy'
      highWaterMarkColumnName: '_ts'
    }
    dataDeletionDetectionPolicy: {
      '@odata.type': '#Microsoft.Azure.Search.SoftDeleteColumnDeletionDetectionPolicy'
      softDeleteColumnName: 'isDeleted'
      softDeleteMarkerValue: 'true'
    }
  }
}

// AI Search インデクサー
resource searchIndexer 'Microsoft.Search/searchServices/indexers@2020-08-01' = {
  parent: searchService
  name: 'sensor-data-indexer'
  properties: {
    dataSourceName: cosmosDataSource.name
    targetIndexName: sensorDataIndex.name
    schedule: {
      interval: 'PT1H'
    }
    parameters: {
      configuration: {
        queryTimeout: '00:05:00'
        maxFailedItems: 10
        maxFailedItemsPerBatch: 5
      }
    }
  }
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

// CDN Profile
resource cdnProfile 'Microsoft.Cdn/profiles@2021-06-01' = {
  name: 'cdn-${projectName}-${environment}'
  location: 'global'
  sku: {
    name: 'Standard_Microsoft'
  }
  tags: tags
}

// CDN Endpoint
resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2021-06-01' = {
  parent: cdnProfile
  name: 'endpoint-${projectName}-${environment}'
  location: 'global'
  properties: {
    originHostHeader: dashboardApi.properties.defaultHostName
    origins: [
      {
        name: 'api-origin'
        properties: {
          hostName: dashboardApi.properties.defaultHostName
          httpPort: 80
          httpsPort: 443
        }
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
output cdnEndpointUrl string = cdnEndpoint.properties.hostName
output keyVaultName string = keyVault.name
output appInsightsKey string = appInsights.properties.InstrumentationKey
output storageAccountName string = storageAccount.name
output searchServiceName string = searchService.name
output searchServiceUrl string = 'https://${searchService.name}.search.windows.net'
output blobContainerSensor string = sensorDataBlobContainer.name
output blobContainerAnalysis string = analysisDataBlobContainer.name
output blobContainerImage string = imageDataBlobContainer.name
