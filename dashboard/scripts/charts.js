// チャート管理クラス
class ChartManager {
    constructor() {
        this.charts = {};
        this.chartConfigs = this.getChartConfigurations();
    }

    getChartConfigurations() {
        return {
            // エントランス関連チャート設定
            entrance: {
                ageDistribution: {
                    type: 'doughnut',
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    font: { size: 12 },
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: ${value}人 (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 1000
                        }
                    }
                },
                genderDistribution: {
                    type: 'doughnut',
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    font: { size: 12 },
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: ${value}人 (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 1000
                        }
                    }
                },
                hourlyVisitors: {
                    type: 'line',
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                title: {
                                    display: true,
                                    text: '来場者数（人）'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                title: {
                                    display: true,
                                    text: '時間'
                                }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        return `${context.parsed.y}人`;
                                    }
                                }
                            }
                        },
                        interaction: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                }
            },
            // 個人開発部屋関連チャート設定
            room: {
                tempHumidity: {
                    type: 'line',
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
                                },
                                grid: {
                                    color: 'rgba(231, 76, 60, 0.1)'
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
                                    color: 'rgba(52, 152, 219, 0.1)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '時間'
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        const datasetLabel = context.dataset.label;
                                        const value = context.parsed.y.toFixed(1);
                                        return `${datasetLabel}: ${value}`;
                                    }
                                }
                            }
                        },
                        interaction: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                },
                co2Trend: {
                    type: 'line',
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
                                },
                                grid: {
                                    color: 'rgba(46, 204, 113, 0.1)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value + ' ppm';
                                    }
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '時間'
                                }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                mode: 'index',
                                intersect: false,
                                callbacks: {
                                    label: function(context) {
                                        return `CO2濃度: ${context.parsed.y.toFixed(0)} ppm`;
                                    }
                                }
                            }
                        },
                        interaction: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                },
                roomUsage: {
                    type: 'bar',
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
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '曜日'
                                }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `利用率: ${context.parsed.y}%`;
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                }
            }
        };
    }

    // チャートの初期化
    initializeChart(canvasId, chartType, category) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const config = this.chartConfigs[category][chartType];
        
        if (!config) {
            console.error(`Chart configuration for '${category}.${chartType}' not found`);
            return null;
        }

        const chartData = this.getInitialData(chartType, category);
        
        const chart = new Chart(ctx, {
            type: config.type,
            data: chartData,
            options: config.options
        });

        this.charts[canvasId] = chart;
        return chart;
    }

    // 初期データの生成
    getInitialData(chartType, category) {
        switch (`${category}.${chartType}`) {
            case 'entrance.ageDistribution':
                return {
                    labels: ['10-20代', '30-40代', '50-60代', '70代以上'],
                    datasets: [{
                        data: [35, 40, 20, 5],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#f39c12',
                            '#9b59b6'
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };

            case 'entrance.genderDistribution':
                return {
                    labels: ['男性', '女性', '不明'],
                    datasets: [{
                        data: [55, 40, 5],
                        backgroundColor: [
                            '#3498db',
                            '#e74c3c',
                            '#95a5a6'
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                };

            case 'entrance.hourlyVisitors':
                return {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: '来場者数',
                        data: this.generateHourlyVisitorData(),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                };

            case 'room.tempHumidity':
                return {
                    labels: this.generateTimeLabels(24),
                    datasets: [{
                        label: '温度 (°C)',
                        data: this.generateTemperatureData(),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        yAxisID: 'y',
                        tension: 0.4,
                        pointBackgroundColor: '#e74c3c',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3
                    }, {
                        label: '湿度 (%)',
                        data: this.generateHumidityData(),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        yAxisID: 'y1',
                        tension: 0.4,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 3
                    }]
                };

            case 'room.co2Trend':
                return {
                    labels: this.generateTimeLabels(24),
                    datasets: [{
                        label: 'CO2濃度 (ppm)',
                        data: this.generateCO2Data(),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#2ecc71',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                };

            case 'room.roomUsage':
                return {
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
                        borderSkipped: false,
                        hoverBackgroundColor: [
                            '#2980b9',
                            '#27ae60',
                            '#e67e22',
                            '#c0392b',
                            '#8e44ad',
                            '#16a085',
                            '#2c3e50'
                        ]
                    }]
                };

            default:
                return { labels: [], datasets: [] };
        }
    }

    // データ生成ヘルパーメソッド
    generateHourlyVisitorData() {
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
            Math.round((baseTemp + (Math.random() - 0.5) * 4) * 10) / 10
        );
    }

    generateHumidityData() {
        const baseHumidity = 55;
        return Array.from({length: 24}, () => 
            Math.round(baseHumidity + (Math.random() - 0.5) * 20)
        );
    }

    generateCO2Data() {
        const baseCO2 = 450;
        return Array.from({length: 24}, () => 
            Math.round(baseCO2 + (Math.random() - 0.5) * 200)
        );
    }

    // チャートデータの更新
    updateChart(canvasId, newData) {
        const chart = this.charts[canvasId];
        if (!chart) {
            console.error(`Chart with id '${canvasId}' not found`);
            return;
        }

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }

        if (newData.datasets) {
            newData.datasets.forEach((dataset, index) => {
                if (chart.data.datasets[index]) {
                    Object.assign(chart.data.datasets[index], dataset);
                }
            });
        }

        chart.update('active');
    }

    // 全チャートのリサイズ
    resizeAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }

    // チャートの破棄
    destroyChart(canvasId) {
        const chart = this.charts[canvasId];
        if (chart) {
            chart.destroy();
            delete this.charts[canvasId];
        }
    }

    // 全チャートの破棄
    destroyAllCharts() {
        Object.keys(this.charts).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }
}
