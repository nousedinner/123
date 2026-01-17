/**
 * 应用主入口 - 简化版本
 */

// 使用立即执行函数避免全局污染
/**
 * 修正功能模块
 */

(function() {
    const CorrectionManager = {
        init() {
            console.log('修正功能模块初始化');
            this.createCorrectionUI();
            this.bindEvents();
            return this;
        },
        
        createCorrectionUI() {
            // 检查是否已经存在修正UI
            if (document.getElementById('correction-section')) {
                return;
            }
            
            // 创建修正UI
           
            
            // 添加到页面底部
            const appContainer = document.querySelector('.app-container') || document.body;
            const footer = appContainer.querySelector('footer');
            
            if (footer) {
                footer.insertAdjacentHTML('beforebegin', correctionHTML);
            } else {
                appContainer.insertAdjacentHTML('beforeend', correctionHTML);
            }
        },
        
        bindEvents() {
            // 开始修正按钮
            document.getElementById('start-correction-btn')?.addEventListener('click', () => {
                this.showCorrectionConfirm();
            });
            
            // 取消修正按钮
            document.getElementById('cancel-correction-btn')?.addEventListener('click', () => {
                this.cancelCorrection();
            });
            
            // 修正表单提交
            document.getElementById('correction-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCorrection();
            });
        },
        
        showCorrectionConfirm() {
            // 显示确认模态框
            this.showConfirm('确定要开始修正数据吗？历史记录不会被修改，但所有未来计算将基于新数据。', () => {
                this.showCorrectionForm();
            });
        },
        
        showCorrectionForm() {
            // 获取当前设置
            const settings = window.DataManager?.getSettings();
            
            if (!settings) {
                this.showMessage('请先完成初始设置', 'error');
                return;
            }
            
            // 填充当前值
            const totalInput = document.getElementById('correction-total-amount');
            const expenseInput = document.getElementById('correction-monthly-expense');
            const incomeInput = document.getElementById('correction-daily-income');
            
            if (totalInput) totalInput.value = settings.totalAmount || '';
            if (expenseInput) expenseInput.value = settings.monthlyExpense || '';
            if (incomeInput) incomeInput.value = settings.dailyIncome || '';
            
            // 显示表单
            document.getElementById('correction-init-section').style.display = 'none';
            document.getElementById('correction-form-section').style.display = 'block';
        },
        
        cancelCorrection() {
            document.getElementById('correction-init-section').style.display = 'block';
            document.getElementById('correction-form-section').style.display = 'none';
        },
        
        submitCorrection() {
            try {
                const totalInput = document.getElementById('correction-total-amount');
                const expenseInput = document.getElementById('correction-monthly-expense');
                const incomeInput = document.getElementById('correction-daily-income');
                
                if (!totalInput || !expenseInput || !incomeInput) {
                    throw new Error('表单元素未找到');
                }
                
                const newTotalAmount = parseFloat(totalInput.value);
                const newMonthlyExpense = parseFloat(expenseInput.value);
                const newDailyIncome = parseFloat(incomeInput.value);
                
                // 验证输入
                if (!newTotalAmount || newTotalAmount <= 0) {
                    throw new Error('请输入有效的总金额');
                }
                
                if (!newMonthlyExpense || newMonthlyExpense < 0) {
                    throw new Error('请输入有效的每月支出');
                }
                
                if (!newDailyIncome || newDailyIncome <= 0) {
                    throw new Error('请输入有效的每日收入');
                }
                
                // 获取当前设置并更新
                const currentSettings = window.DataManager.getSettings();
                if (!currentSettings) {
                    throw new Error('未找到当前设置');
                }
                
                const correctedSettings = {
                    ...currentSettings,
                    totalAmount: newTotalAmount,
                    monthlyExpense: newMonthlyExpense,
                    dailyIncome: newDailyIncome
                };
                
                // 保存设置
                window.DataManager.saveSettings(correctedSettings);
                
                // 重置表单
                this.cancelCorrection();
                
                // 显示成功消息
                this.showMessage('数据修正成功！设置已更新。', 'success');
                
                // 触发事件通知其他模块
                document.dispatchEvent(new CustomEvent('settingsUpdated'));
                
            } catch (error) {
                this.showMessage(`修正失败: ${error.message}`, 'error');
            }
        },
        
        showConfirm(message, onConfirm) {
            const modalId = 'correction-confirm-modal';
            
            // 创建模态框
            const modalHTML = `
                <div id="${modalId}" class="modal">
                    <div class="modal-content" style="max-width: 500px;">
                        <div class="modal-header">
                            <h3 class="modal-title"><i class="fas fa-exclamation-triangle"></i> 确认修正数据</h3>
                            <button class="close-btn">&times;</button>
                        </div>
                        <p style="margin-bottom: 20px;">${message}</p>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="btn cancel-btn">取消</button>
                            <button class="btn btn-primary confirm-btn">确认继续</button>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            const modalContainer = document.getElementById('modal-container') || document.body;
            modalContainer.insertAdjacentHTML('beforeend', modalHTML);
            
            const modal = document.getElementById(modalId);
            
            // 绑定事件
            const removeModal = () => modal.remove();
            
            modal.querySelector('.close-btn').addEventListener('click', removeModal);
            modal.querySelector('.cancel-btn').addEventListener('click', removeModal);
            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                onConfirm();
                removeModal();
            });
            
            // 点击外部关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    removeModal();
                }
            });
        },
        
        showMessage(message, type = 'info') {
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
            
            document.body.appendChild(messageEl);
            
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        }
    };
    
    window.CorrectionManager = CorrectionManager;
})();
(function() {
    // 应用主类
    class FinanceTrackerApp {
        constructor() {
            console.log('创建FinanceTrackerApp实例');
            
            // 状态
            this.state = {
                mode: 'debt',
                settings: null,
                records: {},
                isLoading: false
            };
            
            // 初始化
            this.init();
        }
        
        init() {
            console.log('初始化应用...');
            
            try {
                // 1. 检查依赖
                if (!this.checkDependencies()) {
                    throw new Error('应用依赖未完全加载');
                }
                
                // 2. 加载数据
                this.loadData();
                
                // 3. 初始化UI
                this.initUI();
                
                // 4. 更新视图
                this.updateView();
                
                console.log('应用初始化完成');
                
            } catch (error) {
                console.error('应用初始化失败:', error);
                this.showError(`初始化失败: ${error.message}`);
            }
        }
        initCorrection() {
    console.log('初始化修正功能...');
    
    if (window.CorrectionManager && typeof window.CorrectionManager.init === 'function') {
        window.CorrectionManager.init();
    } else {
        console.warn('修正功能模块未加载');
    }
    
    // 监听修正完成事件
    document.addEventListener('settingsCorrected', () => {
        console.log('设置已修正，重新加载数据');
        this.loadData();
        this.updateView();
    });
}
        
        // 检查依赖
        checkDependencies() {
            console.log('检查依赖...');
            
            const dependencies = {
                'APP_CONSTANTS': window.APP_CONSTANTS,
                'DataManager': window.DataManager,
                'Calculator': window.Calculator,
                'UIManager': window.UIManager
            };
            
            let missing = [];
            for (const [name, dep] of Object.entries(dependencies)) {
                if (!dep) {
                    missing.push(name);
                    console.error(`依赖缺失: ${name}`);
                } else {
                    console.log(`✓ ${name} 已加载`);
                }
            }
            
            return missing.length === 0;
        }
        
        // 加载数据
        loadData() {
            console.log('加载数据...');
            
            try {
                const data = window.DataManager.getAllData();
                this.state.mode = data.mode || 'debt';
                this.state.settings = data.settings;
                this.state.records = data.records || {};
                
                console.log('数据加载完成:', {
                    mode: this.state.mode,
                    hasSettings: !!this.state.settings,
                    recordCount: Object.keys(this.state.records).length
                });
                
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }
        
        // 初始化UI
        initUI() {
            console.log('初始化UI...');
            
            // 确保UIManager已初始化
            if (window.UIManager && typeof window.UIManager.init === 'function') {
                window.UIManager.init();
            } else {
                throw new Error('UIManager未正确初始化');
            }
        }
        
        // 更新视图
        updateView() {
            console.log('更新视图...');
            
            try {
                // 传递数据到UI
                window.UIManager.loadData({
                    mode: this.state.mode,
                    settings: this.state.settings,
                    records: this.state.records
                });
                
            } catch (error) {
                console.error('更新视图失败:', error);
            }
        }
        
        // 显示错误
        showError(message) {
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            } else {
                alert(message);
            }
        }
    }

    // 启动应用
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM加载完成，启动应用...');
        
        // 检查是否在浏览器环境中
        if (typeof window === 'undefined') {
            console.error('必须在浏览器环境中运行');
            return;
        }
        
        // 延迟启动，确保所有脚本加载完成
        setTimeout(() => {
            try {
                window.app = new FinanceTrackerApp();
                console.log('应用启动成功');
                
                // 隐藏加载提示
                const loading = document.getElementById('loading');
                if (loading) {
                    loading.style.display = 'none';
                }
                
            } catch (error) {
                console.error('应用启动失败:', error);
                
                // 显示错误信息
                const appContainer = document.querySelector('.app-container');
                if (appContainer) {
                    appContainer.innerHTML = `
                        <div style="padding: 40px; text-align: center;">
                            <h2 style="color: #d32f2f;">应用启动失败</h2>
                            <p>${error.message}</p>
                            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                                请检查控制台查看详细错误信息
                            </p>
                        </div>
                    `;
                }
            }
        }, 500);
    });
})();
// 在 app.js 的最底部添加
document.addEventListener('DOMContentLoaded', function() {
    // 原有代码...
    
    // 添加这行初始化修正功能
    if (window.CorrectionManager) {
        window.CorrectionManager.init();
    }
});