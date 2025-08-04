// 人物分析データ管理クラス
class PersonAnalysisManager {
    constructor() {
        this.itriosData = new Map(); // SONY ITRIOS データ
        this.geminiData = new Map(); // Google Gemini データ
        this.maxPersonHistory = 20; // 表示する最大人数
        this.dataRetentionTime = 300000; // 5分間データを保持
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // データ更新イベントのリスナー
        document.addEventListener('personDataUpdate', (event) => {
            this.handlePersonDataUpdate(event.detail);
        });
    }

    // 人物データ更新の処理
    handlePersonDataUpdate(data) {
        if (data.itrios) {
            this.updateItriosData(data.itrios);
        }
        if (data.gemini) {
            this.updateGeminiData(data.gemini);
        }
        
        this.updateDisplay();
        this.cleanupOldData();
    }

    // SONY ITRIOS データの更新
    updateItriosData(itriosData) {
        const timestamp = new Date();
        
        // 検出された人物データを処理
        if (itriosData.detectedPersons) {
            itriosData.detectedPersons.forEach(person => {
                const personId = person.id || this.generatePersonId();
                
                this.itriosData.set(personId, {
                    id: personId,
                    timestamp: timestamp,
                    age: person.age,
                    ageRange: person.ageRange,
                    gender: person.gender,
                    confidence: person.confidence || {},
                    position: person.position || {},
                    attributes: person.attributes || {}
                });
            });
        }

        // 統計情報の更新
        this.updateItriosStats({
            detectedCount: itriosData.detectedPersons?.length || 0,
            accuracy: itriosData.accuracy || 95,
            lastUpdate: timestamp
        });
    }

    // Google Gemini データの更新
    updateGeminiData(geminiData) {
        const timestamp = new Date();
        
        // 分析された人物データを処理
        if (geminiData.analyzedPersons) {
            geminiData.analyzedPersons.forEach(analysis => {
                const personId = analysis.personId || this.generatePersonId();
                
                this.geminiData.set(personId, {
                    personId: personId,
                    timestamp: timestamp,
                    behavior: analysis.behavior,
                    characteristics: analysis.characteristics,
                    actions: analysis.actions,
                    emotions: analysis.emotions,
                    interactions: analysis.interactions,
                    confidence: analysis.confidence || 90,
                    processingTime: analysis.processingTime || 0
                });
            });
        }

        // 統計情報の更新
        this.updateGeminiStats({
            analyzedCount: geminiData.analyzedPersons?.length || 0,
            processingTime: geminiData.averageProcessingTime || 0,
            confidence: geminiData.averageConfidence || 90
        });
    }

    // ITRIOS統計情報の更新
    updateItriosStats(stats) {
        document.getElementById('itrios-detected-count').textContent = stats.detectedCount;
        document.getElementById('itrios-accuracy').textContent = `${stats.accuracy}%`;
        document.getElementById('itrios-last-update').textContent = 
            stats.lastUpdate.toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
    }

    // Gemini統計情報の更新
    updateGeminiStats(stats) {
        document.getElementById('gemini-analyzed-count').textContent = stats.analyzedCount;
        document.getElementById('gemini-processing-time').textContent = `${stats.processingTime.toFixed(1)}s`;
        document.getElementById('gemini-confidence').textContent = `${stats.confidence}%`;
    }

    // 表示の更新
    updateDisplay() {
        this.updatePersonList();
        this.updateBehaviorInsights();
        this.updateIntegratedAnalysis();
    }

    // 人物リストの更新
    updatePersonList() {
        const personListElement = document.getElementById('itrios-person-list');
        personListElement.innerHTML = '';

        // 最新のデータから表示
        const sortedPersons = Array.from(this.itriosData.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.maxPersonHistory);

        sortedPersons.forEach(person => {
            const personCard = this.createPersonCard(person);
            personListElement.appendChild(personCard);
        });

        // データがない場合のメッセージ
        if (sortedPersons.length === 0) {
            personListElement.innerHTML = '<div class="no-data-message">検出された人物データがありません</div>';
        }
    }

