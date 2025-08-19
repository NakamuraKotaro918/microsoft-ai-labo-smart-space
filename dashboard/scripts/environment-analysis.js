/**
 * 環境データ分析・アラート機能
 * 環境データの監視、分析、アラート生成を管理
 */

class EnvironmentAnalysisManager {
    constructor() {
        this.updateInterval = 3000; // 3秒間隔で更新
        this.alerts = [];
        this.alertId = 1;
        this.isMuted = false;
        
        // 環境データ履歴
        this.environmentHistory = {
            temperature: [],
            humidity: [],
            co2: [],
            aqi: []
        };
        
        // アラート閾値
        this.thresholds = {
            temperature: { min: 18, max: 26 },
            humidity: { min: 35, max: 65 },
            co2: { max: 1000 },
            aqi: { max: 50 }
        };
        
        // チャートインスタンス
        this.charts = {};
        
        this.init();
    }

    init() {
        this.initializeCharts();
        this.updateEnvironmentData();
        this.startAutoUpdate();
        this.setupControlListeners();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateEnvironmentData();
            this.checkAlerts();
        }, this.updateInterval);
    }

    updateEnvironmentData() {
        // 現在の環境データを生成（実際の実装では APIから取得）
        const currentData = this.generateEnvironmentData();
        
        // 履歴に追加
        this.addToHistory(currentData);
        
        // UI更新
        this.updateOverviewCards(currentData);
        this.updateCharts();
        this.updatePredictions(currentData);
    }

    generateEnvironmentData() {
        const hour = new Date().getHours();
        const baseTemp = 22 + Math.sin((hour - 6) * Math.PI / 12) * 3;
        const baseHumidity = 50 + Math.sin((hour - 3) * Math.PI / 12) * 10;
        const baseCO2 = 400 + (hour >= 9 && hour <= 18 ? 200 : 0) + Math.random() * 100;
        const baseAQI = 30 + Math.random() * 30;

        return {
            temperature: Math.round((baseTemp + (Math.random() - 0.5) * 4) * 10) / 10,
            humidity: Math.round(baseHumidity + (Math.random() - 0.5) * 10),
            co2: Math.round(baseCO2 + (Math.random() - 0.5) * 50),
            aqi: Math.round(baseAQI + (Math.random() - 0.5) * 10),
            timestamp: new Date()
        };
    }

    addToHistory(data) {
        const maxHistory = 100; // 最大100データポイント
        
        Object.keys(this.environmentHistory).forEach(key => {
            this.environmentHistory[key].push({
                value: data[key],
                timestamp: data.timestamp
            });
            
            // 履歴サイズ制限
            if (this.environmentHistory[key].length > maxHistory) {
                this.environmentHistory[key].shift();
            }
        });
    }

    updateOverviewCards(data) {
        // 温度カード
        this.updateElement('current-temp', `${data.temperature}°C`);
        this.updateStatusBadge('temp-status', data.temperature, this.thresholds.temperature);
        this.updateTrend('temp-trend', 'temp-trend-text', this.getTrend('temperature'));

        // 湿度カード
        this.updateElement('current-humidity', `${data.humidity}%`);
        this.updateStatusBadge('humidity-status', data.humidity, this.thresholds.humidity);
        this.updateTrend('humidity-trend', 'humidity-trend-text', this.getTrend('humidity'));

        // CO2カード
        this.updateElement('current-co2', `${data.co2}ppm`);
        this.updateStatusBadge('co2-status', data.co2, { max: this.thresholds.co2.max });
        this.updateTrend('co2-trend', 'co2-trend-text', this.getTrend('co2'));

        // 空気質指数カード
        this.updateElement('current-aqi', data.aqi.toString());
        this.updateStatusBadge('aqi-status', data.aqi, { max: this.thresholds.aqi.max });
        this.updateTrend('aqi-trend', 'aqi-trend-text', this.getTrend('aqi'));
    }

    updateStatusBadge(elementId, value, threshold) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let status = 'normal';
        let text = '正常';

        if (threshold.min !== undefined && value < threshold.min) {
            status = 'warning';
            text = '低い';
        } else if (threshold.max !== undefined && value > threshold.max) {
            status = 'critical';
            text = '高い';
        } else if (elementId === 'aqi-status') {
            if (value <= 50) {
                text = '良好';
            } else if (value <= 100) {
                status = 'warning';
                text = '普通';
            } else {
                status = 'critical';
                text = '悪い';
            }
        }

        element.className = `status-badge ${status}`;
        element.textContent = text;
    }

    getTrend(metric) {
        const history = this.environmentHistory[metric];
        if (history.length < 5) return { direction: 'stable', text: '安定' };

        const recent = history.slice(-5);
        const avg1 = recent.slice(0, 2).reduce((sum, item) => sum + item.value, 0) / 2;
        const avg2 = recent.slice(-2).reduce((sum, item) => sum + item.value, 0) / 2;

        const diff = avg2 - avg1;
        const threshold = metric === 'temperature' ? 0.5 : metric === 'humidity' ? 2 : 10;

        if (Math.abs(diff) < threshold) {
            return { direction: 'stable', text: '安定' };
        } else if (diff > 0) {
            return { direction: 'up', text: '上昇傾向' };
        } else {
            return { direction: 'down', text: '下降傾向' };
        }
    }

    updateTrend(arrowId, textId, trend) {
        const arrowElement = document.getElementById(arrowId);
        const textElement = document.getElementById(textId);
        
        if (arrowElement && textElement) {
            arrowElement.className = `trend-arrow ${trend.direction}`;
            
            switch (trend.direction) {
                case 'up':
                    arrowElement.textContent = '↗';
                    break;
                case 'down':
                    arrowElement.textContent = '↘';
                    break;
                default:
                    arrowElement.textContent = '→';
            }
            
            textElement.textContent = trend.text;
        }
    }

    checkAlerts() {
        if (this.isMuted) return;

        const latestData = this.getLatestData();
        if (!latestData) return;

        // 温度アラート
        if (latestData.temperature < this.thresholds.temperature.min) {
            this.createAlert('warning', '温度低下警告', 
                `室温が${latestData.temperature}°Cまで低下しています。暖房の調整を推奨します。`);
        } else if (latestData.temperature > this.thresholds.temperature.max) {
            this.createAlert('critical', '温度上昇警告', 
                `室温が${latestData.temperature}°Cまで上昇しています。冷房の調整を推奨します。`);
        }

        // 湿度アラート
        if (latestData.humidity < this.thresholds.humidity.min) {
            this.createAlert('warning', '湿度低下警告', 
                `湿度が${latestData.humidity}%まで低下しています。加湿器の使用を推奨します。`);
        } else if (latestData.humidity > this.thresholds.humidity.max) {
            this.createAlert('warning', '湿度上昇警告', 
                `湿度が${latestData.humidity}%まで上昇しています。除湿を推奨します。`);
        }

        // CO2アラート
        if (latestData.co2 > this.thresholds.co2.max) {
            this.createAlert('critical', 'CO2濃度警告', 
                `CO2濃度が${latestData.co2}ppmに達しています。即座に換気を実施してください。`);
        }

        // 空気質指数アラート
        if (latestData.aqi > 100) {
            this.createAlert('critical', '空気質悪化警告', 
                `空気質指数が${latestData.aqi}に達しています。空気清浄機の使用を推奨します。`);
        }
    }

    createAlert(level, title, message) {
        // 重複アラートチェック
        const isDuplicate = this.alerts.some(alert => 
            alert.title === title && alert.message === message && 
            (Date.now() - alert.timestamp) < 300000 // 5分以内の重複を除外
        );

        if (isDuplicate) return;

        const alert = {
            id: this.alertId++,
            level: level,
            title: title,
            message: message,
            timestamp: Date.now()
        };

        this.alerts.unshift(alert);
        this.renderAlerts();

        // 音声通知（実際の実装では音声ファイルを再生）
        console.log(`🚨 ${level.toUpperCase()}: ${title} - ${message}`);
    }

    renderAlerts() {
        const alertList = document.getElementById('alert-list');
        if (!alertList) return;

        if (this.alerts.length === 0) {
            alertList.innerHTML = '<div class="no-data-message">現在アラートはありません</div>';
            return;
        }

        alertList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item ${alert.level}" data-alert-id="${alert.id}">
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${this.formatTime(alert.timestamp)}</div>
                </div>
                <button class="alert-dismiss" onclick="environmentAnalysisManager.dismissAlert(${alert.id})">
                    ×
                </button>
            </div>
        `).join('');
    }

    dismissAlert(alertId) {
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        this.renderAlerts();
    }

    clearAllAlerts() {
        this.alerts = [];
        this.renderAlerts();
    }

    muteAlerts() {
        this.isMuted = !this.isMuted;
        const button = document.querySelector('.alert-controls .alert-button:last-child');
        if (button) {
            button.textContent = this.isMuted ? '通知再開' : '通知停止';
        }
    }

    getLatestData() {
        const temp = this.environmentHistory.temperature;
        const humidity = this.environmentHistory.humidity;
        const co2 = this.environmentHistory.co2;
        const aqi = this.environmentHistory.aqi;

        if (temp.length === 0) return null;

        return {
            temperature: temp[temp.length - 1].value,
            humidity: humidity[humidity.length - 1].value,
            co2: co2[co2.length - 1].value,
            aqi: aqi[aqi.length - 1].value
        };
    }

    initializeCharts() {
        // リアルタイム環境データチャート
        this.initRealtimeChart();
        
        // 環境指標レーダーチャート
        this.initRadarChart();
        
        // 予測チャート
        this.initPredictionCharts();
    }

    initRealtimeChart() {
        const ctx = document.getElementById('realtime-environment-chart');
        if (!ctx) return;

        this.charts.realtime = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '温度 (°C)',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        yAxisID: 'y'
                    },
                    {
                        label: '湿度 (%)',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        yAxisID: 'y1'
                    },
                    {
                        label: 'CO2 (ppm)',
                        data: [],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: '時刻' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '温度 (°C)' },
                        min: 15,
                        max: 30
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '湿度 (%)' },
                        min: 20,
                        max: 80,
                        grid: { drawOnChartArea: false }
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        min: 300,
                        max: 1200
                    }
                },
                plugins: {
                    legend: { display: true, position: 'top' }
                }
            }
        });
    }

    initRadarChart() {
        const ctx = document.getElementById('environment-radar-chart');
        if (!ctx) return;

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['温度', '湿度', 'CO2', '空気質', '快適度'],
                datasets: [{
                    label: '現在の環境品質',
                    data: [80, 75, 90, 85, 82],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { stepSize: 20 }
                    }
                }
            }
        });
    }

    initPredictionCharts() {
        // 温度予測チャート
        const tempCtx = document.getElementById('temp-prediction-chart');
        if (tempCtx) {
            this.charts.tempPrediction = new Chart(tempCtx, {
                type: 'line',
                data: {
                    labels: ['現在', '30分後', '1時間後', '2時間後'],
                    datasets: [{
                        label: '予測温度',
                        data: [22.5, 23.1, 23.8, 24.5],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
    }

    updateCharts() {
        if (this.charts.realtime) {
            this.updateRealtimeChart();
        }
        if (this.charts.radar) {
            this.updateRadarChart();
        }
    }

    updateRealtimeChart() {
        const chart = this.charts.realtime;
        const maxPoints = 20;

        // 最新20データポイントを取得
        const tempData = this.environmentHistory.temperature.slice(-maxPoints);
        const humidityData = this.environmentHistory.humidity.slice(-maxPoints);
        const co2Data = this.environmentHistory.co2.slice(-maxPoints);

        if (tempData.length === 0) return;

        chart.data.labels = tempData.map(item => 
            item.timestamp.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );

        chart.data.datasets[0].data = tempData.map(item => item.value);
        chart.data.datasets[1].data = humidityData.map(item => item.value);
        chart.data.datasets[2].data = co2Data.map(item => item.value);

        chart.update('none');
    }

    updateRadarChart() {
        const latestData = this.getLatestData();
        if (!latestData) return;

        // 各指標を0-100のスケールに正規化
        const tempScore = Math.max(0, Math.min(100, 100 - Math.abs(latestData.temperature - 22) * 10));
        const humidityScore = Math.max(0, Math.min(100, 100 - Math.abs(latestData.humidity - 50) * 2));
        const co2Score = Math.max(0, Math.min(100, (1200 - latestData.co2) / 8));
        const aqiScore = Math.max(0, Math.min(100, (150 - latestData.aqi) * 2));
        const comfortScore = (tempScore + humidityScore + co2Score + aqiScore) / 4;

        this.charts.radar.data.datasets[0].data = [
            tempScore, humidityScore, co2Score, aqiScore, comfortScore
        ];

        this.charts.radar.update('none');
    }

    updatePredictions(currentData) {
        // 温度予測テキスト更新
        const tempPrediction = currentData.temperature + 2;
        this.updateElement('temp-prediction-text', 
            `現在の傾向から、2時間後に${tempPrediction.toFixed(1)}°Cに達する予測です。`);
        
        // 推奨アクション更新
        if (tempPrediction > 25) {
            this.updateElement('temp-recommendation', '空調設定を1°C下げることを推奨');
        } else if (tempPrediction < 20) {
            this.updateElement('temp-recommendation', '暖房設定を1°C上げることを推奨');
        } else {
            this.updateElement('temp-recommendation', '現在の設定を維持');
        }
    }

    setupControlListeners() {
        // 目標温度スライダー
        const tempSlider = document.getElementById('target-temp');
        const tempValue = document.getElementById('target-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = `${e.target.value}°C`;
            });
        }

        // 目標湿度スライダー
        const humiditySlider = document.getElementById('target-humidity');
        const humidityValue = document.getElementById('target-humidity-value');
        if (humiditySlider && humidityValue) {
            humiditySlider.addEventListener('input', (e) => {
                humidityValue.textContent = `${e.target.value}%`;
            });
        }

        // 換気レベルスライダー
        const ventilationSlider = document.getElementById('ventilation-level');
        const ventilationValue = document.getElementById('ventilation-level-value');
        if (ventilationSlider && ventilationValue) {
            ventilationSlider.addEventListener('input', (e) => {
                ventilationValue.textContent = `${e.target.value}%`;
            });
        }

        // 閾値設定の監視
        ['temp-min', 'temp-max', 'humidity-min', 'humidity-max', 'co2-max'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updateThresholds());
            }
        });
    }

    updateThresholds() {
        const tempMin = document.getElementById('temp-min');
        const tempMax = document.getElementById('temp-max');
        const humidityMin = document.getElementById('humidity-min');
        const humidityMax = document.getElementById('humidity-max');
        const co2Max = document.getElementById('co2-max');

        if (tempMin && tempMax) {
            this.thresholds.temperature.min = parseFloat(tempMin.value);
            this.thresholds.temperature.max = parseFloat(tempMax.value);
        }

        if (humidityMin && humidityMax) {
            this.thresholds.humidity.min = parseInt(humidityMin.value);
            this.thresholds.humidity.max = parseInt(humidityMax.value);
        }

        if (co2Max) {
            this.thresholds.co2.max = parseInt(co2Max.value);
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// 分析タブ切り替え関数
function showAnalysisTab(tabName) {
    // すべてのタブコンテンツを非表示
    document.querySelectorAll('.analysis-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // すべてのタブボタンを非アクティブ
    document.querySelectorAll('.analysis-tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // 選択されたタブを表示
    const selectedContent = document.getElementById(`${tabName}-analysis`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // 選択されたボタンをアクティブ
    event.target.classList.add('active');
}

// 制御関数
function clearAllAlerts() {
    if (window.environmentAnalysisManager) {
        window.environmentAnalysisManager.clearAllAlerts();
    }
}

function muteAlerts() {
    if (window.environmentAnalysisManager) {
        window.environmentAnalysisManager.muteAlerts();
    }
}

function triggerVentilation() {
    if (window.environmentAnalysisManager) {
        window.environmentAnalysisManager.createAlert('info', '換気実行', '手動換気を開始しました。');
    }
    console.log('換気システムを手動で実行しました');
}

// デモ用関数
function generateDemoAlert() {
    if (window.environmentAnalysisManager) {
        const demoAlerts = [
            {
                level: 'critical',
                title: '温度上昇警告',
                message: '室温が28.5°Cまで上昇しています。冷房の調整を推奨します。'
            },
            {
                level: 'warning',
                title: '湿度低下警告',
                message: '湿度が32%まで低下しています。加湿器の使用を推奨します。'
            },
            {
                level: 'critical',
                title: 'CO2濃度警告',
                message: 'CO2濃度が1150ppmに達しています。即座に換気を実施してください。'
            },
            {
                level: 'warning',
                title: '空気質悪化警告',
                message: '空気質指数が85に達しています。空気清浄機の使用を推奨します。'
            }
        ];
        
        const randomAlert = demoAlerts[Math.floor(Math.random() * demoAlerts.length)];
        window.environmentAnalysisManager.createAlert(
            randomAlert.level,
            randomAlert.title,
            randomAlert.message
        );
    }
}

// グローバルインスタンス
let environmentAnalysisManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    // 環境データ分析タブが存在する場合のみ初期化
    if (document.getElementById('environment-tab')) {
        environmentAnalysisManager = new EnvironmentAnalysisManager();
        window.environmentAnalysisManager = environmentAnalysisManager;
    }
});
