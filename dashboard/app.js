// 快適君ダッシュボードアプリケーション
class KaitekiDashboard {
  constructor() {
    this.data = [];
    this.charts = {};
    this.updateInterval = null;
    this.isSimulationRunning = false;

    // API設定
    this.apiBaseUrl = 'https://ashy-sky-04f9d6100.1.azurestaticapps.net/api';

    this.initializeCharts();
    this.setupEventListeners();
    this.startDataUpdate();
  }

  initializeCharts() {
    // センサーデータ履歴チャート
    const sensorCtx = document.getElementById('sensorChart').getContext('2d');
    this.charts.sensor = new Chart(sensorCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: '温度 (°C)',
            data: [],
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            yAxisID: 'y'
          },
          {
            label: '湿度 (%)',
            data: [],
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            yAxisID: 'y'
          },
          {
            label: 'CO2 (ppm)',
            data: [],
            borderColor: '#FFCE56',
            backgroundColor: 'rgba(255, 206, 86, 0.1)',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: '時間'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '温度 (°C) / 湿度 (%)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'CO2 (ppm)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });

    // 快適度スコアチャート
    const comfortCtx = document.getElementById('comfortChart').getContext('2d');
    this.charts.comfort = new Chart(comfortCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '快適度スコア',
          data: [],
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '快適度スコア'
            }
          },
          x: {
            title: {
              display: true,
              text: '時間'
            }
          }
        }
      }
    });
  }

  setupEventListeners() {
    document.getElementById('startSimulation').addEventListener('click', () => {
      this.startSimulation();
    });

    document.getElementById('stopSimulation').addEventListener('click', () => {
      this.stopSimulation();
    });

    document.getElementById('refreshData').addEventListener('click', () => {
      this.refreshData();
    });
  }

  async startSimulation() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/start-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isSimulationRunning = true;
        document.getElementById('startSimulation').disabled = true;
        document.getElementById('stopSimulation').disabled = false;
        this.updateConnectionStatus(true, 'シミュレーション実行中');
      }
    } catch (error) {
      console.error('シミュレーション開始エラー:', error);
      this.updateConnectionStatus(false, 'シミュレーション開始失敗');
    }
  }

  async stopSimulation() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/stop-simulation`, {
        method: 'POST'
      });

      if (response.ok) {
        this.isSimulationRunning = false;
        document.getElementById('startSimulation').disabled = false;
        document.getElementById('stopSimulation').disabled = true;
        this.updateConnectionStatus(true, 'シミュレーション停止');
      }
    } catch (error) {
      console.error('シミュレーション停止エラー:', error);
    }
  }

  async refreshData() {
    await this.fetchLatestData();
  }

  async fetchLatestData() {
    try {
      // 実際のAPIが利用できない場合は、ダミーデータを使用
      const dummyData = this.generateDummyData();
      this.updateDashboard(dummyData);
      this.updateConnectionStatus(true, 'データ更新中');
    } catch (error) {
      console.error('データ取得エラー:', error);
      this.updateConnectionStatus(false, 'データ取得失敗');
    }
  }

  generateDummyData() {
    const now = new Date();
    const data = {
      deviceId: 'kaiteki-001',
      deviceType: 'comfort-sensor',
      timestamp: now.toISOString(),
      temperature: Math.round((Math.random() * 8 + 20) * 10) / 10, // 20-28°C
      humidity: Math.round((Math.random() * 30 + 40) * 10) / 10,   // 40-70%
      co2: Math.round((Math.random() * 400 + 400) * 10) / 10,      // 400-800ppm
      personCount: Math.floor(Math.random() * 6),                  // 0-5人
      comfortScore: Math.floor(Math.random() * 100),               // 0-100
      location: '会議室A',
      status: 'active'
    };

    // 快適度スコアを計算
    data.comfortScore = this.calculateComfortScore(data.temperature, data.humidity, data.co2, data.personCount);

    return data;
  }

  calculateComfortScore(temp, humidity, co2, people) {
    let score = 100;

    // 温度による減点 (最適: 22-24°C)
    if (temp < 18 || temp > 30) score -= 30;
    else if (temp < 20 || temp > 26) score -= 15;
    else if (temp < 22 || temp > 24) score -= 5;

    // 湿度による減点 (最適: 45-55%)
    if (humidity < 30 || humidity > 80) score -= 20;
    else if (humidity < 40 || humidity > 60) score -= 10;

    // CO2による減点 (最適: <600ppm)
    if (co2 > 1000) score -= 25;
    else if (co2 > 800) score -= 15;
    else if (co2 > 600) score -= 5;

    // 人数による減点
    if (people > 4) score -= 10;
    else if (people > 2) score -= 5;

    return Math.max(0, score);
  }

  updateDashboard(data) {
    // 現在値を更新
    document.getElementById('temperature').textContent = data.temperature;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('co2').textContent = data.co2;
    document.getElementById('personCount').textContent = data.personCount;

    // 快適度スコアを更新
    const comfortCircle = document.getElementById('comfortCircle');
    const comfortText = document.getElementById('comfortText');

    comfortCircle.textContent = data.comfortScore;
    comfortCircle.className = 'comfort-circle';

    if (data.comfortScore >= 80) {
      comfortCircle.classList.add('comfort-excellent');
      comfortText.textContent = '優秀';
    } else if (data.comfortScore >= 60) {
      comfortCircle.classList.add('comfort-good');
      comfortText.textContent = '良好';
    } else if (data.comfortScore >= 40) {
      comfortCircle.classList.add('comfort-fair');
      comfortText.textContent = '普通';
    } else {
      comfortCircle.classList.add('comfort-poor');
      comfortText.textContent = '改善必要';
    }

    // データ履歴に追加
    this.data.push(data);
    if (this.data.length > 20) {
      this.data.shift();
    }

    // チャートを更新
    this.updateCharts();
  }

  updateCharts() {
    const labels = this.data.map(d => new Date(d.timestamp).toLocaleTimeString());
    const temperatures = this.data.map(d => d.temperature);
    const humidities = this.data.map(d => d.humidity);
    const co2Levels = this.data.map(d => d.co2);
    const comfortScores = this.data.map(d => d.comfortScore);

    // センサーデータチャート更新
    this.charts.sensor.data.labels = labels;
    this.charts.sensor.data.datasets[0].data = temperatures;
    this.charts.sensor.data.datasets[1].data = humidities;
    this.charts.sensor.data.datasets[2].data = co2Levels;
    this.charts.sensor.update();

    // 快適度チャート更新
    this.charts.comfort.data.labels = labels;
    this.charts.comfort.data.datasets[0].data = comfortScores;
    this.charts.comfort.update();
  }

  updateConnectionStatus(connected, message) {
    const statusIndicator = document.getElementById('connectionStatus');
    const statusText = document.getElementById('connectionText');

    if (connected) {
      statusIndicator.className = 'status-indicator status-connected';
      statusText.textContent = message;
    } else {
      statusIndicator.className = 'status-indicator status-disconnected';
      statusText.textContent = message;
    }
  }

  startDataUpdate() {
    // 初回データ取得
    this.fetchLatestData();

    // 定期的なデータ更新 (10秒間隔)
    this.updateInterval = setInterval(() => {
      this.fetchLatestData();
    }, 10000);
  }

  stopDataUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new KaitekiDashboard();

  // ページ離脱時のクリーンアップ
  window.addEventListener('beforeunload', () => {
    dashboard.stopDataUpdate();
  });
});
