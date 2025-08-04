// データサービスクラス - ローカル実行用に簡略化
class DataService {
    constructor() {
        this.baseUrl = ''; // 同じオリジンのAPIを使用
        this.updateInterval = 30000; // 30秒間隔
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.dataCache = {
            entrance: {
                currentVisitors: 0,
                dailyVisitors: 0,
                avgStayTime: 0,
                ageDistribution: [35, 40, 20, 5],
                genderDistribution: [55, 40, 5],
                hourlyData: [],
                behaviorMetrics: {
                    interestLevel: 75,
                    avgMovement: 12.5,
                    groupBehavior: 45
                }
            },
            room: {
                temperature: 22.5,
                humidity: 55,
                co2: 450,
                isOccupied: true,
                temperatureHistory: [],
                humidityHistory: [],
                co2History: [],
                weeklyUsage: [85, 92, 78, 88, 95, 45, 30]
            }
        };

        this.startPolling();
    }

    // ポーリングによるデータ取得開始
    startPolling() {
        console.log('データポーリングを開始します');
        this.fetchAllData(); // 初回取得
        
        setInterval(() => {
            this.fetchAllData();
        }, this.updateInterval);
    }

    // 全データの取得
    async fetchAllData() {
        try {
            const [entranceData, roomData] = await Promise.all([
                this.fetchEntranceData(),
                this.fetchRoomData()
            ]);

            this.updateDataCache({ entrance: entranceData, room: roomData });
            this.notifyDataUpdate({ entrance: entranceData, room: roomData });
        } catch (error) {
            console.error('Error fetching data:', error);
            // エラー時はモックデータを生成
            this.generateMockData();
        }
    }

