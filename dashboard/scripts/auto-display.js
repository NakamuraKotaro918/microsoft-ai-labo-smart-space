/**
 * 自動画面切り替えシステム
 * 10秒間隔で画面を自動切り替えし、データを更新
 */

// データサービスクラス
class DataService {
    constructor() {
        // データサービスの初期化
    }
}

class AutoDisplaySystem {
    constructor() {
        this.screens = [
            { id: 'entrance-basic-screen', name: 'エントランス基本情報' },
            { id: 'entrance-analysis-screen', name: 'エントランス属性分析' },
            { id: 'entrance-hourly-screen', name: 'エントランス時間別分析' },
            { id: 'entrance-behavior-screen', name: 'エントランス行動パターン分析' },
            { id: 'room-environment-screen', name: '個人開発部屋環境データ' },
            { id: 'room-trend-screen', name: '個人開発部屋トレンド分析' }
        ];
        this.currentScreenIndex = 0;
        this.switchInterval = 10000; // 10秒間隔
        this.countdownSeconds = 10; // カウントダウンも10秒
        this.dataService = new DataService();
        this.charts = {};
        this.autoSwitchTimer = null; // 自動切り替えタイマー
        this.countdownTimer = null; // カウントダウンタイマー
        this.isManualControl = false; // 手動制御フラグ
        this.manualControlTimeout = null; // 手動制御タイムアウト
        
        this.init();
    }

    init() {
        // 初期画面設定
        this.showScreen(0);
        
        // チャート初期化
        this.initializeCharts();
        
        // 自動切り替え開始
        this.startAutoSwitch();
        
        // カウントダウン開始
        this.startCountdown();
        
        // データ更新開始
        this.startDataUpdate();
        
        // マウススクロールイベントリスナーを追加
        this.setupScrollControl();
        
        console.log('自動表示システムが開始されました（マウススクロール対応）');
    }

    showScreen(index) {
        // 全画面を非表示
        this.screens.forEach(screen => {
            const element = document.getElementById(screen.id);
            if (element) {
                element.classList.remove('active');
            }
        });

        // 指定画面を表示
        const currentScreen = this.screens[index];
        const screenElement = document.getElementById(currentScreen.id);
        if (screenElement) {
            screenElement.classList.add('active');
        }

        // 画面名を更新
        const screenNameElement = document.getElementById('current-screen-name');
        if (screenNameElement) {
            screenNameElement.textContent = currentScreen.name;
        }

        // 画面進捗を更新
        const screenProgressElement = document.getElementById('screen-progress');
        if (screenProgressElement) {
            screenProgressElement.textContent = `${index + 1}/${this.screens.length}`;
        }

        this.currentScreenIndex = index;
        
        // 画面切り替え時にデータ更新
        this.updateCurrentScreenData();
    }

    startAutoSwitch() {
        // 既存のタイマーをクリア
        if (this.autoSwitchTimer) {
            clearInterval(this.autoSwitchTimer);
        }
        
        this.autoSwitchTimer = setInterval(() => {
            // 手動制御中は自動切り替えをスキップ
            if (this.isManualControl) {
                return;
            }
            
            this.currentScreenIndex = (this.currentScreenIndex + 1) % this.screens.length;
            this.showScreen(this.currentScreenIndex);
            // 画面切り替え時にカウントダウンをリセット
            this.resetCountdown();
        }, this.switchInterval);
    }

    startCountdown() {
        // 初期カウントダウン表示
        this.updateCountdownDisplay();
        
        // 既存のタイマーをクリア
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        // 1秒ごとにカウントダウンを更新
        this.countdownTimer = setInterval(() => {
            // 手動制御中はカウントダウンを停止
            if (this.isManualControl) {
                return;
            }
            
            this.countdownSeconds--;
            this.updateCountdownDisplay();
            
            // カウントダウンが0になったら次の切り替えまでの時間をリセット
            if (this.countdownSeconds <= 0) {
                this.resetCountdown();
            }
        }, 1000);
    }

    resetCountdown() {
        this.countdownSeconds = this.switchInterval / 1000; // 10秒にリセット
        this.updateCountdownDisplay();
    }

