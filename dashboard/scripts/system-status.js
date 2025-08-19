/**
 * システム稼働状況管理
 * SONY ITRIOSとSmartPhoneの稼働状況を表示・更新
 */

class SystemStatusManager {
    constructor() {
        this.updateInterval = 5000; // 5秒間隔で更新
        this.systemData = {
            itrios: {
                status: 'online',
                uptime: 0,
                frames: 1247892,
                successRate: 98.7,
                cpu: 45,
                memory: 2.1,
                temperature: 42
            },
            smartphone: {
                status: 'online',
                uptime: 0,
                analyses: 3847,
                apiRate: 96.2,
                battery: 78,
                storage: 45.2,
                network: '5G 良好'
            },
            integration: {
                processingTime: 2.3,
                syncRate: 99.1,
                errorRate: 0.3,
                steps: {
                    step1: 'active',
                    step2: 'active',
                    step3: 'active',
                    step4: 'active'
                }
            }
        };
        
        this.startTime = Date.now();
        this.init();
    }

    init() {
        this.updateSystemStatus();
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateSystemStatus();
        }, this.updateInterval);
    }

    updateSystemStatus() {
        this.updateUptime();
        this.updateItriosStatus();
        this.updateSmartphoneStatus();
        this.updateIntegrationStatus();
        this.simulateRealisticChanges();
    }

    updateUptime() {
        const currentTime = Date.now();
        const uptimeMs = currentTime - this.startTime;
        
        // ITRIOS稼働時間（より長い稼働時間をシミュレート）
        const itriosUptimeMs = uptimeMs + (24 * 60 * 60 * 1000); // 24時間追加
        this.systemData.itrios.uptime = this.formatUptime(itriosUptimeMs);
        
        // SmartPhone稼働時間
        const smartphoneUptimeMs = uptimeMs + (18 * 60 * 60 * 1000); // 18時間追加
        this.systemData.smartphone.uptime = this.formatUptime(smartphoneUptimeMs);
    }

    formatUptime(uptimeMs) {
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    updateItriosStatus() {
        const data = this.systemData.itrios;
        
        // フレーム数を増加
        data.frames += Math.floor(Math.random() * 50) + 20;
        
        // CPU使用率の変動
        data.cpu = Math.max(30, Math.min(80, data.cpu + (Math.random() - 0.5) * 10));
        
        // メモリ使用量の変動
        data.memory = Math.max(1.5, Math.min(3.0, data.memory + (Math.random() - 0.5) * 0.2));
        
        // 温度の変動
        data.temperature = Math.max(35, Math.min(50, data.temperature + (Math.random() - 0.5) * 3));
        
        // 成功率の微調整
        data.successRate = Math.max(95, Math.min(100, data.successRate + (Math.random() - 0.5) * 0.5));

        // DOM更新
        this.updateElement('itrios-uptime', data.uptime);
        this.updateElement('itrios-frames', data.frames.toLocaleString());
        this.updateElement('itrios-success-rate', `${data.successRate.toFixed(1)}%`);
        this.updateElement('itrios-cpu', `${Math.round(data.cpu)}%`);
        this.updateElement('itrios-memory', `${data.memory.toFixed(1)}GB`);
        this.updateElement('itrios-temp', `${Math.round(data.temperature)}°C`);
        
        // ステータス更新
        this.updateStatusIndicator('itrios-status', data.status);
    }

    updateSmartphoneStatus() {
        const data = this.systemData.smartphone;
        
        // 分析処理数を増加
        data.analyses += Math.floor(Math.random() * 5) + 1;
        
        // バッテリーの減少
        if (Math.random() < 0.1) { // 10%の確率でバッテリー減少
            data.battery = Math.max(20, data.battery - 1);
        }
        
        // ストレージの増加
        if (Math.random() < 0.05) { // 5%の確率でストレージ増加
            data.storage = Math.min(60, data.storage + 0.1);
        }
        
        // API成功率の微調整
        data.apiRate = Math.max(90, Math.min(100, data.apiRate + (Math.random() - 0.5) * 0.3));

        // DOM更新
        this.updateElement('smartphone-uptime', data.uptime);
        this.updateElement('smartphone-analyses', data.analyses.toLocaleString());
        this.updateElement('smartphone-api-rate', `${data.apiRate.toFixed(1)}%`);
        this.updateElement('smartphone-battery', `${data.battery}%`);
        this.updateElement('smartphone-storage', `${data.storage.toFixed(1)}GB`);
        this.updateElement('smartphone-network', data.network);
        
        // ステータス更新
        this.updateStatusIndicator('smartphone-status', data.status);
    }

    updateIntegrationStatus() {
        const data = this.systemData.integration;
        
        // 処理時間の変動
        data.processingTime = Math.max(1.0, Math.min(5.0, data.processingTime + (Math.random() - 0.5) * 0.5));
        
        // 同期率の微調整
        data.syncRate = Math.max(95, Math.min(100, data.syncRate + (Math.random() - 0.5) * 0.2));
        
        // エラー発生率の微調整
        data.errorRate = Math.max(0, Math.min(2, data.errorRate + (Math.random() - 0.5) * 0.1));

        // DOM更新
        this.updateElement('integration-processing-time', `${data.processingTime.toFixed(1)}秒`);
        this.updateElement('integration-sync-rate', `${data.syncRate.toFixed(1)}%`);
        this.updateElement('integration-error-rate', `${data.errorRate.toFixed(1)}%`);
        
        // ステップ状況更新
        Object.keys(data.steps).forEach(stepId => {
            this.updateStepStatus(stepId, data.steps[stepId]);
        });
    }

    simulateRealisticChanges() {
        // 時々システム状況を変更
        if (Math.random() < 0.02) { // 2%の確率
            this.simulateSystemEvent();
        }
    }

    simulateSystemEvent() {
        const events = [
            () => {
                // 一時的なCPU負荷増加
                this.systemData.itrios.cpu = Math.min(90, this.systemData.itrios.cpu + 20);
                console.log('システムイベント: ITRIOS CPU負荷増加');
            },
            () => {
                // 一時的なAPI成功率低下
                this.systemData.smartphone.apiRate = Math.max(85, this.systemData.smartphone.apiRate - 5);
                console.log('システムイベント: SmartPhone API成功率低下');
            },
            () => {
                // 処理時間の一時的増加
                this.systemData.integration.processingTime = Math.min(8, this.systemData.integration.processingTime + 2);
                console.log('システムイベント: 統合処理時間増加');
            }
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        randomEvent();
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateStatusIndicator(statusId, status) {
        const statusElement = document.getElementById(statusId);
        if (!statusElement) return;

        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');
        
        if (dot && text) {
            // クラスをリセット
            dot.className = 'status-dot';
            
            switch (status) {
                case 'online':
                    dot.classList.add('online');
                    text.textContent = '稼働中';
                    break;
                case 'offline':
                    dot.classList.add('offline');
                    text.textContent = '停止中';
                    break;
                case 'warning':
                    dot.classList.add('warning');
                    text.textContent = '警告';
                    break;
                default:
                    dot.classList.add('online');
                    text.textContent = '稼働中';
            }
        }
    }

    updateStepStatus(stepId, status) {
        const stepElement = document.getElementById(`${stepId}-status`);
        if (!stepElement) return;

        // クラスをリセット
        stepElement.className = 'step-status';
        
        switch (status) {
            case 'active':
                stepElement.classList.add('active');
                stepElement.textContent = '✓';
                break;
            case 'inactive':
                stepElement.classList.add('inactive');
                stepElement.textContent = '✗';
                break;
            case 'warning':
                stepElement.classList.add('warning');
                stepElement.textContent = '!';
                break;
            default:
                stepElement.classList.add('active');
                stepElement.textContent = '✓';
        }
    }

    // 手動でシステム状況を変更するメソッド（デモ用）
    toggleSystemStatus(systemName) {
        if (this.systemData[systemName]) {
            const currentStatus = this.systemData[systemName].status;
            this.systemData[systemName].status = currentStatus === 'online' ? 'offline' : 'online';
            console.log(`${systemName} ステータスを ${this.systemData[systemName].status} に変更`);
        }
    }

    // システム情報を取得するメソッド
    getSystemInfo() {
        return {
            itrios: { ...this.systemData.itrios },
            smartphone: { ...this.systemData.smartphone },
            integration: { ...this.systemData.integration }
        };
    }
}

// グローバルインスタンス
let systemStatusManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    systemStatusManager = new SystemStatusManager();
    
    // デバッグ用：グローバルアクセス
    window.systemStatusManager = systemStatusManager;
});

// デモ用関数
function toggleItriosStatus() {
    if (systemStatusManager) {
        systemStatusManager.toggleSystemStatus('itrios');
    }
}

function toggleSmartphoneStatus() {
    if (systemStatusManager) {
        systemStatusManager.toggleSystemStatus('smartphone');
    }
}

function getSystemInfo() {
    if (systemStatusManager) {
        return systemStatusManager.getSystemInfo();
    }
    return null;
}