    // エントランスデータの取得
    async fetchEntranceData() {
        try {
            const response = await fetch(`${this.baseUrl}/entrance/current`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch entrance data, using mock data');
            return this.generateMockEntranceData();
        }
    }

    // 個人開発部屋データの取得
    async fetchRoomData() {
        try {
            const response = await fetch(`${this.baseUrl}/room/environment`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch room data, using mock data');
            return this.generateMockRoomData();
        }
    }

    // データキャッシュの更新
    updateDataCache(data) {
        if (data.entrance) {
            Object.assign(this.dataCache.entrance, data.entrance);
        }
        if (data.room) {
            Object.assign(this.dataCache.room, data.room);
        }
    }

    // データ更新の通知
    notifyDataUpdate(data) {
        // カスタムイベントを発火してUIに通知
        const event = new CustomEvent('dataUpdate', { detail: data });
        document.dispatchEvent(event);
    }

    // モックデータの生成
    generateMockData() {
        const mockData = {
            entrance: this.generateMockEntranceData(),
            room: this.generateMockRoomData()
        };
        
        this.updateDataCache(mockData);
        this.notifyDataUpdate(mockData);
    }

    // モックエントランスデータの生成
    generateMockEntranceData() {
        const currentHour = new Date().getHours();
        const baseVisitors = this.getBaseVisitorsByHour(currentHour);
        
        return {
            currentVisitors: Math.max(0, baseVisitors + Math.floor(Math.random() * 5) - 2),
            dailyVisitors: Math.floor(Math.random() * 50) + 150,
            avgStayTime: Math.floor(Math.random() * 5) + 8,
            ageDistribution: this.generateAgeDistribution(),
            genderDistribution: this.generateGenderDistribution(),
            hourlyData: this.generateHourlyVisitorData(),
            behaviorMetrics: {
                interestLevel: Math.floor(Math.random() * 20) + 70,
                avgMovement: Math.round((Math.random() * 5 + 10) * 10) / 10,
                groupBehavior: Math.floor(Math.random() * 30) + 35
            }
        };
    }

    // モック個人開発部屋データの生成
    generateMockRoomData() {
        const baseTemp = 22.5;
        const baseHumidity = 55;
        const baseCO2 = 450;
        
        return {
            temperature: Math.round((baseTemp + (Math.random() - 0.5) * 4) * 10) / 10,
            humidity: Math.round(baseHumidity + (Math.random() - 0.5) * 20),
            co2: Math.round(baseCO2 + (Math.random() - 0.5) * 200),
            isOccupied: Math.random() > 0.3,
            temperatureHistory: this.generateTemperatureHistory(),
            humidityHistory: this.generateHumidityHistory(),
            co2History: this.generateCO2History(),
            weeklyUsage: this.generateWeeklyUsage()
        };
    }

    // 時間帯別基準来場者数
    getBaseVisitorsByHour(hour) {
        const hourlyPattern = [0, 0, 0, 0, 0, 0, 2, 5, 12, 18, 25, 30, 35, 32, 28, 22, 18, 15, 12, 8, 5, 3, 1, 0];
        return hourlyPattern[hour] || 0;
    }

    // 年齢分布の生成
    generateAgeDistribution() {
        const base = [35, 40, 20, 5];
        return base.map(value => Math.max(0, value + Math.floor(Math.random() * 10) - 5));
    }

    // 性別分布の生成
    generateGenderDistribution() {
        const maleRatio = 0.5 + (Math.random() - 0.5) * 0.3; // 35-65%の範囲
        const total = 100;
        const male = Math.round(total * maleRatio);
        const female = Math.round(total * (1 - maleRatio) * 0.9); // 不明を考慮
        const unknown = total - male - female;
        
        return [male, female, Math.max(0, unknown)];
    }

    // 時間別来場者データの生成
    generateHourlyVisitorData() {
        const data = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const hour = (now.getHours() - i + 24) % 24;
            const baseValue = this.getBaseVisitorsByHour(hour);
            data.push(Math.max(0, baseValue + Math.floor(Math.random() * 5) - 2));
        }
        
        return data;
    }

    // 温度履歴の生成
    generateTemperatureHistory() {
        const baseTemp = 22.5;
        const data = [];
        
        for (let i = 0; i < 24; i++) {
            // 時間帯による温度変動を考慮
            const hourFactor = Math.sin((i - 6) * Math.PI / 12) * 2; // 昼間は高く、夜間は低く
            const randomFactor = (Math.random() - 0.5) * 2;
            data.push(Math.round((baseTemp + hourFactor + randomFactor) * 10) / 10);
        }
        
        return data;
    }

    // 湿度履歴の生成
    generateHumidityHistory() {
        const baseHumidity = 55;
        const data = [];
        
        for (let i = 0; i < 24; i++) {
            // 湿度の日内変動
            const hourFactor = Math.cos(i * Math.PI / 12) * 5;
            const randomFactor = (Math.random() - 0.5) * 10;
            data.push(Math.max(30, Math.min(80, Math.round(baseHumidity + hourFactor + randomFactor))));
        }
        
        return data;
    }

    // CO2履歴の生成
    generateCO2History() {
        const baseCO2 = 450;
        const data = [];
        
        for (let i = 0; i < 24; i++) {
            // 使用時間帯でCO2が上昇
            const usageFactor = (i >= 9 && i <= 18) ? Math.random() * 150 : 0;
            const randomFactor = (Math.random() - 0.5) * 50;
            data.push(Math.max(350, Math.round(baseCO2 + usageFactor + randomFactor)));
        }
        
        return data;
    }

    // 週間利用率の生成
    generateWeeklyUsage() {
        const baseUsage = [85, 92, 78, 88, 95, 45, 30]; // 月-日
        return baseUsage.map(value => Math.max(0, Math.min(100, value + Math.floor(Math.random() * 20) - 10)));
    }

    // 現在のデータキャッシュを取得
    getCurrentData() {
        return { ...this.dataCache };
    }

    // 特定のデータタイプを取得
    getEntranceData() {
        return { ...this.dataCache.entrance };
    }

    getRoomData() {
        return { ...this.dataCache.room };
    }

    // センサーデータの送信（テスト用）
    sendTestData(dataType, data) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const message = {
                type: 'test_data',
                dataType: dataType,
                data: data,
                timestamp: new Date().toISOString()
            };
            this.websocket.send(JSON.stringify(message));
        }
    }

    // 接続状態の確認
    isConnected() {
        return this.websocket && this.websocket.readyState === WebSocket.OPEN;
    }

    // WebSocket接続の終了
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }
}
