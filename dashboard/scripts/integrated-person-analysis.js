/**
 * 統合人物分析システム
 * SONY ITRIOSとGoogle Geminiのデータを統合して表示
 */

class IntegratedPersonAnalysisManager {
    constructor() {
        this.updateInterval = 5000; // 5秒間隔で更新
        this.persons = new Map(); // 統合人物データ
        this.currentFilter = 'all';
        this.currentSort = 'detection-time';
        
        this.init();
    }

    init() {
        this.updatePersonData();
        this.startAutoUpdate();
        this.setupEventListeners();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updatePersonData();
        }, this.updateInterval);
    }

    setupEventListeners() {
        // モーダル外クリックで閉じる
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('person-detail-modal');
            if (e.target === modal) {
                this.closePersonModal();
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePersonModal();
            }
        });
    }

    async updatePersonData() {
        try {
            // APIからデータを取得（実際の実装では複数のAPIを呼び出し）
            const personAnalysisData = await this.fetchPersonAnalysisData();
            
            // データを統合
            this.integratePersonData(personAnalysisData);
            
            // UI更新
            this.updateOverviewStats();
            this.renderPersonList();
            
        } catch (error) {
            console.error('人物データ更新エラー:', error);
        }
    }

    async fetchPersonAnalysisData() {
        // 実際の実装では複数のAPIエンドポイントからデータを取得
        return this.generateMockPersonData();
    }

    generateMockPersonData() {
        const personCount = Math.floor(Math.random() * 5) + 1;
        const persons = [];

        for (let i = 0; i < personCount; i++) {
            const personId = `P${String(Math.floor(Math.random() * 9000) + 1000)}`;
            const age = Math.floor(Math.random() * 60) + 20;
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            
            // ITRIOS データ
            const itriosData = {
                id: personId,
                age: age,
                ageRange: this.getAgeRange(age),
                gender: gender,
                confidence: {
                    overall: Math.random() * 0.3 + 0.7, // 0.7-1.0
                    age: Math.random() * 0.2 + 0.8,     // 0.8-1.0
                    gender: Math.random() * 0.2 + 0.8   // 0.8-1.0
                },
                position: {
                    x: Math.floor(Math.random() * 400) + 100,
                    y: Math.floor(Math.random() * 300) + 100
                },
                detectionTime: new Date(Date.now() - Math.random() * 300000) // 過去5分以内
            };

            // Gemini 分析データ
            const behaviors = [
                '展示物を詳しく観察している',
                'スマートフォンで写真を撮影',
                '他の来場者と会話中',
                'パンフレットを読んでいる',
                'ゆっくりと歩き回っている',
                '特定の展示に長時間滞在',
                'メモを取りながら見学',
                '案内板を確認している',
                '興味深そうに展示を見回している'
            ];

            const emotions = ['興味深い', '楽しそう', '集中している', '驚いている', '満足している', '好奇心旺盛', '感動している'];
            const traits = ['好奇心旺盛', '慎重', '社交的', '分析的', '積極的', '観察力が高い', '学習意欲が高い'];

            const geminiData = {
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
                    isPositive: Math.random() > 0.1
                },
                interactions: {
                    isGroupBehavior: Math.random() > 0.6,
                    groupSize: Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 2 : 1
                },
                confidence: Math.floor(Math.random() * 20) + 80, // 80-100
                processingTime: Math.round((Math.random() * 3 + 1) * 10) / 10,
                analysisTime: new Date(Date.now() - Math.random() * 240000) // 過去4分以内
            };

            persons.push({
                itrios: itriosData,
                gemini: geminiData,
                integrated: this.createIntegratedData(itriosData, geminiData)
            });
        }

        return persons;
    }

    createIntegratedData(itriosData, geminiData) {
        return {
            id: itriosData.id,
            detectionTime: itriosData.detectionTime,
            analysisTime: geminiData.analysisTime,
            overallConfidence: (itriosData.confidence.overall + geminiData.confidence / 100) / 2,
            status: {
                isActive: geminiData.behavior.isActive,
                isInterested: geminiData.characteristics.showsInterest,
                isGroupBehavior: geminiData.interactions.isGroupBehavior,
                isHighConfidence: itriosData.confidence.overall > 0.9 && geminiData.confidence > 90
            },
            summary: {
                age: itriosData.age,
                ageRange: itriosData.ageRange,
                gender: itriosData.gender,
                interestLevel: geminiData.characteristics.interestLevel,
                stayDuration: geminiData.behavior.stayDuration,
                movementDistance: geminiData.behavior.movementDistance,
                primaryEmotion: geminiData.emotions.primary,
                primaryTrait: geminiData.characteristics.primaryTrait,
                currentAction: geminiData.behavior.action
            }
        };
    }

    integratePersonData(newPersons) {
        // 既存データと新データを統合
        newPersons.forEach(personData => {
            const personId = personData.integrated.id;
            
            if (this.persons.has(personId)) {
                // 既存人物のデータを更新
                const existingPerson = this.persons.get(personId);
                existingPerson.itrios = personData.itrios;
                existingPerson.gemini = personData.gemini;
                existingPerson.integrated = personData.integrated;
                existingPerson.lastUpdate = new Date();
            } else {
                // 新しい人物を追加
                personData.firstDetection = new Date();
                personData.lastUpdate = new Date();
                this.persons.set(personId, personData);
            }
        });

        // 古いデータを削除（10分以上更新されていない）
        const cutoffTime = Date.now() - 600000; // 10分
        for (const [personId, personData] of this.persons.entries()) {
            if (personData.lastUpdate.getTime() < cutoffTime) {
                this.persons.delete(personId);
            }
        }
    }

    updateOverviewStats() {
        const totalPersons = this.persons.size;
        const activePersons = Array.from(this.persons.values()).filter(p => p.integrated.status.isActive).length;
        const interestedPersons = Array.from(this.persons.values()).filter(p => p.integrated.status.isInterested).length;
        const avgConfidence = totalPersons > 0 ? 
            Array.from(this.persons.values()).reduce((sum, p) => sum + p.integrated.overallConfidence, 0) / totalPersons : 0;

        // ITRIOS統計
        this.updateElement('itrios-detected-count', totalPersons);
        this.updateElement('itrios-accuracy', `${Math.round(avgConfidence * 100)}%`);

        // Gemini統計
        this.updateElement('gemini-analyzed-count', activePersons);
        this.updateElement('gemini-confidence', `${Math.round(avgConfidence * 100)}%`);

        // 連携統計
        this.updateElement('linked-persons', totalPersons);
        this.updateElement('link-accuracy', '98%');

        // 処理時間
        const avgProcessingTime = totalPersons > 0 ?
            Array.from(this.persons.values()).reduce((sum, p) => sum + p.gemini.processingTime, 0) / totalPersons : 0;
        this.updateElement('avg-processing-time', `${avgProcessingTime.toFixed(1)}s`);
        this.updateElement('last-update-time', new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }));
    }

    renderPersonList() {
        const container = document.getElementById('integrated-person-list');
        if (!container) return;

        let filteredPersons = this.getFilteredPersons();
        filteredPersons = this.getSortedPersons(filteredPersons);

        if (filteredPersons.length === 0) {
            container.innerHTML = '<div class="no-data-message">現在検出されている人物はありません</div>';
            return;
        }

        container.innerHTML = filteredPersons.map(person => this.createPersonCard(person)).join('');
    }

    getFilteredPersons() {
        const allPersons = Array.from(this.persons.values());
        
        switch (this.currentFilter) {
            case 'active':
                return allPersons.filter(p => p.integrated.status.isActive);
            case 'interested':
                return allPersons.filter(p => p.integrated.status.isInterested);
            case 'group':
                return allPersons.filter(p => p.integrated.status.isGroupBehavior);
            default:
                return allPersons;
        }
    }

    getSortedPersons(persons) {
        switch (this.currentSort) {
            case 'interest-level':
                return persons.sort((a, b) => b.integrated.summary.interestLevel - a.integrated.summary.interestLevel);
            case 'stay-duration':
                return persons.sort((a, b) => b.integrated.summary.stayDuration - a.integrated.summary.stayDuration);
            case 'confidence':
                return persons.sort((a, b) => b.integrated.overallConfidence - a.integrated.overallConfidence);
            default: // detection-time
                return persons.sort((a, b) => b.integrated.detectionTime - a.integrated.detectionTime);
        }
    }

    createPersonCard(person) {
        const integrated = person.integrated;
        const summary = integrated.summary;
        
        // ステータスバッジ
        const badges = [];
        if (integrated.status.isActive) badges.push('<span class="status-badge active">アクティブ</span>');
        if (integrated.status.isInterested) badges.push('<span class="status-badge interested">関心高</span>');
        if (integrated.status.isGroupBehavior) badges.push('<span class="status-badge group">グループ</span>');
        if (integrated.status.isHighConfidence) badges.push('<span class="status-badge confident">高信頼</span>');

        // カードのクラス
        let cardClass = 'integrated-person-card';
        if (integrated.status.isInterested) cardClass += ' high-interest';
        if (integrated.status.isGroupBehavior) cardClass += ' group-behavior';
        if (integrated.status.isActive) cardClass += ' active-person';

        return `
            <div class="${cardClass}" onclick="integratedPersonAnalysisManager.showPersonDetail('${integrated.id}')">
                <div class="person-card-header">
                    <div class="person-id-section">
                        <div class="person-avatar">${integrated.id.slice(-2)}</div>
                        <div class="person-id-info">
                            <div class="person-id">${integrated.id}</div>
                            <div class="person-detection-time">
                                検出: ${integrated.detectionTime.toLocaleTimeString('ja-JP', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                            </div>
                        </div>
                    </div>
                    <div class="person-status-badges">
                        ${badges.join('')}
                    </div>
                </div>

                <div class="person-data-grid">
                    <div class="data-section">
                        <div class="data-section-title">
                            🎥 ITRIOS検出データ
                        </div>
                        <div class="data-items">
                            <div class="data-item">
                                <span class="data-label">年齢</span>
                                <span class="data-value">${summary.age}歳 (${summary.ageRange})</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">性別</span>
                                <span class="data-value">${summary.gender === 'male' ? '男性' : '女性'}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">検出信頼度</span>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${person.itrios.confidence.overall * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="data-section">
                        <div class="data-section-title">
                            📱 Gemini分析データ
                        </div>
                        <div class="data-items">
                            <div class="data-item">
                                <span class="data-label">関心度</span>
                                <span class="data-value">${summary.interestLevel}%</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">滞在時間</span>
                                <span class="data-value">${summary.stayDuration}分</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">分析信頼度</span>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${person.gemini.confidence}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="behavior-section">
                    <div class="behavior-section-title">
                        🧠 行動・特徴分析
                    </div>
                    <div class="behavior-description">
                        ${summary.currentAction}
                    </div>
                    <div class="behavior-tags">
                        <span class="behavior-tag primary">${summary.primaryTrait}</span>
                        <span class="behavior-tag emotion">${summary.primaryEmotion}</span>
                        <span class="behavior-tag">移動距離: ${summary.movementDistance}m</span>
                    </div>
                </div>
            </div>
        `;
    }

    showPersonDetail(personId) {
        const person = this.persons.get(personId);
        if (!person) return;

        const modal = document.getElementById('person-detail-modal');
        const title = document.getElementById('modal-person-title');
        const content = document.getElementById('modal-person-content');

        title.textContent = `人物詳細分析 - ${personId}`;
        content.innerHTML = this.createDetailContent(person);

        modal.classList.add('active');
    }

    createDetailContent(person) {
        const itrios = person.itrios;
        const gemini = person.gemini;
        const integrated = person.integrated;

        return `
            <div class="detail-section">
                <div class="detail-section-title">
                    🎥 SONY ITRIOS 検出データ
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-item-title">基本情報</div>
                        <div class="detail-item-value">
                            ${integrated.summary.age}歳 ${integrated.summary.gender === 'male' ? '男性' : '女性'}<br>
                            ${integrated.summary.ageRange}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">検出位置</div>
                        <div class="detail-item-value">
                            X: ${itrios.position.x}px<br>
                            Y: ${itrios.position.y}px
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">検出信頼度</div>
                        <div class="detail-item-value">
                            総合: ${Math.round(itrios.confidence.overall * 100)}%<br>
                            年齢: ${Math.round(itrios.confidence.age * 100)}%<br>
                            性別: ${Math.round(itrios.confidence.gender * 100)}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">検出時刻</div>
                        <div class="detail-item-value">
                            ${itrios.detectionTime.toLocaleString('ja-JP')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">
                    📱 Google Gemini 分析データ
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-item-title">行動分析</div>
                        <div class="detail-item-value">
                            ${gemini.behavior.action}<br>
                            ${gemini.behavior.isActive ? 'アクティブ' : '静的'}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">移動・滞在</div>
                        <div class="detail-item-value">
                            移動距離: ${gemini.behavior.movementDistance}m<br>
                            滞在時間: ${gemini.behavior.stayDuration}分
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">特徴・感情</div>
                        <div class="detail-item-value">
                            主要特徴: ${gemini.characteristics.primaryTrait}<br>
                            感情: ${gemini.emotions.primary}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">関心・グループ</div>
                        <div class="detail-item-value">
                            関心度: ${gemini.characteristics.interestLevel}%<br>
                            ${gemini.interactions.isGroupBehavior ? `グループ行動 (${gemini.interactions.groupSize}人)` : '個人行動'}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">分析精度</div>
                        <div class="detail-item-value">
                            信頼度: ${gemini.confidence}%<br>
                            処理時間: ${gemini.processingTime}秒
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">分析時刻</div>
                        <div class="detail-item-value">
                            ${gemini.analysisTime.toLocaleString('ja-JP')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">
                    🔗 統合分析結果
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-item-title">総合信頼度</div>
                        <div class="detail-item-value">
                            ${Math.round(integrated.overallConfidence * 100)}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-title">ステータス</div>
                        <div class="detail-item-value">
                            ${integrated.status.isActive ? '✅ アクティブ' : '⭕ 静的'}<br>
                            ${integrated.status.isInterested ? '✅ 高関心' : '⭕ 通常関心'}<br>
                            ${integrated.status.isGroupBehavior ? '✅ グループ行動' : '⭕ 個人行動'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">
                    📊 行動タイムライン
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">${itrios.detectionTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-content">ITRIOS により人物検出 (信頼度: ${Math.round(itrios.confidence.overall * 100)}%)</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">${gemini.analysisTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-content">Gemini による行動分析開始</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">${new Date(gemini.analysisTime.getTime() + gemini.processingTime * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-content">行動分析完了: "${gemini.behavior.action}"</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-time">${person.lastUpdate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div class="timeline-content">最終データ更新</div>
                </div>
            </div>
        `;
    }

    closePersonModal() {
        const modal = document.getElementById('person-detail-modal');
        modal.classList.remove('active');
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

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}