    updateCountdownDisplay() {
        const countdownElement = document.getElementById('countdown-timer');
        if (countdownElement) {
            if (this.isManualControl) {
                countdownElement.textContent = '手動';
                countdownElement.style.backgroundColor = '#9E9E9E';
            } else {
                countdownElement.textContent = this.countdownSeconds;
                
                // カウントダウンが少なくなったら色を変更（10秒対応）
                if (this.countdownSeconds <= 3) {
                    countdownElement.style.backgroundColor = '#FF5722';
                } else if (this.countdownSeconds <= 5) {
                    countdownElement.style.backgroundColor = '#FF9800';
                } else {
                    countdownElement.style.backgroundColor = '#4CAF50';
                }
            }
        }
    }

    startDataUpdate() {
        // 初回データ更新
        this.updateCurrentScreenData();
        
        // 定期的なデータ更新（10秒間隔）
        setInterval(() => {
            this.updateCurrentScreenData();
        }, 10000);
    }

    updateCurrentScreenData() {
        const currentScreen = this.screens[this.currentScreenIndex];
        
        switch (currentScreen.id) {
            case 'entrance-basic-screen':
                this.updateEntranceBasicData();
                break;
            case 'entrance-analysis-screen':
                this.updateEntranceAnalysisData();
                break;
            case 'entrance-hourly-screen':
                this.updateEntranceHourlyData();
                break;
            case 'entrance-behavior-screen':
                this.updateEntranceBehaviorData();
                break;
            case 'room-environment-screen':
                this.updateRoomEnvironmentData();
                break;
            case 'room-trend-screen':
                this.updateRoomTrendData();
                break;
        }
    }

    updateEntranceBasicData() {
        // エントランス基本データの更新
        fetch('/api/entrance/current')
            .then(response => response.json())
            .then(data => {
                // 基本統計の更新
                this.updateElement('current-visitors', data.currentVisitors);
                this.updateElement('daily-visitors', data.dailyVisitors);
                this.updateElement('last-update', new Date().toLocaleTimeString());
            })
            .catch(error => {
                console.error('エントランス基本データの取得に失敗:', error);
            });
    }

    updateEntranceAnalysisData() {
        // エントランス属性分析データの更新
        fetch('/api/entrance/current')
            .then(response => response.json())
            .then(data => {
                // 年齢分布の更新
                if (data.ageDistribution) {
                    this.updateElement('age-young', data.ageDistribution[0] + '%');
                    this.updateElement('age-middle', data.ageDistribution[1] + '%');
                    this.updateElement('age-senior', data.ageDistribution[2] + '%');
                    this.updateElement('age-elderly', data.ageDistribution[3] + '%');
                }
                
                // 性別分布の更新
                if (data.genderDistribution) {
                    this.updateElement('gender-male', data.genderDistribution[0] + '%');
                    this.updateElement('gender-female', data.genderDistribution[1] + '%');
                    this.updateElement('gender-unknown', data.genderDistribution[2] + '%');
                }
                
                // チャートの更新
                this.updateEntranceAnalysisCharts(data);
            })
            .catch(error => {
                console.error('エントランス属性分析データの取得に失敗:', error);
            });
    }

    updateEntranceHourlyData() {
        // エントランス時間別データの更新
        fetch('/api/entrance/current')
            .then(response => response.json())
            .then(data => {
                // 時間別チャートの更新
                this.updateHourlyChart(data);
            })
            .catch(error => {
                console.error('エントランス時間別データの取得に失敗:', error);
            });
    }

    updateEntranceBehaviorData() {
        // エントランス行動パターンデータの更新
        fetch('/api/entrance/behavior')
            .then(response => response.json())
            .then(data => {
                // 行動パターン割合の更新
                this.updateElement('pattern-walkthrough', (data.patterns?.walkthrough || 35) + '%');
                this.updateElement('pattern-information', (data.patterns?.information || 25) + '%');
                this.updateElement('pattern-meeting', (data.patterns?.meeting || 20) + '%');
                this.updateElement('pattern-smartphone', (data.patterns?.smartphone || 10) + '%');
                this.updateElement('pattern-conversation', (data.patterns?.conversation || 7) + '%');
                this.updateElement('pattern-exploring', (data.patterns?.exploring || 3) + '%');
                
                // サマリー情報の更新
                this.updateElement('avg-stay-time', (data.avgStayTime || 2.3) + '分');
                this.updateElement('top-behavior', data.topBehavior || '通り抜け');
                this.updateElement('analyzed-count', (data.analyzedCount || 127) + '人');
                
                // 行動パターンチャートの更新
                this.updateBehaviorChart(data);
            })
            .catch(error => {
                console.error('エントランス行動パターンデータの取得に失敗:', error);
                // デフォルト値で表示
                this.updateElement('pattern-walkthrough', '35%');
                this.updateElement('pattern-information', '25%');
                this.updateElement('pattern-meeting', '20%');
                this.updateElement('pattern-smartphone', '10%');
                this.updateElement('pattern-conversation', '7%');
                this.updateElement('pattern-exploring', '3%');
            });
    }

