/**
 * 個人開発部屋モニターシステム
 * 環境データの監視と制御機能
 */

class RoomMonitorManager {
    constructor() {
        this.updateInterval = 5000; // 5秒間隔で更新
        this.roomData = {
            temperature: 22.5,
            humidity: 55,
            co2: 450,
            airQuality: 'good',
            occupancy: 'occupied'
        };
        
        // 環境データ履歴
        this.environmentHistory = {
            temperature: [],
            humidity: [],
            co2: [],
            timestamps: []
        };
        
        // チャートインスタンス
        this.charts = {};
        
        this.init();
    }

    init() {
        this.initializeCharts();
        this.updateRoomData();
        this.startAutoUpdate();
        this.setupControlListeners();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateRoomData();
        }, this.updateInterval);
    }

    updateRoomData() {
        // 環境データを生成（実際の実装ではAPIから取得）
        this.generateRoomData();
        
        // UI更新
        this.updateEnvironmentCards();
        this.updateUsageStats();
        this.updateCharts();
        this.updateOptimizationSuggestions();
    }

    generateRoomData() {
        const hour = new Date().getHours();
        const isWorkingHours = hour >= 9 && hour <= 18;
        
        // 温度（作業時間中は少し高め）
        const baseTemp = isWorkingHours ? 23 : 21;
        this.roomData.temperature = Math.round((baseTemp + (Math.random() - 0.5) * 2) * 10) / 10;
        
        // 湿度（季節変動を考慮）
        this.roomData.humidity = Math.round(50 + (Math.random() - 0.5) * 20);
        
        // CO2濃度（在室時は高め）
        const baseCO2 = isWorkingHours ? 600 : 400;
        this.roomData.co2 = Math.round(baseCO2 + (Math.random() - 0.5) * 200);
        
        // 空気質
        if (this.roomData.co2 < 500) {
            this.roomData.airQuality = 'excellent';
        } else if (this.roomData.co2 < 800) {
            this.roomData.airQuality = 'good';
        } else if (this.roomData.co2 < 1000) {
            this.roomData.airQuality = 'fair';
        } else {
            this.roomData.airQuality = 'poor';
        }
        
        // 在室状況
        this.roomData.occupancy = isWorkingHours && Math.random() > 0.2 ? 'occupied' : 'vacant';
        
        // 履歴に追加
        this.addToHistory();
    }

    addToHistory() {
        const maxHistory = 48; // 24時間分（30分間隔）
        const now = new Date();
        
        this.environmentHistory.temperature.push(this.roomData.temperature);
        this.environmentHistory.humidity.push(this.roomData.humidity);
        this.environmentHistory.co2.push(this.roomData.co2);
        this.environmentHistory.timestamps.push(now);
        
        // 履歴サイズ制限
        Object.keys(this.environmentHistory).forEach(key => {
            if (this.environmentHistory[key].length > maxHistory) {
                this.environmentHistory[key].shift();
            }
        });
    }

    updateEnvironmentCards() {
        // 温度
        this.updateElement('room-temperature', this.roomData.temperature);
        this.updateStatusBadge('temperature-status', this.roomData.temperature, { min: 20, max: 26 });
        this.updateTrend('temperature-trend', this.getTrend('temperature'));

        // 湿度
        this.updateElement('room-humidity', this.roomData.humidity);
        this.updateStatusBadge('humidity-status', this.roomData.humidity, { min: 40, max: 60 });
        this.updateTrend('humidity-trend', this.getTrend('humidity'));

        // CO2
        this.updateElement('room-co2', this.roomData.co2);
        this.updateStatusBadge('co2-status', this.roomData.co2, { max: 1000 });
        this.updateTrend('co2-trend', this.getTrend('co2'));

        // 空気質
        const airQualityText = {
            'excellent': '優秀',
            'good': '良好',
            'fair': '普通',
            'poor': '悪い'
        };
        this.updateElement('room-air-quality', airQualityText[this.roomData.airQuality]);
        this.updateStatusBadge('air-quality-status', this.roomData.airQuality, {});
        this.updateTrend('air-quality-trend', { direction: 'stable', text: '安定' });

        // 部屋の使用状況
        const statusIndicator = document.getElementById('room-status-indicator');
        const statusText = document.getElementById('room-status-text');
        
        if (statusIndicator && statusText) {
            if (this.roomData.occupancy === 'occupied') {
                statusIndicator.className = 'status-indicator occupied';
                statusText.textContent = '使用中';
            } else {
                statusIndicator.className = 'status-indicator vacant';
                statusText.textContent = '空室';
            }
        }
    }

    updateStatusBadge(elementId, value, threshold) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let status = 'optimal';
        let text = '適正';

        if (elementId === 'temperature-status') {
            if (value < threshold.min) {
                status = 'warning';
                text = '低い';
            } else if (value > threshold.max) {
                status = 'warning';
                text = '高い';
            }
        } else if (elementId === 'humidity-status') {
            if (value < threshold.min) {
                status = 'warning';
                text = '低い';
            } else if (value > threshold.max) {
                status = 'warning';
                text = '高い';
            }
        } else if (elementId === 'co2-status') {
            if (value > threshold.max) {
                status = 'critical';
                text = '高い';
            } else if (value > 800) {
                status = 'warning';
                text = '注意';
            } else {
                text = '良好';
            }
        } else if (elementId === 'air-quality-status') {
            switch (value) {
                case 'excellent':
                    text = '優秀';
                    break;
                case 'good':
                    text = '快適';
                    break;
                case 'fair':
                    status = 'warning';
                    text = '普通';
                    break;
                case 'poor':
                    status = 'critical';
                    text = '改善必要';
                    break;
            }
        }

        element.className = `stat-status ${status}`;
        element.textContent = text;
    }

    getTrend(metric) {
        const history = this.environmentHistory[metric];
        if (history.length < 3) return { direction: 'stable', text: '安定' };

        const recent = history.slice(-3);
        const trend = recent[2] - recent[0];
        const threshold = metric === 'temperature' ? 0.5 : metric === 'humidity' ? 3 : 20;

        if (Math.abs(trend) < threshold) {
            return { direction: 'stable', text: '安定' };
        } else if (trend > 0) {
            return { direction: 'up', text: metric === 'co2' ? '上昇' : '上昇' };
        } else {
            return { direction: 'down', text: '下降' };
        }
    }

    updateTrend(elementId, trend) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let arrow;
        switch (trend.direction) {
            case 'up':
                arrow = '↗';
                break;
            case 'down':
                arrow = '↘';
                break;
            default:
                arrow = '→';
        }

        element.textContent = `${arrow} ${trend.text}`;
    }

    updateUsageStats() {
        // 今日の利用時間（モック）
        const usageHours = 6.5 + (Math.random() - 0.5) * 2;
        this.updateElement('today-usage-hours', usageHours.toFixed(1));

        // 週間利用率（モック）
        const weeklyUsage = 75 + Math.floor(Math.random() * 20);
        this.updateElement('weekly-usage-rate', weeklyUsage);

        // 生産性指数（環境品質ベース）
        const productivity = this.calculateProductivityIndex();
        this.updateElement('productivity-index', productivity);

        // エネルギー効率（モック）
        const efficiency = 88 + Math.floor(Math.random() * 10);
        this.updateElement('energy-efficiency', efficiency);
    }

    calculateProductivityIndex() {
        let score = 100;
        
        // 温度による影響
        const tempDiff = Math.abs(this.roomData.temperature - 22);
        score -= tempDiff * 5;
        
        // 湿度による影響
        const humidityDiff = Math.abs(this.roomData.humidity - 50);
        score -= humidityDiff * 0.5;
        
        // CO2による影響
        if (this.roomData.co2 > 1000) {
            score -= 20;
        } else if (this.roomData.co2 > 800) {
            score -= 10;
        }
        
        return Math.max(60, Math.min(100, Math.round(score)));
    }

    initializeCharts() {
        this.initTempHumidityChart();
        this.initCO2Chart();
        this.initUsagePatternChart();
    }

    initTempHumidityChart() {
        const ctx = document.getElementById('room-temp-humidity-chart');
        if (!ctx) return;

        this.charts.tempHumidity = new Chart(ctx, {
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
                        min: 18,
                        max: 28
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: '湿度 (%)' },
                        min: 30,
                        max: 70,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    initCO2Chart() {
        const ctx = document.getElementById('room-co2-trend-chart');
        if (!ctx) return;

        this.charts.co2 = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CO2濃度 (ppm)',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true
                }]
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
                        display: true,
                        title: { display: true, text: 'CO2濃度 (ppm)' },
                        min: 300,
                        max: 1200
                    }
                }
            }
        });
    }

    initUsagePatternChart() {
        const ctx = document.getElementById('room-usage-pattern-chart');
        if (!ctx) return;

        this.charts.usage = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '利用時間 (時間)',
                    data: [8.5, 7.2, 9.1, 6.8, 8.0, 3.2, 1.5],
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: { display: true, text: '利用時間 (時間)' }
                    }
                }
            }
        });
    }

    updateCharts() {
        if (this.charts.tempHumidity) {
            this.updateTempHumidityChart();
        }
        if (this.charts.co2) {
            this.updateCO2Chart();
        }
    }

    updateTempHumidityChart() {
        const chart = this.charts.tempHumidity;
        const maxPoints = 24;

        const tempData = this.environmentHistory.temperature.slice(-maxPoints);
        const humidityData = this.environmentHistory.humidity.slice(-maxPoints);
        const timestamps = this.environmentHistory.timestamps.slice(-maxPoints);

        if (tempData.length === 0) return;

        chart.data.labels = timestamps.map(time => 
            time.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );

        chart.data.datasets[0].data = tempData;
        chart.data.datasets[1].data = humidityData;

        chart.update('none');
    }

    updateCO2Chart() {
        const chart = this.charts.co2;
        const maxPoints = 24;

        const co2Data = this.environmentHistory.co2.slice(-maxPoints);
        const timestamps = this.environmentHistory.timestamps.slice(-maxPoints);

        if (co2Data.length === 0) return;

        chart.data.labels = timestamps.map(time => 
            time.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );

        chart.data.datasets[0].data = co2Data;

        chart.update('none');
    }

    updateOptimizationSuggestions() {
        const suggestions = [];

        // 温度に基づく提案
        if (this.roomData.temperature > 25) {
            suggestions.push({
                icon: '❄️',
                title: '冷房調整',
                message: '室温が高めです。設定温度を1°C下げることを推奨します。'
            });
        } else if (this.roomData.temperature < 21) {
            suggestions.push({
                icon: '🔥',
                title: '暖房調整',
                message: '室温が低めです。設定温度を1°C上げることを推奨します。'
            });
        } else {
            suggestions.push({
                icon: '🌡️',
                title: '温度最適',
                message: '現在の温度は適正範囲内です。現在の設定を維持してください。'
            });
        }

        // CO2に基づく提案
        if (this.roomData.co2 > 1000) {
            suggestions.push({
                icon: '💨',
                title: '緊急換気',
                message: 'CO2濃度が高いです。即座に換気を行ってください。'
            });
        } else if (this.roomData.co2 > 800) {
            suggestions.push({
                icon: '🌬️',
                title: '換気推奨',
                message: 'CO2濃度が上昇傾向です。15分後に換気を行うことを推奨します。'
            });
        }

        // エネルギー効率に基づく提案
        suggestions.push({
            icon: '💡',
            title: '照明最適化',
            message: '部屋の利用パターンから、自動調光設定の調整を推奨します。'
        });

        // 提案を表示
        this.renderOptimizationSuggestions(suggestions);
    }

    renderOptimizationSuggestions(suggestions) {
        const container = document.getElementById('room-optimization-suggestions');
        if (!container) return;

        container.innerHTML = suggestions.map(suggestion => `
            <div class="optimization-item">
                <div class="optimization-icon">${suggestion.icon}</div>
                <div class="optimization-content">
                    <h5>${suggestion.title}</h5>
                    <p>${suggestion.message}</p>
                </div>
            </div>
        `).join('');
    }

    setupControlListeners() {
        // 目標温度スライダー
        const tempSlider = document.getElementById('room-target-temp');
        const tempValue = document.getElementById('room-target-temp-value');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = `${e.target.value}°C`;
            });
        }

        // 目標湿度スライダー
        const humiditySlider = document.getElementById('room-target-humidity');
        const humidityValue = document.getElementById('room-target-humidity-value');
        if (humiditySlider && humidityValue) {
            humiditySlider.addEventListener('input', (e) => {
                humidityValue.textContent = `${e.target.value}%`;
            });
        }

        // 換気レベルスライダー
        const ventilationSlider = document.getElementById('room-ventilation');
        const ventilationValue = document.getElementById('room-ventilation-value');
        if (ventilationSlider && ventilationValue) {
            ventilationSlider.addEventListener('input', (e) => {
                ventilationValue.textContent = `${e.target.value}%`;
            });
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}

// 制御関数
function optimizeRoomEnvironment() {
    if (window.roomMonitorManager) {
        console.log('環境自動最適化を実行しました');
        // 実際の実装では最適化ロジックを実行
        alert('環境設定を自動最適化しました。');
    }
}

// グローバルインスタンス
let roomMonitorManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    roomMonitorManager = new RoomMonitorManager();
    window.roomMonitorManager = roomMonitorManager;
});
