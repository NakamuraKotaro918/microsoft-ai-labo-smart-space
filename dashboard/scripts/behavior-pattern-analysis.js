/**
 * 行動パターン分析システム
 * 展示物への関心度別行動パターンの分析と表示
 */

class BehaviorPatternAnalysisManager {
    constructor() {
        this.updateInterval = 5000; // 5秒間隔で更新
        this.behaviorPatterns = {
            high: [],
            medium: [],
            low: []
        };
        
        // 行動パターンの定義
        this.behaviorDefinitions = {
            high: [
                '展示物を詳しく観察している',
                'スマートフォンで写真を撮影',
                'メモを取りながら見学',
                '特定の展示に長時間滞在',
                '案内板を詳しく読んでいる',
                '他の来場者と展示について議論',
                '展示物に近づいて詳細を確認'
            ],
            medium: [
                'パンフレットを読んでいる',
                'ゆっくりと歩き回っている',
                '案内板を確認している',
                '興味深そうに展示を見回している',
                '他の来場者と会話中',
                '展示物を一通り見学',
                '音声ガイドを聞いている'
            ],
            low: [
                '素早く通り過ぎている',
                '軽く展示を眺めている',
                '休憩しながら見学',
                '出口に向かって移動中',
                '待ち合わせ場所を探している',
                '時間を確認している',
                '他のエリアを探している'
            ]
        };
        
        this.init();
    }