    updateBehaviorChart(data) {
        if (this.charts.behaviorPattern && data.patterns) {
            const chartData = [
                data.patterns.walkthrough || 35,
                data.patterns.information || 25,
                data.patterns.meeting || 20,
                data.patterns.smartphone || 10,
                data.patterns.conversation || 7,
                data.patterns.exploring || 3
            ];
            
            this.charts.behaviorPattern.data.datasets[0].data = chartData;
            this.charts.behaviorPattern.update();
        }
    }

    updateRoomEnvironmentData() {
        // 個人開発部屋環境データの更新
        fetch('/api/room/environment')
            .then(response => response.json())
            .then(data => {
                // 環境データの更新
                this.updateElement('room-temperature', data.temperature);
                this.updateElement('room-humidity', data.humidity);
                this.updateElement('room-co2', data.co2);
                this.updateElement('room-usage-status', data.isOccupied ? '利用中' : '未利用');
                
                // ステータスの更新
                this.updateElement('temperature-status', this.getTemperatureStatus(data.temperature));
                this.updateElement('humidity-status', this.getHumidityStatus(data.humidity));
                this.updateElement('co2-status', this.getCO2Status(data.co2));
                this.updateElement('usage-status', data.isOccupied ? '6.5時間' : '0時間');
            })
            .catch(error => {
                console.error('部屋環境データの取得に失敗:', error);
            });
    }

    updateRoomTrendData() {
        // 個人開発部屋トレンドデータの更新
        fetch('/api/room/environment')
            .then(response => response.json())
            .then(data => {
                // トレンドチャートの更新
                this.updateRoomTrendCharts(data);
            })
            .catch(error => {
                console.error('部屋トレンドデータの取得に失敗:', error);
            });
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    getTemperatureStatus(temp) {
        if (temp >= 20 && temp <= 26) return '適正';
        if (temp >= 18 && temp <= 28) return '注意';
        return '警告';
    }

    getHumidityStatus(humidity) {
        if (humidity >= 40 && humidity <= 60) return '適正';
        if (humidity >= 30 && humidity <= 70) return '注意';
        return '警告';
    }

    getCO2Status(co2) {
        if (co2 <= 600) return '良好';
        if (co2 <= 1000) return '注意';
        return '警告';
    }

    initializeCharts() {
        // エントランス画面のチャート
        this.initializeEntranceCharts();
        
        // 行動パターンチャート
        this.initializeBehaviorChart();
        
        // 部屋画面のチャート
        this.initializeRoomCharts();
    }

    initializeEntranceCharts() {
        // 年齢分布チャート
        const ageCtx = document.getElementById('age-distribution-chart');
        if (ageCtx) {
            this.charts.ageDistribution = new Chart(ageCtx, {
                type: 'doughnut',
                data: {
                    labels: ['20代以下', '30-40代', '50-60代', '70代以上'],
                    datasets: [{
                        data: [35, 40, 20, 5],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.0,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 14 /* 凡例フォントサイズを大きく */
                                },
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            titleFont: {
                                size: 14 /* ツールチップタイトルを大きく */
                            },
                            bodyFont: {
                                size: 13 /* ツールチップ本文を大きく */
                            }
                        }
                    }
                }
            });
        }

        // 性別分布チャート
        const genderCtx = document.getElementById('gender-distribution-chart');
        if (genderCtx) {
            this.charts.genderDistribution = new Chart(genderCtx, {
                type: 'pie',
                data: {
                    labels: ['男性', '女性', '不明'],
                    datasets: [{
                        data: [55, 40, 5],
                        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.0,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 14 /* 凡例フォントサイズを大きく */
                                },
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            titleFont: {
                                size: 14 /* ツールチップタイトルを大きく */
                            },
                            bodyFont: {
                                size: 13 /* ツールチップ本文を大きく */
                            }
                        }
                    }
                }
            });
        }

