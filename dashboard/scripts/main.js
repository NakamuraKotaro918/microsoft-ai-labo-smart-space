// メインアプリケーション制御
class SmartSpaceDashboard {
    constructor() {
        this.currentTab = 'entrance';
        this.updateInterval = 30000; // 30秒間隔で更新
        this.charts = {};
        this.dataService = new DataService();
        this.personAnalysisManager = new PersonAnalysisManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.startDataUpdates();
        this.updateLastUpdateTime();
    }

    setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.showTab(tabName);
            });
        });

        // ウィンドウリサイズ時のチャート再描画
        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    showTab(tabName) {
        // タブボタンの状態更新
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        event.target.classList.add('active');

        // タブコンテンツの表示切り替え
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        this.currentTab = tabName;
        this.updateCurrentTabData();
    }

    initializeCharts() {
        this.initEntranceCharts();
        this.initRoomCharts();
    }

    initEntranceCharts() {
        // 年齢層分布チャート
        const ageCtx = document.getElementById('age-distribution-chart').getContext('2d');
        this.charts.ageDistribution = new Chart(ageCtx, {
            type: 'doughnut',
            data: {
                labels: ['10-20代', '30-40代', '50-60代', '70代以上'],
                datasets: [{
                    data: [35, 40, 20, 5],
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#f39c12',
                        '#9b59b6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        // 性別分布チャート
        const genderCtx = document.getElementById('gender-distribution-chart').getContext('2d');
        this.charts.genderDistribution = new Chart(genderCtx, {
            type: 'doughnut',
            data: {
                labels: ['男性', '女性', '不明'],
                datasets: [{
                    data: [55, 40, 5],
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#95a5a6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        // 時間別来場者数チャート
        const hourlyCtx = document.getElementById('hourly-visitors-chart').getContext('2d');
        const hourlyLabels = Array.from({length: 24}, (_, i) => `${i}:00`);
        this.charts.hourlyVisitors = new Chart(hourlyCtx, {
            type: 'line',
            data: {
                labels: hourlyLabels,
                datasets: [{
                    label: '来場者数',
                    data: this.generateHourlyData(),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initRoomCharts() {
        // 温度・湿度トレンドチャート
        const tempHumidityCtx = document.getElementById('temp-humidity-chart').getContext('2d');
        const timeLabels = this.generateTimeLabels(24);
        this.charts.tempHumidity = new Chart(tempHumidityCtx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: '温度 (°C)',
                    data: this.generateTemperatureData(),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: '湿度 (%)',
                    data: this.generateHumidityData(),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '温度 (°C)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '湿度 (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });

        // CO2濃度トレンドチャート
        const co2Ctx = document.getElementById('co2-trend-chart').getContext('2d');
        this.charts.co2Trend = new Chart(co2Ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'CO2濃度 (ppm)',
                    data: this.generateCO2Data(),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 300,
                        max: 800,
                        title: {
                            display: true,
                            text: 'CO2濃度 (ppm)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // 部屋利用率チャート
        const usageCtx = document.getElementById('room-usage-chart').getContext('2d');
        this.charts.roomUsage = new Chart(usageCtx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '利用率 (%)',
                    data: [85, 92, 78, 88, 95, 45, 30],
                    backgroundColor: [
                        '#3498db',
                        '#2ecc71',
                        '#f39c12',
                        '#e74c3c',
                        '#9b59b6',
                        '#1abc9c',
                        '#34495e'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '利用率 (%)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    generateHourlyData() {
        // 実際のデータ取得ロジックに置き換える
        const basePattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0];
        return basePattern.map(base => base + Math.floor(Math.random() * 5));
    }

    generateTimeLabels(hours) {
        const labels = [];
        const now = new Date();
        for (let i = hours - 1; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.getHours().toString().padStart(2, '0') + ':00');
        }
        return labels;
    }

    generateTemperatureData() {
        const baseTemp = 22.5;
        return Array.from({length: 24}, () => 
            baseTemp + (Math.random() - 0.5) * 4
        );
    }

    generateHumidityData() {
        const baseHumidity = 55;
        return Array.from({length: 24}, () => 
            baseHumidity + (Math.random() - 0.5) * 20
        );
    }

    generateCO2Data() {
        const baseCO2 = 450;
        return Array.from({length: 24}, () => 
            baseCO2 + (Math.random() - 0.5) * 200
        );
    }

    startDataUpdates() {
        // 初回データ更新
        this.updateAllData();
        
        // 定期的なデータ更新
        setInterval(() => {
            this.updateAllData();
        }, this.updateInterval);
    }

    updateAllData() {
        this.updateEntranceData();
        this.updateRoomData();
        this.updateLastUpdateTime();
        this.updateConnectionStatus();
    }

    updateCurrentTabData() {
        if (this.currentTab === 'entrance') {
            this.updateEntranceData();
        } else if (this.currentTab === 'room') {
            this.updateRoomData();
        }
    }

    updateEntranceData() {
        // 統計データの更新
        document.getElementById('current-visitors').textContent = Math.floor(Math.random() * 15) + 5;
        document.getElementById('daily-visitors').textContent = Math.floor(Math.random() * 200) + 150;
        document.getElementById('avg-stay-time').textContent = Math.floor(Math.random() * 10) + 8;

        // チャートデータの更新
        if (this.charts.hourlyVisitors) {
            this.charts.hourlyVisitors.data.datasets[0].data = this.generateHourlyData();
            this.charts.hourlyVisitors.update('none');
        }
    }

    updateRoomData() {
        // 環境データの更新
        const temp = (22 + Math.random() * 4).toFixed(1);
        const humidity = Math.floor(50 + Math.random() * 20);
        const co2 = Math.floor(400 + Math.random() * 200);
        
        document.getElementById('temperature').textContent = temp;
        document.getElementById('humidity').textContent = humidity;
        document.getElementById('co2').textContent = co2;

        // 利用状況の更新
        const isOccupied = Math.random() > 0.3;
        const occupancyElement = document.getElementById('room-occupancy');
        const statusElement = occupancyElement.parentElement.querySelector('.stat-status');
        
        if (isOccupied) {
            occupancyElement.textContent = '使用中';
            statusElement.textContent = '在室';
            statusElement.className = 'stat-status occupied';
        } else {
            occupancyElement.textContent = '空室';
            statusElement.textContent = '不在';
            statusElement.className = 'stat-status optimal';
        }

        // チャートデータの更新
        if (this.charts.tempHumidity) {
            this.charts.tempHumidity.data.datasets[0].data = this.generateTemperatureData();
            this.charts.tempHumidity.data.datasets[1].data = this.generateHumidityData();
            this.charts.tempHumidity.update('none');
        }

        if (this.charts.co2Trend) {
            this.charts.co2Trend.data.datasets[0].data = this.generateCO2Data();
            this.charts.co2Trend.update('none');
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('last-update').textContent = timeString;
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connection-status');
        // 実際の接続状態チェックロジックに置き換える
        const isConnected = Math.random() > 0.1; // 90%の確率で接続中
        
        if (isConnected) {
            statusElement.textContent = '接続中';
            statusElement.style.background = '#d5f4e6';
            statusElement.style.color = '#27ae60';
        } else {
            statusElement.textContent = '接続エラー';
            statusElement.style.background = '#fadbd8';
            statusElement.style.color = '#e74c3c';
        }
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }
}

// グローバル関数（HTMLから呼び出し用）
function showTab(tabName) {
    if (window.dashboard) {
        window.dashboard.showTab(tabName);
    }
}

// デモ用人物データ生成
function generateDemoPersonData() {
    if (window.dashboard && window.dashboard.personAnalysisManager) {
        window.dashboard.personAnalysisManager.generateMockData();
        console.log('デモ人物データを生成しました');
    }
}

// 人物データクリア
function clearPersonData() {
    if (window.dashboard && window.dashboard.personAnalysisManager) {
        window.dashboard.personAnalysisManager.itriosData.clear();
        window.dashboard.personAnalysisManager.geminiData.clear();
        window.dashboard.personAnalysisManager.updateDisplay();
        console.log('人物データをクリアしました');
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SmartSpaceDashboard();
});
