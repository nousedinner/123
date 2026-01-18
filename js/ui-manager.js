/**
 * UI管理模块 - 清理版（无修正功能）
 */

// 使用立即执行函数避免全局污染
(function() {
    // 获取常量的辅助函数
    const getConstants = () => {
        return window.APP_CONSTANTS || {};
    };

    const UIManager = {
        // DOM元素引用
        elements: {},
        
        // 当前状态
        currentState: {
            mode: 'debt',
            viewType: 'day',
            settings: null,
            records: {}
        },
        
        // 初始化UI
        init() {
            console.log('初始化UI管理器');
            
            // 确保依赖已加载
            if (!window.DataManager || !window.Calculator) {
                console.error('依赖模块未加载');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            this.createAppStructure();
            this.bindEventListeners();
            return this;
        },
        
        // 创建应用结构
        createAppStructure() {
            const appContainer = document.getElementById('app-container');
            if (!appContainer) {
                console.error('未找到app-container元素');
                return;
            }
            
            const messages = getConstants().MESSAGES || {};
            
            appContainer.innerHTML = `
                <!-- 头部 -->
                <header class="app-header">
                    <h1 id="app-title">个人财务进度追踪工具</h1>
                    <p id="app-subtitle">记录每日收入，动态追踪财务目标进度</p>
                    <div class="mode-switch">
                        <button id="debt-mode-btn" class="mode-btn debt-mode active">偿债模式</button>
                        <button id="saving-mode-btn" class="mode-btn saving-mode">储蓄模式</button>
                    </div>
                </header>
                
                <!-- 进度概览 -->
                <section class="progress-section">
                    <div class="card">
                        <h2 class="card-title"><i class="fas fa-chart-line"></i> 进度概览</h2>
                        <div class="progress-text">
                            <span id="progress-label">已偿还: <span id="progress-amount">¥0</span> / <span id="total-amount">¥0</span></span>
                            <span id="progress-percent">0%</span>
                        </div>
                        <div class="progress-bar-container">
                            <div id="progress-bar" class="progress-bar" style="width: 0%;"></div>
                        </div>
                        <div class="stats-grid" id="stats-grid">
                            <!-- 统计数据将通过JS动态填充 -->
                        </div>
                    </div>
                </section>
                
                <!-- 主要内容区域 -->
                <main class="main-content">
                    <div class="left-column">
                        <!-- 初始设置 -->
                        <div class="card">
                            <h2 class="card-title"><i class="fas fa-sliders-h"></i> 初始设置</h2>
                            <div id="setup-alert" class="alert alert-warning">
                                ${messages.SETUP_REQUIRED || '请先完成初始设置以开始使用'}
                            </div>
                            <form id="setup-form">
                                <div class="form-group">
                                    <label for="total-amount-input">总债务/总目标金额 (¥)</label>
                                    <input type="number" id="total-amount-input" min="0" step="0.01" required>
                                </div>
                                <div class="form-group">
                                    <label for="target-date">预期完成日期</label>
                                    <input type="text" id="target-date" placeholder="YYYY-MM-DD 或直接输入20261215" pattern="\\d{4}-\\d{2}-\\d{2}" required>
                                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                                        支持格式：YYYY-MM-DD 或直接连续输入数字（如20261215会自动转为2026-12-15），输入时会自动修正月份/日期至合理范围
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="monthly-expense">每月必要支出 (¥)</label>
                                    <input type="number" id="monthly-expense" min="0" step="0.01" required>
                                </div>
                                <div class="form-group">
                                    <label for="daily-income">每日预计收入 (¥)</label>
                                    <input type="number" id="daily-income" min="0" step="0.01" required>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> 保存设置
                                </button>
                            </form>
                        </div>
                        
                        <!-- 历史记录 -->
                        <div class="card">
                            <h2 class="card-title"><i class="fas fa-history"></i> 历史记录</h2>
                            <div class="history-filters">
                                <button class="filter-btn active" data-period="day">日视图</button>
                                <button class="filter-btn" data-period="week">周视图</button>
                                <button class="filter-btn" data-period="month">月视图</button>
                            </div>
                            <div id="history-list" class="history-list">
                                <div class="history-item empty-history">
                                    <div class="history-description" style="text-align: center; width: 100%;">
                                        暂无记录，请开始记录您的财务数据
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="right-column">
                        <!-- 日常记录 -->
                        <div class="card">
                            <h2 class="card-title"><i class="fas fa-edit"></i> 日常记录</h2>
                            <div id="record-alert" class="alert alert-warning" style="display: none;">
                                ${messages.SETUP_REQUIRED || '请先完成初始设置以开始使用'}
                            </div>
                            
                            <div class="form-group">
                                <label for="today-income">今日收入 (¥)</label>
                                <input type="number" id="today-income" min="0" step="0.01">
                                <button id="record-today-income" class="btn btn-primary" style="margin-top: 10px; width: 100%;">
                                    <i class="fas fa-calendar-day"></i> 记录今日收入
                                </button>
                            </div>
                            
                            <div class="form-group">
                                <label for="extra-income-amount">额外收入 (¥)</label>
                                <input type="number" id="extra-income-amount" min="0" step="0.01">
                                <input type="text" id="extra-income-description" placeholder="描述 (如: 奖金, 兼职等)" style="margin-top: 5px;">
                                <button id="record-extra-income" class="btn btn-success" style="margin-top: 10px; width: 100%;">
                                    <i class="fas fa-plus-circle"></i> 记录额外收入
                                </button>
                            </div>
                            
                            <div class="form-group">
                                <label for="extra-expense-amount">额外支出 (¥)</label>
                                <input type="number" id="extra-expense-amount" min="0" step="0.01">
                                <input type="text" id="extra-expense-description" placeholder="描述 (如: 购物, 餐饮等)" style="margin-top: 5px;">
                                <button id="record-extra-expense" class="btn btn-danger" style="margin-top: 10px; width: 100%;">
                                    <i class="fas fa-minus-circle"></i> 记录额外支出
                                </button>
                            </div>
                        </div>
                        
                        <!-- 数据管理 -->
                        <div class="card data-management-section">
                            <h2 class="card-title"><i class="fas fa-database"></i> 数据管理</h2>
                            <p style="margin-bottom: 15px;">所有数据存储在您的浏览器本地，不会上传到服务器。</p>
                            <div class="clear-data-section">
                                <button id="clear-data-btn" class="btn btn-danger" style="width: 100%;">
                                    <i class="fas fa-trash-alt"></i> 清除所有数据
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                
                <!-- 页脚 -->
                <footer class="app-footer">
                    <p>个人财务进度追踪工具 &copy; 2023 | 纯前端单页应用 | 数据存储在浏览器本地</p>
                    <p class="footer-note">提示: 如需在不同设备间同步数据，请考虑导出/导入数据功能(后续版本添加)</p>
                </footer>
            `;
            
            // 缓存DOM元素引用
            this.cacheElements();
            
            // 设置目标日期默认值为一个月后，并自动格式化用户输入（支持连续数字如20261215）
            const targetDateInput = document.getElementById('target-date');
            if (targetDateInput) {
                const oneMonthLater = new Date();
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                const formattedDate = oneMonthLater.toISOString().split('T')[0];
                targetDateInput.value = formattedDate;
                
                // 保存上一个有效的完整日期（用于发生无效输入时回退）
                let previousValid = formattedDate;
                
                // 辅助：将任意输入标准化为 YYYY-MM-DD 的显示形式（仅格式化，不校验合法性）
                const normalizeAndFormat = (val) => {
                    if (!val) return '';
                    // 只保留数字
                    let digits = String(val).replace(/[^0-9]/g, '');
                    if (digits.length > 8) digits = digits.slice(0, 8);
                    if (digits.length <= 4) return digits;
                    if (digits.length <= 6) return digits.slice(0, 4) + '-' + digits.slice(4);
                    return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6, 8);
                };
                
                // 在输入时动态格式化（支持用户连续输入8位数字），并在形成完整日期时校验其存在性
                targetDateInput.addEventListener('input', () => {
                    const raw = targetDateInput.value;
                    const formatted = normalizeAndFormat(raw);
                    // 仅在需要时更新以避免破坏用户编辑体验
                    if (formatted !== raw) {
                        targetDateInput.value = formatted;
                        // 将光标移动到末尾，简单可靠
                        try {
                            targetDateInput.setSelectionRange(targetDateInput.value.length, targetDateInput.value.length);
                        } catch (e) {
                            // ignore
                        }
                    }
                    
                    // 如果是完整格式（YYYY-MM-DD），校验日期是否真实存在；若无效则回退并提示
                    if (formatted.length === 10) {
                        if (this.isValidDate && this.isValidDate(formatted)) {
                            previousValid = formatted;
                        } else {
                            // 回退到上一个有效日期并提示用户
                            targetDateInput.value = previousValid || '';
                            try {
                                targetDateInput.setSelectionRange(targetDateInput.value.length, targetDateInput.value.length);
                            } catch (e) {
                                // ignore
                            }
                            if (this.showMessage) {
                                this.showMessage('请输入存在的有效日期，格式：YYYY-MM-DD', 'error');
                            }
                        }
                    }
                });
                
                // 失焦时确保如果用户粘贴了8位纯数字也会被格式化并校验有效性
                targetDateInput.addEventListener('blur', () => {
                    const val = targetDateInput.value.trim();
                    if (/^\d{8}$/.test(val)) {
                        const formatted = val.slice(0, 4) + '-' + val.slice(4, 6) + '-' + val.slice(6, 8);
                        if (this.isValidDate && this.isValidDate(formatted)) {
                            targetDateInput.value = formatted;
                            previousValid = formatted;
                        } else {
                            // 回退并提示
                            targetDateInput.value = previousValid || '';
                            if (this.showMessage) this.showMessage('请输入存在的有效日期，格式：YYYY-MM-DD', 'error');
                        }
                    } else {
                        const formatted = normalizeAndFormat(val);
                        if (formatted.length === 10) {
                            if (this.isValidDate && this.isValidDate(formatted)) {
                                targetDateInput.value = formatted;
                                previousValid = formatted;
                            } else {
                                targetDateInput.value = previousValid || '';
                                if (this.showMessage) this.showMessage('请输入存在的有效日期，格式：YYYY-MM-DD', 'error');
                            }
                        } else {
                            targetDateInput.value = formatted;
                        }
                    }
                });
            }
            
            console.log('应用结构创建完成');
        },
        
        // 缓存DOM元素引用
        cacheElements() {
            this.elements = {
                appTitle: document.getElementById('app-title'),
                appSubtitle: document.getElementById('app-subtitle'),
                progressLabel: document.getElementById('progress-label'),
                progressAmount: document.getElementById('progress-amount'),
                totalAmount: document.getElementById('total-amount'),
                progressPercent: document.getElementById('progress-percent'),
                progressBar: document.getElementById('progress-bar'),
                statsGrid: document.getElementById('stats-grid'),
                setupAlert: document.getElementById('setup-alert'),
                recordAlert: document.getElementById('record-alert'),
                setupForm: document.getElementById('setup-form'),
                todayIncomeInput: document.getElementById('today-income'),
                extraIncomeAmount: document.getElementById('extra-income-amount'),
                extraIncomeDesc: document.getElementById('extra-income-description'),
                extraExpenseAmount: document.getElementById('extra-expense-amount'),
                extraExpenseDesc: document.getElementById('extra-expense-description'),
                historyList: document.getElementById('history-list')
            };
            
            console.log('DOM元素缓存完成');
        },
        
        // 绑定事件监听器
        bindEventListeners() {
            console.log('绑定事件监听器...');
            
            // 模式切换
            const debtModeBtn = document.getElementById('debt-mode-btn');
            const savingModeBtn = document.getElementById('saving-mode-btn');
            
            if (debtModeBtn) {
                debtModeBtn.addEventListener('click', () => {
                    this.switchMode('debt');
                });
            }
            
            if (savingModeBtn) {
                savingModeBtn.addEventListener('click', () => {
                    this.switchMode('saving');
                });
            }
            
            // 设置表单提交
            const setupForm = document.getElementById('setup-form');
            if (setupForm) {
                setupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleSaveSettings();
                });
            }
            
            // 记录按钮
            const recordButtons = [
                { id: 'record-today-income', handler: () => this.handleRecordTodayIncome() },
                { id: 'record-extra-income', handler: () => this.handleRecordExtraIncome() },
                { id: 'record-extra-expense', handler: () => this.handleRecordExtraExpense() }
            ];
            
            recordButtons.forEach(button => {
                const element = document.getElementById(button.id);
                if (element) {
                    element.addEventListener('click', button.handler);
                }
            });
            
            // 历史记录筛选
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const period = e.target.getAttribute('data-period');
                    if (period) {
                        this.switchViewType(period);
                    }
                });
            });
            
            // 清除数据
            const clearDataBtn = document.getElementById('clear-data-btn');
            if (clearDataBtn) {
                clearDataBtn.addEventListener('click', () => {
                    const messages = getConstants().MESSAGES || {};
                    this.showConfirmModal(messages.CONFIRM_CLEAR || '确定要清除所有数据吗？', () => {
                        this.handleClearData();
                    });
                });
            }
            
            console.log('事件监听器绑定完成');
        },
        
        // 切换模式
        switchMode(mode) {
            const modes = getConstants().APP_MODES || {};
            const validMode = mode === modes.SAVING ? modes.SAVING : modes.DEBT;
            
            this.currentState.mode = validMode;
            
            // 更新按钮状态
            const debtBtn = document.getElementById('debt-mode-btn');
            const savingBtn = document.getElementById('saving-mode-btn');
            
            if (debtBtn) debtBtn.classList.toggle('active', validMode === modes.DEBT);
            if (savingBtn) savingBtn.classList.toggle('active', validMode === modes.SAVING);
            
            // 更新标题
            if (validMode === modes.DEBT) {
                if (this.elements.appTitle) this.elements.appTitle.textContent = '个人债务清偿追踪工具';
                if (this.elements.appSubtitle) this.elements.appSubtitle.textContent = '记录每日收入，动态追踪偿清债务进度';
                if (this.elements.progressLabel) this.elements.progressLabel.innerHTML = `已偿还: <span id="progress-amount">¥0</span> / <span id="total-amount">¥0</span>`;
            } else {
                if (this.elements.appTitle) this.elements.appTitle.textContent = '个人储蓄目标追踪工具';
                if (this.elements.appSubtitle) this.elements.appSubtitle.textContent = '记录每日收入，动态追踪达成储蓄目标进度';
                if (this.elements.progressLabel) this.elements.progressLabel.innerHTML = `已储蓄: <span id="progress-amount">¥0</span> / <span id="total-amount">¥0</span>`;
            }
            
            // 更新视图
            this.updateView();
            
            // 保存模式
            if (window.DataManager) {
                window.DataManager.saveMode(validMode);
            }
        },
        
        // 切换视图类型
        switchViewType(viewType) {
            const viewTypes = getConstants().VIEW_TYPES || {};
            const validViewType = [viewTypes.DAY, viewTypes.WEEK, viewTypes.MONTH].includes(viewType) 
                ? viewType 
                : viewTypes.DAY;
            
            this.currentState.viewType = validViewType;
            
            // 更新按钮状态
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-period') === validViewType) {
                    btn.classList.add('active');
                }
            });
            
            // 更新历史记录视图
            this.updateHistoryView();
        },
        
        // 更新整个视图
        updateView() {
            this.updateSetupForm();
            this.updateProgressView();
            this.updateHistoryView();
        },
        
        // 更新设置表单
        updateSetupForm() {
            const hasSettings = this.currentState.settings !== null;
            
            // 显示/隐藏警告
            if (this.elements.setupAlert) {
                this.elements.setupAlert.style.display = hasSettings ? 'none' : 'block';
            }
            
            if (this.elements.recordAlert) {
                this.elements.recordAlert.style.display = hasSettings ? 'none' : 'block';
            }
            
            // 填充表单数据
            if (hasSettings && this.currentState.settings) {
                const { totalAmount, targetDate, monthlyExpense, dailyIncome } = this.currentState.settings;
                
                const totalAmountInput = document.getElementById('total-amount-input');
                const targetDateInput = document.getElementById('target-date');
                const monthlyExpenseInput = document.getElementById('monthly-expense');
                const dailyIncomeInput = document.getElementById('daily-income');
                
                if (totalAmountInput) totalAmountInput.value = totalAmount;
                if (targetDateInput) targetDateInput.value = targetDate;
                if (monthlyExpenseInput) monthlyExpenseInput.value = monthlyExpense;
                if (dailyIncomeInput) dailyIncomeInput.value = dailyIncome;
            }
            
            // 更新今日收入输入框的placeholder
            if (this.elements.todayIncomeInput && window.DataManager) {
                const today = window.DataManager.getTodayDateString();
                this.elements.todayIncomeInput.placeholder = `今日收入 (${today})`;
            }
        },
        
        // 更新进度视图
        updateProgressView() {
            if (!this.currentState.settings || !window.Calculator) {
                // 没有设置，显示默认值
                if (this.elements.progressAmount) this.elements.progressAmount.textContent = '¥0.00';
                if (this.elements.totalAmount) this.elements.totalAmount.textContent = '¥0.00';
                if (this.elements.progressPercent) this.elements.progressPercent.textContent = '0%';
                if (this.elements.progressBar) {
                    this.elements.progressBar.style.width = '0%';
                    this.elements.progressBar.textContent = '0%';
                }
                
                // 清空统计数据
                if (this.elements.statsGrid) {
                    this.elements.statsGrid.innerHTML = '';
                }
                return;
            }
            
            const { mode, settings, records } = this.currentState;
            
            // 计算各种数据
            const totalNetIncome = window.Calculator.calculateTotalNetIncome(records, settings);
            const avgBasicNetIncome = window.Calculator.calculateAverageBasicNetIncome(records, settings);
            const remainingAmount = window.Calculator.calculateRemainingAmount(settings.totalAmount, totalNetIncome, mode);
            const estimatedDate = window.Calculator.calculateEstimatedDate(remainingAmount, avgBasicNetIncome);
            const targetDate = new Date(settings.targetDate);
            const daysDifference = window.Calculator.calculateDaysDifference(estimatedDate, targetDate);
            const progressPercentage = window.Calculator.calculateProgressPercentage(settings.totalAmount, totalNetIncome, mode);
            
            // 更新进度条
            if (this.elements.progressAmount) {
                this.elements.progressAmount.textContent = window.Calculator.formatCurrency(totalNetIncome);
            }
            
            if (this.elements.totalAmount) {
                this.elements.totalAmount.textContent = window.Calculator.formatCurrency(settings.totalAmount);
            }
            
            if (this.elements.progressPercent) {
                this.elements.progressPercent.textContent = `${progressPercentage.toFixed(1)}%`;
            }
            
            if (this.elements.progressBar) {
                this.elements.progressBar.style.width = `${progressPercentage}%`;
                this.elements.progressBar.textContent = `${progressPercentage.toFixed(1)}%`;
            }
            
            // 更新统计数据网格
            this.updateStatsGrid({
                remainingAmount,
                estimatedDate,
                daysDifference,
                avgBasicNetIncome,
                totalNetIncome,
                mode
            });
        },
        
        // 更新统计数据网格
        updateStatsGrid(data) {
            if (!this.elements.statsGrid) return;
            
            const { remainingAmount, estimatedDate, daysDifference, avgBasicNetIncome, mode } = data;
            
            const modes = getConstants().APP_MODES || {};
            const modeText = mode === modes.SAVING ? '目标' : '债务';
            const daysDiffText = daysDifference === 0 ? '准时' : 
                                daysDifference < 0 ? `提前 ${Math.abs(daysDifference)} 天` : 
                                `延后 ${daysDifference} 天`;
            
            const daysDiffClass = daysDifference < 0 ? 'positive' : 
                                 daysDifference > 0 ? 'negative' : '';
            
            this.elements.statsGrid.innerHTML = `
                <div class="stat-box">
                    <div class="stat-label">剩余${modeText}</div>
                    <div id="remaining-amount" class="stat-value">${window.Calculator.formatCurrency(remainingAmount)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">预计完成日期</div>
                    <div id="estimated-date" class="stat-value">${window.Calculator.formatDate(estimatedDate)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">提前/延后天数</div>
                    <div id="days-difference" class="stat-value ${daysDiffClass}">${daysDiffText}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">7日平均净收入</div>
                    <div id="avg-net-income" class="stat-value">${window.Calculator.formatCurrency(avgBasicNetIncome)}</div>
                </div>
            `;
        },
        
        // 更新历史记录视图
        updateHistoryView() {
            const { records, viewType } = this.currentState;
            
            if (!this.elements.historyList || !window.Calculator) return;
            
            if (!records || Object.keys(records).length === 0) {
                this.elements.historyList.innerHTML = `
                    <div class="history-item empty-history">
                        <div class="history-description" style="text-align: center; width: 100%;">
                            暂无记录，请开始记录您的财务数据
                        </div>
                    </div>
                `;
                return;
            }
            
            if (viewType === 'day') {
                this.renderDayView(records);
            } else if (viewType === 'week') {
                this.renderWeekView(records);
            } else if (viewType === 'month') {
                this.renderMonthView(records);
            } else {
                this.renderDayView(records);
            }
        },
        
        // 渲染日视图
        renderDayView(records) {
            if (!this.elements.historyList || !window.DataManager || !window.Calculator) return;
            
            const sortedDates = window.DataManager.getSortedRecordDates();
            
            let html = '';
            sortedDates.forEach(dateStr => {
                const record = records[dateStr];
                const date = new Date(dateStr);
                const dateFormatted = date.toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                });
                
                // 日期标题
                html += `
                    <div class="history-date-header">
                        ${dateFormatted}
                    </div>
                `;
                
                // 每日收入
                if (record.dailyIncome) {
                    html += `
                        <div class="history-item income">
                            <div class="history-description">每日收入</div>
                            <div class="history-amount">+${window.Calculator.formatCurrency(record.dailyIncome)}</div>
                        </div>
                    `;
                }
                
                // 额外收入
                if (record.extraIncomes) {
                    record.extraIncomes.forEach(income => {
                        html += `
                            <div class="history-item income">
                                <div class="history-description">${income.description || '额外收入'}</div>
                                <div class="history-amount">+${window.Calculator.formatCurrency(income.amount)}</div>
                            </div>
                        `;
                    });
                }
                
                // 额外支出
                if (record.extraExpenses) {
                    record.extraExpenses.forEach(expense => {
                        html += `
                            <div class="history-item expense">
                                <div class="history-description">${expense.description || '额外支出'}</div>
                                <div class="history-amount">-${window.Calculator.formatCurrency(expense.amount)}</div>
                            </div>
                        `;
                    });
                }
            });
            
            this.elements.historyList.innerHTML = html || `
                <div class="history-item empty-history">
                    <div class="history-description" style="text-align: center; width: 100%;">
                        暂无记录，请开始记录您的财务数据
                    </div>
                </div>
            `;
        },
        
        // 渲染周视图
        renderWeekView(records) {
            if (!this.elements.historyList || !window.Calculator) return;
            
            // 按周分组逻辑
            const weeklyGroups = {};
            
            Object.keys(records).forEach(dateStr => {
                const date = new Date(dateStr);
                const weekStart = window.Calculator.getWeekStartDate(date);
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if (!weeklyGroups[weekKey]) {
                    weeklyGroups[weekKey] = {
                        startDate: new Date(weekStart),
                        dailyIncome: 0,
                        extraIncome: 0,
                        extraExpense: 0,
                        records: []
                    };
                }
                
                const record = records[dateStr];
                const weekGroup = weeklyGroups[weekKey];
                weekGroup.records.push({ date: dateStr, ...record });
                
                // 汇总数据
                if (record.dailyIncome) {
                    weekGroup.dailyIncome += record.dailyIncome;
                }
                
                if (record.extraIncomes) {
                    record.extraIncomes.forEach(income => {
                        weekGroup.extraIncome += income.amount;
                    });
                }
                
                if (record.extraExpenses) {
                    record.extraExpenses.forEach(expense => {
                        weekGroup.extraExpense += expense.amount;
                    });
                }
            });
            
            // 渲染周汇总
            let html = '';
            Object.keys(weeklyGroups).sort().reverse().forEach(weekKey => {
                const week = weeklyGroups[weekKey];
                const weekEnd = new Date(week.startDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                const weekRange = `${window.Calculator.formatDate(week.startDate)} - ${window.Calculator.formatDate(weekEnd)}`;
                const totalIncome = week.dailyIncome + week.extraIncome;
                const netIncome = totalIncome - week.extraExpense;
                
                html += `
                    <div class="history-date-header">
                        周: ${weekRange}
                    </div>
                    <div class="history-item income">
                        <div class="history-description">每日收入总计</div>
                        <div class="history-amount">+${window.Calculator.formatCurrency(week.dailyIncome)}</div>
                    </div>
                    <div class="history-item income">
                        <div class="history-description">额外收入总计</div>
                        <div class="history-amount">+${window.Calculator.formatCurrency(week.extraIncome)}</div>
                    </div>
                    <div class="history-item expense">
                        <div class="history-description">额外支出总计</div>
                        <div class="history-amount">-${window.Calculator.formatCurrency(week.extraExpense)}</div>
                    </div>
                    <div class="history-item ${netIncome >= 0 ? 'income' : 'expense'}">
                        <div class="history-description">周净收入</div>
                        <div class="history-amount">${netIncome >= 0 ? '+' : ''}${window.Calculator.formatCurrency(netIncome)}</div>
                    </div>
                `;
            });
            
            this.elements.historyList.innerHTML = html || `
                <div class="history-item empty-history">
                    <div class="history-description" style="text-align: center; width: 100%;">
                        暂无记录，请开始记录您的财务数据
                    </div>
                </div>
            `;
        },
        
        // 渲染月视图
        renderMonthView(records) {
            if (!this.elements.historyList || !window.Calculator) return;
            
            // 按月分组逻辑
            const monthlyGroups = {};
            
            Object.keys(records).forEach(dateStr => {
                const date = new Date(dateStr);
                const monthKey = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
                
                if (!monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey] = {
                        dailyIncome: 0,
                        extraIncome: 0,
                        extraExpense: 0
                    };
                }
                
                const record = records[dateStr];
                const monthGroup = monthlyGroups[monthKey];
                
                // 汇总数据
                if (record.dailyIncome) {
                    monthGroup.dailyIncome += record.dailyIncome;
                }
                
                if (record.extraIncomes) {
                    record.extraIncomes.forEach(income => {
                        monthGroup.extraIncome += income.amount;
                    });
                }
                
                if (record.extraExpenses) {
                    record.extraExpenses.forEach(expense => {
                        monthGroup.extraExpense += expense.amount;
                    });
                }
            });
            
            // 渲染月汇总
            let html = '';
            Object.keys(monthlyGroups).sort().reverse().forEach(monthKey => {
                const month = monthlyGroups[monthKey];
                const totalIncome = month.dailyIncome + month.extraIncome;
                const netIncome = totalIncome - month.extraExpense;
                
                html += `
                    <div class="history-date-header">
                        ${monthKey}
                    </div>
                    <div class="history-item income">
                        <div class="history-description">每日收入总计</div>
                        <div class="history-amount">+${window.Calculator.formatCurrency(month.dailyIncome)}</div>
                    </div>
                    <div class="history-item income">
                        <div class="history-description">额外收入总计</div>
                        <div class="history-amount">+${window.Calculator.formatCurrency(month.extraIncome)}</div>
                    </div>
                    <div class="history-item expense">
                        <div class="history-description">额外支出总计</div>
                        <div class="history-amount">-${window.Calculator.formatCurrency(month.extraExpense)}</div>
                    </div>
                    <div class="history-item ${netIncome >= 0 ? 'income' : 'expense'}">
                        <div class="history-description">月净收入</div>
                        <div class="history-amount">${netIncome >= 0 ? '+' : ''}${window.Calculator.formatCurrency(netIncome)}</div>
                    </div>
                `;
            });
            
            this.elements.historyList.innerHTML = html || `
                <div class="history-item empty-history">
                    <div class="history-description" style="text-align: center; width: 100%;">
                        暂无记录，请开始记录您的财务数据
                    </div>
                </div>
            `;
        },
        
        // 处理保存设置
        handleSaveSettings() {
            try {
                const totalAmountInput = document.getElementById('total-amount-input');
                const targetDateInput = document.getElementById('target-date');
                const monthlyExpenseInput = document.getElementById('monthly-expense');
                const dailyIncomeInput = document.getElementById('daily-income');
                
                if (!totalAmountInput || !targetDateInput || !monthlyExpenseInput || !dailyIncomeInput) {
                    throw new Error('表单元素未找到');
                }
                
                const totalAmount = parseFloat(totalAmountInput.value);
                const targetDate = targetDateInput.value;
                const monthlyExpense = parseFloat(monthlyExpenseInput.value);
                const dailyIncome = parseFloat(dailyIncomeInput.value);
                
                // 验证输入
                if (!totalAmount || totalAmount <= 0) {
                    throw new Error('请输入有效的总金额');
                }
                
                // 验证日期格式和有效性
                if (!targetDate || !this.isValidDate(targetDate)) {
                    throw new Error('请输入有效的日期，格式：YYYY-MM-DD');
                }
                
                // 确保日期是未来的
                const inputDate = new Date(targetDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (inputDate < today) {
                    throw new Error('目标日期不能是过去日期');
                }
                
                if (!monthlyExpense || monthlyExpense < 0) {
                    throw new Error('请输入有效的每月支出');
                }
                
                if (!dailyIncome || dailyIncome <= 0) {
                    throw new Error('请输入有效的每日收入');
                }
                
                // 保存设置
                const settings = { totalAmount, targetDate, monthlyExpense, dailyIncome };
                
                if (window.DataManager) {
                    window.DataManager.saveSettings(settings);
                } else {
                    throw new Error('数据管理模块未加载');
                }
                
                // 更新状态
                this.currentState.settings = settings;
                
                // 显示成功消息
                const messages = getConstants().MESSAGES || {};
                this.showMessage(messages.SETUP_SAVED || '设置已保存！', 'success');
                
                // 更新视图
                this.updateView();
                
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        },
        
        // 检查日期是否有效
        isValidDate(dateString) {
            if (!dateString) return false;
            
            // 简单的日期验证
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateString)) return false;
            
            const parts = dateString.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            
            // 基本范围检查
            if (year < 1000 || year > 3000 || month < 1 || month > 12) {
                return false;
            }
            
            // 天数检查
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                return false;
            }
            
            return true;
        },
        
        // 处理记录今日收入
        handleRecordTodayIncome() {
            if (!this.currentState.settings) {
                const messages = getConstants().MESSAGES || {};
                this.showMessage(messages.SETUP_REQUIRED || '请先完成初始设置', 'error');
                return;
            }
            
            const amount = parseFloat(this.elements.todayIncomeInput.value);
            
            if (!amount || amount <= 0) {
                this.showMessage('请输入有效的收入金额', 'error');
                return;
            }
            
            // 检查今天是否已经有记录
            if (window.DataManager && window.DataManager.hasDailyIncomeToday()) {
                const todayIncome = window.DataManager.getTodayDailyIncome();
                const messages = getConstants().MESSAGES || {};
                this.showConfirmModal(
                    `${messages.OVERWRITE_RECORD || '今天已经有一条收入记录，是否要覆盖它？'} (现有记录: ¥${todayIncome.toFixed(2)})`,
                    () => {
                        this.saveDailyIncome(amount);
                    }
                );
            } else {
                this.saveDailyIncome(amount);
            }
        },
        
        // 保存每日收入
        saveDailyIncome(amount) {
            try {
                if (!window.DataManager) {
                    throw new Error('数据管理模块未加载');
                }
                
                window.DataManager.addDailyIncome(amount);
                
                // 更新状态
                this.currentState.records = window.DataManager.getRecords();
                
                // 清空输入框
                if (this.elements.todayIncomeInput) {
                    this.elements.todayIncomeInput.value = '';
                }
                
                // 显示成功消息
                this.showMessage('今日收入记录已保存', 'success');
                
                // 更新视图
                this.updateView();
                
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        },
        
        // 处理记录额外收入
        handleRecordExtraIncome() {
            if (!this.currentState.settings) {
                const messages = getConstants().MESSAGES || {};
                this.showMessage(messages.SETUP_REQUIRED || '请先完成初始设置', 'error');
                return;
            }
            
            const amount = parseFloat(this.elements.extraIncomeAmount.value);
            const description = this.elements.extraIncomeDesc.value.trim();
            
            if (!amount || amount <= 0) {
                this.showMessage('请输入有效的收入金额', 'error');
                return;
            }
            
            if (!description) {
                this.showMessage('请输入收入描述', 'error');
                return;
            }
            
            try {
                if (!window.DataManager) {
                    throw new Error('数据管理模块未加载');
                }
                
                window.DataManager.addExtraIncome(amount, description);
                
                // 更新状态
                this.currentState.records = window.DataManager.getRecords();
                
                // 清空输入框
                if (this.elements.extraIncomeAmount) this.elements.extraIncomeAmount.value = '';
                if (this.elements.extraIncomeDesc) this.elements.extraIncomeDesc.value = '';
                
                // 显示成功消息
                this.showMessage('额外收入记录已保存', 'success');
                
                // 更新视图
                this.updateView();
                
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        },
        
        // 处理记录额外支出
        handleRecordExtraExpense() {
            if (!this.currentState.settings) {
                const messages = getConstants().MESSAGES || {};
                this.showMessage(messages.SETUP_REQUIRED || '请先完成初始设置', 'error');
                return;
            }
            
            const amount = parseFloat(this.elements.extraExpenseAmount.value);
            const description = this.elements.extraExpenseDesc.value.trim();
            
            if (!amount || amount <= 0) {
                this.showMessage('请输入有效的支出金额', 'error');
                return;
            }
            
            if (!description) {
                this.showMessage('请输入支出描述', 'error');
                return;
            }
            
            try {
                if (!window.DataManager) {
                    throw new Error('数据管理模块未加载');
                }
                
                window.DataManager.addExtraExpense(amount, description);
                
                // 更新状态
                this.currentState.records = window.DataManager.getRecords();
                
                // 清空输入框
                if (this.elements.extraExpenseAmount) this.elements.extraExpenseAmount.value = '';
                if (this.elements.extraExpenseDesc) this.elements.extraExpenseDesc.value = '';
                
                // 显示成功消息
                this.showMessage('额外支出记录已保存', 'success');
                
                // 更新视图
                this.updateView();
                
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        },
        
        // 处理清除数据
        handleClearData() {
            try {
                if (!window.DataManager) {
                    throw new Error('数据管理模块未加载');
                }
                
                window.DataManager.clearAllData();
                
                // 重置状态
                this.currentState = {
                    mode: 'debt',
                    viewType: 'day',
                    settings: null,
                    records: {}
                };
                
                // 显示成功消息
                const messages = getConstants().MESSAGES || {};
                this.showMessage(messages.DATA_CLEARED || '所有数据已清除', 'success');
                
                // 更新视图
                this.updateView();
                
            } catch (error) {
                this.showMessage('清除数据失败: ' + error.message, 'error');
            }
        },
        
        // 显示确认模态框
        showConfirmModal(message, confirmCallback) {
            const modalContainer = document.getElementById('modal-container');
            if (!modalContainer) return;
            
            const modalId = 'confirm-modal-' + Date.now();
            
            modalContainer.innerHTML = `
                <div id="${modalId}" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title"><i class="fas fa-exclamation-triangle"></i> 确认操作</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <p style="margin-bottom: 20px;">${message}</p>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn cancel-btn">取消</button>
                            <button class="btn btn-danger confirm-btn">确认</button>
                        </div>
                    </div>
                </div>
            `;
            
            const modal = document.getElementById(modalId);
            modal.style.display = 'flex';
            
            // 绑定事件
            const closeBtn = modal.querySelector('.close-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.remove();
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    modal.remove();
                });
            }
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    confirmCallback();
                    modal.remove();
                });
            }
            
            // 点击外部关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        },
        
        // 显示消息
        showMessage(message, type = 'info') {
            // 创建消息元素
            const messageEl = document.createElement('div');
            messageEl.className = `message message-${type}`;
            messageEl.textContent = message;
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
                color: white;
                border-radius: 5px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            
            // 添加到页面
            document.body.appendChild(messageEl);
            
            // 自动移除
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        },
        
        // 加载数据到UI
        loadData(data) {
            if (data) {
                this.currentState.mode = data.mode || 'debt';
                this.currentState.settings = data.settings || null;
                this.currentState.records = data.records || {};
                
                // 更新模式按钮状态
                this.switchMode(this.currentState.mode);
                
                // 更新视图
                this.updateView();
            }
        }
    };

    // 初始化并导出到全局
    window.UIManager = UIManager;
    console.log('UI管理器模块已加载');
})();