        // 時間別来場者数チャート
        const hourlyCtx = document.getElementById('hourly-visitors-chart');
        if (hourlyCtx) {
            this.charts.hourlyVisitors = new Chart(hourlyCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: '来場者数',
                        data: Array.from({length: 24}, () => Math.floor(Math.random() * 10)),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2.2, /* アスペクト比をさらに大きくして横軸に余裕を */
                    layout: {
                        padding: {
                            bottom: 20 /* 下部にパディングを追加して横軸文字の余裕を確保 */
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: {
                                    size: 16
                                }
                            },
                            title: {
                                display: true,
                                text: '来場者数（人）',
                                font: {
                                    size: 14
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 16
                                },
                                maxRotation: 0, /* 横軸ラベルの回転を無効化 */
                                minRotation: 0
                            },
                            title: {
                                display: true,
                                text: '時刻',
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 14
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    initializeBehaviorChart() {
        // 行動パターンチャート
        const behaviorCtx = document.getElementById('behavior-pattern-chart');
        if (behaviorCtx) {
            this.charts.behaviorPattern = new Chart(behaviorCtx, {
                type: 'doughnut',
                data: {
                    labels: ['通り抜け', '情報確認', '待ち合わせ', 'スマホ操作', '会話', '迷い・探索'],
                    datasets: [{
                        data: [35, 25, 20, 10, 7, 3],
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB', 
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                            '#FF9F40'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // アスペクト比を固定しない
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 11 // フォントサイズを小さく
                                },
                                padding: 8, // パディングを削減
                                usePointStyle: true,
                                pointStyle: 'circle',
                                boxWidth: 12 // ボックス幅を小さく
                            }
                        },
                        tooltip: {
                            titleFont: {
                                size: 12 // ツールチップタイトルを小さく
                            },
                            bodyFont: {
                                size: 11 // ツールチップ本文を小さく
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 5,
                            bottom: 5,
                            left: 5,
                            right: 5
                        }
                    }
                }
            });
        }
    }

    initializeRoomCharts() {
        // 温度・湿度チャート
        const tempHumidityCtx = document.getElementById('room-temp-humidity-chart');
        if (tempHumidityCtx) {
            this.charts.tempHumidity = new Chart(tempHumidityCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: '温度 (°C)',
                        data: Array.from({length: 24}, () => 22 + Math.random() * 4),
                        borderColor: '#FF6384',
                        yAxisID: 'y'
                    }, {
                        label: '湿度 (%)',
                        data: Array.from({length: 24}, () => 50 + Math.random() * 20),
                        borderColor: '#36A2EB',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.0,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            ticks: {
                                font: {
                                    size: 14 /* 軸ラベルを大きく */
                                }
                            },
                            title: {
                                display: true,
                                text: '温度 (°C)',
                                font: {
                                    size: 14 /* 軸タイトルを大きく */
                                }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                font: {
                                    size: 14 /* 軸ラベルを大きく */
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 10 /* X軸ラベルを元に戻す */
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10 /* 凡例フォントを元に戻す */
                                }
                            }
                        }
                    }
                }
            });
        }