// フィルター・ソート関数
function filterPersons(filter) {
    if (window.integratedPersonAnalysisManager) {
        window.integratedPersonAnalysisManager.currentFilter = filter;
        
        // ボタンの状態更新
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // リスト再描画
        window.integratedPersonAnalysisManager.renderPersonList();
    }
}

function sortPersons(sortType) {
    if (window.integratedPersonAnalysisManager) {
        window.integratedPersonAnalysisManager.currentSort = sortType;
        window.integratedPersonAnalysisManager.renderPersonList();
    }
}

function closePersonModal() {
    if (window.integratedPersonAnalysisManager) {
        window.integratedPersonAnalysisManager.closePersonModal();
    }
}

// デモ用関数
function generateIntegratedPersonData() {
    if (window.integratedPersonAnalysisManager) {
        // 新しい人物データを強制生成
        window.integratedPersonAnalysisManager.updatePersonData();
        console.log('統合人物データを生成しました');
    }
}

function clearIntegratedPersonData() {
    if (window.integratedPersonAnalysisManager) {
        window.integratedPersonAnalysisManager.persons.clear();
        window.integratedPersonAnalysisManager.updateOverviewStats();
        window.integratedPersonAnalysisManager.renderPersonList();
        console.log('統合人物データをクリアしました');
    }
}

// グローバルインスタンス
let integratedPersonAnalysisManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', function() {
    integratedPersonAnalysisManager = new IntegratedPersonAnalysisManager();
    window.integratedPersonAnalysisManager = integratedPersonAnalysisManager;
});
