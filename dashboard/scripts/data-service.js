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
            
            // 人物分析データも生成・通知
            this.generateAndNotifyPersonData();
        } catch (error) {
            console.error('Error fetching data:', error);
            // エラー時はモックデータを生成
            this.generateMockData();
        }
    }

    // エントランスデータの取得
    async fetchEntranceData() {
        try {
            // Azure Static Web AppsではAPIエンドポイントが利用できないため、
            // 常にモックデータを使用
            console.log('Using mock entrance data for static hosting');
            return this.generateMockEntranceData();
        } catch (error) {
            console.warn('Failed to generate entrance data, using fallback');
            return this.generateMockEntranceData();
        }
    }

    // 個人開発部屋データの取得
    async fetchRoomData() {
        try {
            // Azure Static Web AppsではAPIエンドポイントが利用できないため、
            // 常にモックデータを使用
            console.log('Using mock room data for static hosting');
            return this.generateMockRoomData();
        } catch (error) {
            console.warn('Failed to generate room data, using fallback');
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
        
        // 人物分析データも生成・通知
        this.generateAndNotifyPersonData();
    }

    // モックエントランスデータの生成
    generateMockEntranceData() {
        const currentHour = new Date().getHours();
        const baseVisitors = this.getBaseVisitorsByHour(currentHour);
        
        return {
            currentVisitors: Math.max(0, baseVisitors + Math.floor(Math.random() * 5) - 2),
            dailyVisitors: Math.floor(Math.random() * 50) + 150,
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

    // 接続状態の確認（ローカル版では常にtrue）
    isConnected() {
        return this.reconnectAttempts <= this.maxReconnectAttempts;
    }

    // 人物分析データの生成と通知
    generateAndNotifyPersonData() {
        // 30%の確率で人物データを生成（リアルな感じにするため）
        if (Math.random() < 0.3) {
            const personData = this.generateMockPersonData();
            
            // 人物データ更新イベントを発火
            const event = new CustomEvent('personDataUpdate', { detail: personData });
            document.dispatchEvent(event);
        }
    }

    // モック人物データの生成
    generateMockPersonData() {
        const currentTime = new Date();
        const personCount = Math.floor(Math.random() * 3) + 1; // 1-3人
        
        const itriosPersons = [];
        const geminiPersons = [];
        
        for (let i = 0; i < personCount; i++) {
            const personId = this.generatePersonId();
            
            // SONY ITRIOS データ
            const age = Math.floor(Math.random() * 60) + 20; // 20-80歳
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const ageRange = this.getAgeRange(age);
            
            itriosPersons.push({
                id: personId,
                age: age,
                ageRange: ageRange,
                gender: gender,
                confidence: {
                    overall: Math.random() * 0.3 + 0.7, // 0.7-1.0
                    age: Math.random() * 0.2 + 0.8,     // 0.8-1.0
                    gender: Math.random() * 0.2 + 0.8   // 0.8-1.0
                },
                position: {
                    x: Math.floor(Math.random() * 400) + 100,
                    y: Math.floor(Math.random() * 300) + 100
                }
            });
            
            // Google Gemini データ
            const behaviors = [
                '展示物を詳しく観察している',
                'スマートフォンで写真を撮影',
                '他の来場者と会話中',
                'パンフレットを読んでいる',
                'ゆっくりと歩き回っている',
                '特定の展示に長時間滞在',
                'メモを取りながら見学'
            ];
            
            const emotions = ['興味深い', '楽しそう', '集中している', '驚いている', '満足している'];
            const traits = ['好奇心旺盛', '慎重', '社交的', '分析的', '積極的'];
            
            geminiPersons.push({
                personId: personId,
                behavior: {
                    action: behaviors[Math.floor(Math.random() * behaviors.length)],
                    movementDistance: Math.round((Math.random() * 20 + 5) * 10) / 10,
                    stayDuration: Math.round((Math.random() * 15 + 5) * 10) / 10,
                    isActive: Math.random() > 0.3
                },
                characteristics: {
                    interestLevel: Math.floor(Math.random() * 40) + 60, // 60-100
                    primaryTrait: traits[Math.floor(Math.random() * traits.length)],
                    showsInterest: Math.random() > 0.2
                },
                emotions: {
                    primary: emotions[Math.floor(Math.random() * emotions.length)],
                    isPositive: Math.random() > 0.2
                },
                interactions: {
                    isGroupBehavior: Math.random() > 0.6
                },
                confidence: Math.floor(Math.random() * 20) + 80, // 80-100
                processingTime: Math.round((Math.random() * 3 + 1) * 10) / 10 // 1.0-4.0秒
            });
        }
        
        return {
            itrios: {
                detectedPersons: itriosPersons,
                accuracy: Math.floor(Math.random() * 10) + 90, // 90-100%
                timestamp: currentTime
            },
            gemini: {
                analyzedPersons: geminiPersons,
                averageProcessingTime: Math.round((Math.random() * 2 + 1.5) * 10) / 10,
                averageConfidence: Math.floor(Math.random() * 15) + 85, // 85-100%
                timestamp: currentTime
            }
        };
    }

    // ヘルパーメソッド
    generatePersonId() {
        return 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
    }

    getAgeRange(age) {
        if (age < 20) return '10代';
        if (age < 30) return '20代';
        if (age < 40) return '30代';
        if (age < 50) return '40代';
        if (age < 60) return '50代';
        if (age < 70) return '60代';
        return '70代以上';
    }
}