        // CO2チャート
        const co2Ctx = document.getElementById('room-co2-trend-chart');
        if (co2Ctx) {
            this.charts.co2Trend = new Chart(co2Ctx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: 'CO2濃度 (ppm)',
                        data: Array.from({length: 24}, () => 400 + Math.random() * 200),
                        borderColor: '#4BC0C0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.0,
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 300,
                            ticks: {
                                font: {
                                    size: 10 /* Y軸ラベルを元に戻す */
                                }
                            }
                        },
                        x: {
                            ticks: {
                                font: {
                                    size: 10 /* X軸ラベルを元に戻す */
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10 /* 凡例フォントを元に戻す */
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    updateEntranceCharts(data) {
        // 年齢分布チャートの更新
        if (this.charts.ageDistribution && data.ageDistribution) {
            this.charts.ageDistribution.data.datasets[0].data = data.ageDistribution;
            this.charts.ageDistribution.update('none');
        }

        // 性別分布チャートの更新
        if (this.charts.genderDistribution && data.genderDistribution) {
            this.charts.genderDistribution.data.datasets[0].data = data.genderDistribution;
            this.charts.genderDistribution.update('none');
        }

        // 時間別来場者数チャートの更新
        if (this.charts.hourlyVisitors && data.hourlyData) {
            this.charts.hourlyVisitors.data.datasets[0].data = data.hourlyData;
            this.charts.hourlyVisitors.update('none');
        }
    }

    updateRoomCharts(data) {
        // 温度・湿度チャートの更新
        if (this.charts.tempHumidity && data.temperatureHistory && data.humidityHistory) {
            this.charts.tempHumidity.data.datasets[0].data = data.temperatureHistory;
            this.charts.tempHumidity.data.datasets[1].data = data.humidityHistory;
            this.charts.tempHumidity.update('none');
        }

        // CO2チャートの更新
        if (this.charts.co2Trend && data.co2History) {
            this.charts.co2Trend.data.datasets[0].data = data.co2History;
            this.charts.co2Trend.update('none');
        }
    }

    // マウススクロール制御のセットアップ
    setupScrollControl() {
        let scrollTimeout = null;
        
        // マウスホイールイベントリスナー
        document.addEventListener('wheel', (event) => {
            event.preventDefault(); // デフォルトのスクロール動作を無効化
            
            // スクロール方向を判定
            const deltaY = event.deltaY;
            
            // 連続スクロールを防ぐためのタイムアウト処理
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            scrollTimeout = setTimeout(() => {
                if (deltaY > 0) {
                    // 下スクロール：次の画面
                    this.nextScreen();
                } else if (deltaY < 0) {
                    // 上スクロール：前の画面
                    this.previousScreen();
                }
            }, 50); // 50ms のデバウンス
        }, { passive: false });
        
        // キーボードイベントリスナー（矢印キーでも制御可能）
        document.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    this.nextScreen();
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    this.previousScreen();
                    break;
                case ' ': // スペースキー：自動切り替えの一時停止/再開
                    event.preventDefault();
                    this.toggleAutoSwitch();
                    break;
            }
        });
        
        console.log('マウススクロール制御が有効になりました');
    }

    // 次の画面に切り替え
    nextScreen() {
        this.enableManualControl();
        this.currentScreenIndex = (this.currentScreenIndex + 1) % this.screens.length;
        this.showScreen(this.currentScreenIndex);
        this.resetCountdown();
    }

    // 前の画面に切り替え
    previousScreen() {
        this.enableManualControl();
        this.currentScreenIndex = (this.currentScreenIndex - 1 + this.screens.length) % this.screens.length;
        this.showScreen(this.currentScreenIndex);
        this.resetCountdown();
    }

    // 手動制御モードを有効化
    enableManualControl() {
        this.isManualControl = true;
        this.updateCountdownDisplay();
        
        // 既存のタイムアウトをクリア
        if (this.manualControlTimeout) {
            clearTimeout(this.manualControlTimeout);
        }
        
        // 30秒後に自動制御に戻る
        this.manualControlTimeout = setTimeout(() => {
            this.disableManualControl();
        }, 30000);
        
        console.log('手動制御モードが有効になりました（30秒後に自動復帰）');
    }

    // 手動制御モードを無効化
    disableManualControl() {
        this.isManualControl = false;
        this.resetCountdown();
        console.log('自動制御モードに復帰しました');
    }

    // 自動切り替えの一時停止/再開
    toggleAutoSwitch() {
        if (this.isManualControl) {
            this.disableManualControl();
        } else {
            this.enableManualControl();
        }
    }
}

// ページ読み込み完了後に自動表示システムを開始
document.addEventListener('DOMContentLoaded', () => {
    console.log('AutoDisplaySystem starting...');
    const system = new AutoDisplaySystem();
    console.log('AutoDisplaySystem started successfully');
});

// フォールバック：DOMContentLoadedが既に発火している場合
if (document.readyState === 'loading') {
    // まだ読み込み中
} else {
    // 既に読み込み完了
    console.log('AutoDisplaySystem starting (fallback)...');
    const system = new AutoDisplaySystem();
    console.log('AutoDisplaySystem started successfully (fallback)');
}