    // 人物カードの作成
    createPersonCard(person) {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        const ageDisplay = person.ageRange || `${person.age}歳`;
        const genderDisplay = this.getGenderDisplay(person.gender);
        const confidenceClass = this.getConfidenceClass(person.confidence?.overall || 0);
        
        card.innerHTML = `
            <div class="person-header">
                <span class="person-id">ID: ${person.id}</span>
                <span class="person-timestamp">${person.timestamp.toLocaleTimeString('ja-JP')}</span>
            </div>
            <div class="person-attributes">
                <div class="attribute-item">
                    <span class="attribute-label">年齢</span>
                    <span class="attribute-value">${ageDisplay}</span>
                </div>
                <div class="attribute-item">
                    <span class="attribute-label">性別</span>
                    <span class="attribute-value">${genderDisplay}</span>
                </div>
                <div class="attribute-item">
                    <span class="attribute-label">信頼度</span>
                    <span class="attribute-value">
                        ${Math.round((person.confidence?.overall || 0) * 100)}%
                        <span class="confidence-indicator ${confidenceClass}">
                            ${this.getConfidenceLabel(person.confidence?.overall || 0)}
                        </span>
                    </span>
                </div>
            </div>
        `;
        
        return card;
    }

    // 行動インサイトの更新
    updateBehaviorInsights() {
        const insightsElement = document.getElementById('gemini-behavior-insights');
        insightsElement.innerHTML = '';

        // 最新の分析データから表示
        const sortedInsights = Array.from(this.geminiData.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.maxPersonHistory);

        sortedInsights.forEach(insight => {
            const insightCard = this.createInsightCard(insight);
            insightsElement.appendChild(insightCard);
        });

        // データがない場合のメッセージ
        if (sortedInsights.length === 0) {
            insightsElement.innerHTML = '<div class="no-data-message">分析された行動データがありません</div>';
        }
    }

    // インサイトカードの作成
    createInsightCard(insight) {
        const card = document.createElement('div');
        card.className = 'insight-card';
        
        const behaviorText = this.formatBehaviorText(insight);
        const tags = this.generateInsightTags(insight);
        
        card.innerHTML = `
            <div class="insight-header">
                <span class="insight-person-id">Person ${insight.personId}</span>
                <span class="insight-confidence">${insight.confidence}%</span>
            </div>
            <div class="insight-content">
                <div class="insight-behavior">${behaviorText}</div>
                <div class="insight-tags">
                    ${tags.map(tag => `<span class="insight-tag ${tag.type}">${tag.text}</span>`).join('')}
                </div>
            </div>
        `;
        
        return card;
    }

    // 統合分析の更新
    updateIntegratedAnalysis() {
        const analysis = this.calculateIntegratedMetrics();
        
        // プログレスバーの更新
        this.updateProgressBar('interest-level-bar', 'interest-level-value', 
            analysis.interestLevel, '%');
        this.updateProgressBar('movement-distance-bar', 'movement-distance-value', 
            analysis.movementDistance, 'm', 100);
        this.updateProgressBar('group-behavior-bar', 'group-behavior-value', 
            analysis.groupBehavior, '%');
        this.updateProgressBar('stay-duration-bar', 'stay-duration-value', 
            analysis.stayDuration, '分', 20);
    }

    // 統合メトリクスの計算
    calculateIntegratedMetrics() {
        const geminiAnalyses = Array.from(this.geminiData.values());
        
        if (geminiAnalyses.length === 0) {
            return {
                interestLevel: 0,
                movementDistance: 0,
                groupBehavior: 0,
                stayDuration: 0
            };
        }

        // 関心度の計算
        const interestLevel = geminiAnalyses.reduce((sum, analysis) => {
            return sum + (analysis.characteristics?.interestLevel || 0);
        }, 0) / geminiAnalyses.length;

        // 移動距離の計算
        const movementDistance = geminiAnalyses.reduce((sum, analysis) => {
            return sum + (analysis.behavior?.movementDistance || 0);
        }, 0) / geminiAnalyses.length;

        // グループ行動率の計算
        const groupBehaviorCount = geminiAnalyses.filter(analysis => 
            analysis.interactions?.isGroupBehavior).length;
        const groupBehavior = (groupBehaviorCount / geminiAnalyses.length) * 100;

        // 滞在時間の計算
        const stayDuration = geminiAnalyses.reduce((sum, analysis) => {
            return sum + (analysis.behavior?.stayDuration || 0);
        }, 0) / geminiAnalyses.length;

        return {
            interestLevel: Math.round(interestLevel),
            movementDistance: Math.round(movementDistance * 10) / 10,
            groupBehavior: Math.round(groupBehavior),
            stayDuration: Math.round(stayDuration * 10) / 10
        };
    }

