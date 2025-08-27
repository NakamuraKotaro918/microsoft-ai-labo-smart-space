// 個人GitHubアカウント用 Static Web App
@description('プロジェクト名')
param projectName string = 'mass-smart-space'

@description('環境名')
param environment string = 'test'

@description('Azure リージョン')
param location string = 'East Asia'

@description('個人GitHubリポジトリURL')
param repositoryUrl string = 'https://github.com/your-username/your-repo'

// タグの定義
var tags = {
  project: projectName
  environment: environment
  managedBy: 'bicep'
  version: '1.0.0'
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2021-02-01' = {
  name: 'swa-${projectName}-${environment}-personal'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: 'main'
    buildProperties: {
      apiLocation: '/api'
      appLocation: '/dashboard'
      outputLocation: '/'
    }
  }
  tags: tags
}

// Outputs
output staticWebAppName string = staticWebApp.name
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