    init() {
        this.updateBehaviorPatterns();
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateBehaviorPatterns();
        }, this.updateInterval);
    }

    async updateBehaviorPatterns() {
        try {
            // 統合人物データから行動パターンを分析
            const personData = await this.getPersonData();
            this.analyzeBehaviorPatterns(personData);
            this.renderBehaviorPatterns();
            this.updateOtherMetrics(personData);
        } catch (error) {
            console.error('行動パターン分析エラー:', error);
        }
    }

    async getPersonData() {
        // 実際の実装では統合人物分析マネージャーからデータを取得
        if (window.integratedPersonAnalysisManager && window.integratedPersonAnalysisManager.persons) {
            return Array.from(window.integratedPersonAnalysisManager.persons.values());
        }
        
        // フォールバック: モックデータを生成
        return this.generateMockPersonData();
    }

    generateMockPersonData() {
        const personCount = Math.floor(Math.random() * 8) + 2; // 2-10人
        const persons = [];

        for (let i = 0; i < personCount; i++) {
            const interestLevel = Math.floor(Math.random() * 100);
            let interestCategory;
            
            if (interestLevel >= 75) {
                interestCategory = 'high';
            } else if (interestLevel >= 45) {
                interestCategory = 'medium';
            } else {
                interestCategory = 'low';
            }

            const behavior = this.behaviorDefinitions[interestCategory][
                Math.floor(Math.random() * this.behaviorDefinitions[interestCategory].length)
            ];

            persons.push({
                integrated: {
                    id: `P${Math.floor(Math.random() * 9000) + 1000}`,
                    summary: {
                        interestLevel: interestLevel,
                        currentAction: behavior,
                        stayDuration: Math.round((Math.random() * 15 + 5) * 10) / 10,
                        movementDistance: Math.round((Math.random() * 20 + 5) * 10) / 10
                    },
                    status: {
                        isGroupBehavior: Math.random() > 0.6,
                        isActive: Math.random() > 0.3
                    }
                },
                interestCategory: interestCategory
            });
        }

        return persons;
    }

    analyzeBehaviorPatterns(personData) {
        // 関心度別に人物を分類
        this.behaviorPatterns = {
            high: [],
            medium: [],
            low: []
        };

        personData.forEach(person => {
            const interestLevel = person.integrated.summary.interestLevel;
            const behavior = person.integrated.summary.currentAction;
            
            let category;
            if (interestLevel >= 75) {
                category = 'high';
            } else if (interestLevel >= 45) {
                category = 'medium';
            } else {
                category = 'low';
            }

            this.behaviorPatterns[category].push({
                personId: person.integrated.id,
                behavior: behavior,
                interestLevel: interestLevel,
                stayDuration: person.integrated.summary.stayDuration,
                movementDistance: person.integrated.summary.movementDistance
            });
        });
    }

    renderBehaviorPatterns() {
        const totalPersons = Object.values(this.behaviorPatterns).reduce((sum, arr) => sum + arr.length, 0);
        
        // 各関心度レベルの統計を更新
        this.updateInterestLevelStats('high', this.behaviorPatterns.high, totalPersons);
        this.updateInterestLevelStats('medium', this.behaviorPatterns.medium, totalPersons);
        this.updateInterestLevelStats('low', this.behaviorPatterns.low, totalPersons);
    }

    updateInterestLevelStats(level, persons, totalPersons) {
        const count = persons.length;
        const percentage = totalPersons > 0 ? Math.round((count / totalPersons) * 100) : 0;

        // 人数とパーセンテージを更新
        this.updateElement(`${level}-interest-count`, count);
        this.updateElement(`${level}-interest-percentage`, `${percentage}%`);

        // 行動リストを更新
        this.renderBehaviorList(level, persons);
    }

    renderBehaviorList(level, persons) {
        const container = document.getElementById(`${level}-interest-behaviors`);
        if (!container) return;

        if (persons.length === 0) {
            container.innerHTML = '<div class="no-data-message">該当する行動はありません</div>';
            return;
        }

        // 行動ごとに集計
        const behaviorCounts = {};
        persons.forEach(person => {
            const behavior = person.behavior;
            if (behaviorCounts[behavior]) {
                behaviorCounts[behavior]++;
            } else {
                behaviorCounts[behavior] = 1;
            }
        });

        // 行動を頻度順にソート
        const sortedBehaviors = Object.entries(behaviorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // 上位5つまで表示

        container.innerHTML = sortedBehaviors.map(([behavior, count]) => `
            <div class="behavior-item-detail">
                <span class="behavior-name">${behavior}</span>
                <span class="behavior-count">${count}人</span>
            </div>
        `).join('');
    }

    updateOtherMetrics(personData) {
        if (personData.length === 0) return;

        // 平均移動距離
        const avgMovement = personData.reduce((sum, p) => sum + p.integrated.summary.movementDistance, 0) / personData.length;
        this.updateElement('movement-distance-value', `${avgMovement.toFixed(1)}m`);
        this.updateProgressBar('movement-distance-bar', Math.min(avgMovement / 25 * 100, 100)); // 25mを100%とする

        // グループ行動率
        const groupBehaviorCount = personData.filter(p => p.integrated.status.isGroupBehavior).length;
        const groupBehaviorRate = Math.round((groupBehaviorCount / personData.length) * 100);
        this.updateElement('group-behavior-value', `${groupBehaviorRate}%`);
        this.updateProgressBar('group-behavior-bar', groupBehaviorRate);

        // 平均滞在時間
        const avgStayDuration = personData.reduce((sum, p) => sum + p.integrated.summary.stayDuration, 0) / personData.length;
        this.updateElement('stay-duration-value', `${avgStayDuration.toFixed(1)}分`);
        this.updateProgressBar('stay-duration-bar', Math.min(avgStayDuration / 20 * 100, 100)); // 20分を100%とする

        // リピート訪問率（モック）
        const repeatVisitRate = Math.floor(Math.random() * 30) + 15; // 15-45%
        this.updateElement('repeat-visit-value', `${repeatVisitRate}%`);
        this.updateProgressBar('repeat-visit-bar', repeatVisitRate);
    }

    updateProgressBar(elementId, percentage) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${percentage}%`;
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // 数値の場合はカウントアップアニメーション
            if (elementId.includes('-count') && !isNaN(parseInt(value))) {
                this.animateCount(element, parseInt(value));
            } else {
                element.textContent = value;
            }
        }
    }

    animateCount(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 10);
        
        if (currentValue < targetValue) {
            element.textContent = Math.min(currentValue + increment, targetValue);
            setTimeout(() => this.animateCount(element, targetValue), 50);
        } else if (currentValue > targetValue) {
            element.textContent = Math.max(currentValue - Math.abs(increment), targetValue);
            setTimeout(() => this.animateCount(element, targetValue), 50);
        }
    }

    // 詳細分析データの取得
    getBehaviorPatternSummary() {
        const totalPersons = Object.values(this.behaviorPatterns).reduce((sum, arr) => sum + arr.length, 0);
        
        return {
            total: totalPersons,
            highInterest: {
                count: this.behaviorPatterns.high.length,
                percentage: totalPersons > 0 ? Math.round((this.behaviorPatterns.high.length / totalPersons) * 100) : 0,
                topBehaviors: this.getTopBehaviors('high')
            },
            mediumInterest: {
                count: this.behaviorPatterns.medium.length,
                percentage: totalPersons > 0 ? Math.round((this.behaviorPatterns.medium.length / totalPersons) * 100) : 0,
                topBehaviors: this.getTopBehaviors('medium')
            },
            lowInterest: {
                count: this.behaviorPatterns.low.length,
                percentage: totalPersons > 0 ? Math.round((this.behaviorPatterns.low.length / totalPersons) * 100) : 0,
                topBehaviors: this.getTopBehaviors('low')
            }
        };
    }

    getTopBehaviors(level) {
        const persons = this.behaviorPatterns[level];
        const behaviorCounts = {};
        
        persons.forEach(person => {
            const behavior = person.behavior;
            behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
        });

        return Object.entries(behaviorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([behavior, count]) => ({ behavior, count }));
    }
}

// デモ用関数
function generateBehaviorPatternDemo() {
    if (window.behaviorPatternAnalysisManager) {
        window.behaviorPatternAnalysisManager.updateBehaviorPatterns();
        console.log('行動パターン分析データを更新しました');
    }
}

// グローバルインスタンス
let behaviorPatternAnalysisManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    behaviorPatternAnalysisManager = new BehaviorPatternAnalysisManager();
    window.behaviorPatternAnalysisManager = behaviorPatternAnalysisManager;
});