    // プログレスバーの更新
    updateProgressBar(barId, valueId, value, unit, maxValue = 100) {
        const percentage = Math.min((value / maxValue) * 100, 100);
        
        document.getElementById(barId).style.width = `${percentage}%`;
        document.getElementById(valueId).textContent = `${value}${unit}`;
    }

    // ヘルパーメソッド
    generatePersonId() {
        return 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    getGenderDisplay(gender) {
        const genderMap = {
            'male': '男性',
            'female': '女性',
            'unknown': '不明'
        };
        return genderMap[gender] || '不明';
    }

    getConfidenceClass(confidence) {
        if (confidence >= 0.8) return 'confidence-high';
        if (confidence >= 0.6) return 'confidence-medium';
        return 'confidence-low';
    }

    getConfidenceLabel(confidence) {
        if (confidence >= 0.8) return '高';
        if (confidence >= 0.6) return '中';
        return '低';
    }

    formatBehaviorText(insight) {
        const behaviors = [];
        
        if (insight.behavior?.action) {
            behaviors.push(`行動: ${insight.behavior.action}`);
        }
        if (insight.emotions?.primary) {
            behaviors.push(`感情: ${insight.emotions.primary}`);
        }
        if (insight.characteristics?.primaryTrait) {
            behaviors.push(`特徴: ${insight.characteristics.primaryTrait}`);
        }
        
        return behaviors.join(' | ') || '行動データを分析中...';
    }

    generateInsightTags(insight) {
        const tags = [];
        
        if (insight.behavior?.isActive) {
            tags.push({ text: 'アクティブ', type: 'primary' });
        }
        if (insight.interactions?.isGroupBehavior) {
            tags.push({ text: 'グループ', type: 'secondary' });
        }
        if (insight.characteristics?.showsInterest) {
            tags.push({ text: '関心あり', type: 'primary' });
        }
        if (insight.emotions?.isPositive) {
            tags.push({ text: 'ポジティブ', type: '' });
        }
        
        return tags;
    }

    // 古いデータのクリーンアップ
    cleanupOldData() {
        const now = new Date();
        const cutoffTime = now.getTime() - this.dataRetentionTime;

        // ITRIOS データのクリーンアップ
        for (const [id, data] of this.itriosData.entries()) {
            if (data.timestamp.getTime() < cutoffTime) {
                this.itriosData.delete(id);
            }
        }

        // Gemini データのクリーンアップ
        for (const [id, data] of this.geminiData.entries()) {
            if (data.timestamp.getTime() < cutoffTime) {
                this.geminiData.delete(id);
            }
        }
    }

    // モックデータの生成（テスト用）
    generateMockData() {
        const mockItriosData = {
            detectedPersons: [
                {
                    id: 'P001',
                    age: 28,
                    ageRange: '20-30代',
                    gender: 'male',
                    confidence: { overall: 0.92, age: 0.89, gender: 0.95 },
                    position: { x: 150, y: 200 }
                },
                {
                    id: 'P002',
                    age: 45,
                    ageRange: '40-50代',
                    gender: 'female',
                    confidence: { overall: 0.87, age: 0.85, gender: 0.89 },
                    position: { x: 300, y: 180 }
                }
            ],
            accuracy: 94
        };

        const mockGeminiData = {
            analyzedPersons: [
                {
                    personId: 'P001',
                    behavior: {
                        action: '展示物を詳しく観察',
                        movementDistance: 15.2,
                        stayDuration: 12.5,
                        isActive: true
                    },
                    characteristics: {
                        interestLevel: 85,
                        primaryTrait: '好奇心旺盛',
                        showsInterest: true
                    },
                    emotions: {
                        primary: '興味深い',
                        isPositive: true
                    },
                    interactions: {
                        isGroupBehavior: false
                    },
                    confidence: 91,
                    processingTime: 2.3
                }
            ],
            averageProcessingTime: 2.1,
            averageConfidence: 89
        };

        this.handlePersonDataUpdate({
            itrios: mockItriosData,
            gemini: mockGeminiData
        });
    }
}
