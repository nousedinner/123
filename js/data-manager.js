/**
 * 数据管理模块 - 修正重复声明问题
 */

// 使用立即执行函数避免全局污染
(function() {
    // 从全局常量中获取值，不直接声明变量
    const getConstants = () => {
        return window.APP_CONSTANTS || {};
    };

    const DataManager = {
        // 初始化检查
        init() {
            const keys = getConstants().STORAGE_KEYS || {};
            const version = localStorage.getItem(keys.VERSION);
            if (!version && keys.VERSION) {
                this.clearAllData();
                localStorage.setItem(keys.VERSION, getConstants().APP_CONFIG?.VERSION || '1.0');
            }
            return this;
        },

        // 保存设置
        saveSettings(settings) {
            if (!settings || typeof settings !== 'object') {
                throw new Error('无效的设置数据');
            }
            
            // 验证必要字段
            const requiredFields = ['totalAmount', 'targetDate', 'monthlyExpense', 'dailyIncome'];
            for (const field of requiredFields) {
                if (settings[field] === undefined || settings[field] === null || settings[field] === '') {
                    throw new Error(`缺少必要字段: ${field}`);
                }
            }
            
            const keys = getConstants().STORAGE_KEYS || {};
            localStorage.setItem(keys.SETTINGS || 'finance_settings', JSON.stringify(settings));
            return true;
        },

        // 获取设置
        getSettings() {
            const keys = getConstants().STORAGE_KEYS || {};
            const settingsJson = localStorage.getItem(keys.SETTINGS || 'finance_settings');
            if (!settingsJson) return null;
            
            try {
                return JSON.parse(settingsJson);
            } catch (error) {
                console.error('解析设置数据失败:', error);
                return null;
            }
        },

        // 保存记录
        saveRecords(records) {
            if (!records || typeof records !== 'object') {
                throw new Error('无效的记录数据');
            }
            
            const keys = getConstants().STORAGE_KEYS || {};
            localStorage.setItem(keys.RECORDS || 'finance_records', JSON.stringify(records));
            return true;
        },

        // 获取记录
        getRecords() {
            const keys = getConstants().STORAGE_KEYS || {};
            const recordsJson = localStorage.getItem(keys.RECORDS || 'finance_records');
            if (!recordsJson) return {};
            
            try {
                return JSON.parse(recordsJson);
            } catch (error) {
                console.error('解析记录数据失败:', error);
                return {};
            }
        },

        // 保存模式
        saveMode(mode) {
            const modes = getConstants().APP_MODES || {};
            const config = getConstants().APP_CONFIG || {};
            
            if (mode !== modes.DEBT && mode !== modes.SAVING) {
                mode = config.DEFAULT_MODE || 'debt';
            }
            
            const keys = getConstants().STORAGE_KEYS || {};
            localStorage.setItem(keys.MODE || 'finance_mode', mode);
            return mode;
        },

        // 获取模式
        getMode() {
            const modes = getConstants().APP_MODES || {};
            const keys = getConstants().STORAGE_KEYS || {};
            const mode = localStorage.getItem(keys.MODE || 'finance_mode');
            return mode === modes.SAVING ? modes.SAVING : modes.DEBT;
        },

        // 获取所有数据
        getAllData() {
            return {
                settings: this.getSettings(),
                records: this.getRecords(),
                mode: this.getMode()
            };
        },

        // 清除所有数据
        clearAllData() {
            const keys = getConstants().STORAGE_KEYS || {};
            localStorage.removeItem(keys.SETTINGS);
            localStorage.removeItem(keys.RECORDS);
            localStorage.removeItem(keys.MODE);
            return true;
        },

        // 检查是否有设置数据
        hasSettings() {
            return this.getSettings() !== null;
        },

        // 获取今天的日期字符串（YYYY-MM-DD格式）
        /* getTodayDateString() {
            const now = new Date();
            return now.toISOString().split('T')[0];
        }, */
        getTodayDateString() {
            const now = new Date();
            // 使用本地时间方法，手动格式化为 YYYY-MM-DD
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月份补零
            const day = now.getDate().toString().padStart(2, '0'); // 日期补零
            return `${year}-${month}-${day}`;
        },

        // 添加每日收入记录
        addDailyIncome(amount, date = null) {
            if (!amount || amount <= 0) {
                throw new Error('无效的收入金额');
            }
            
            const dateStr = date || this.getTodayDateString();
            const records = this.getRecords();
            
            if (!records[dateStr]) {
                records[dateStr] = {};
            }
            
            records[dateStr].dailyIncome = amount;
            this.saveRecords(records);
            return records;
        },

        // 添加额外收入记录
        addExtraIncome(amount, description, date = null) {
            if (!amount || amount <= 0) {
                throw new Error('无效的收入金额');
            }
            
            if (!description || description.trim() === '') {
                throw new Error('请输入收入描述');
            }
            
            const dateStr = date || this.getTodayDateString();
            const records = this.getRecords();
            
            if (!records[dateStr]) {
                records[dateStr] = {};
            }
            
            if (!records[dateStr].extraIncomes) {
                records[dateStr].extraIncomes = [];
            }
            
           /*  records[dateStr].extraIncomes.push({
                amount,
                description: description.trim(),
                timestamp: new Date().toISOString()
            }); */
            records[dateStr].extraIncomes.push({
                amount,
                description: description.trim(),
                timestamp: new Date().getTime() // 改为时间戳数字
            });
            
            this.saveRecords(records);
            return records;
        },

        // 添加额外支出记录
        addExtraExpense(amount, description, date = null) {
            if (!amount || amount <= 0) {
                throw new Error('无效的支出金额');
            }
            
            if (!description || description.trim() === '') {
                throw new Error('请输入支出描述');
            }
            
            const dateStr = date || this.getTodayDateString();
            const records = this.getRecords();
            
            if (!records[dateStr]) {
                records[dateStr] = {};
            }
            
            if (!records[dateStr].extraExpenses) {
                records[dateStr].extraExpenses = [];
            }
            
           /*  records[dateStr].extraExpenses.push({
                amount,
                description: description.trim(),
                timestamp: new Date().toISOString()
            }); */
            records[dateStr].extraIncomes.push({
                amount,
                description: description.trim(),
                timestamp: new Date().getTime() // 改为时间戳数字
            });
            
            this.saveRecords(records);
            return records;
        },

        // 检查今天是否有每日收入记录
        hasDailyIncomeToday() {
            const today = this.getTodayDateString();
            const records = this.getRecords();
            return !!(records[today] && records[today].dailyIncome !== undefined);
        },

        // 获取今天的每日收入金额
        getTodayDailyIncome() {
            const today = this.getTodayDateString();
            const records = this.getRecords();
            return records[today] ? records[today].dailyIncome || 0 : 0;
        },

        // 获取最近的记录日期（倒序）
        getSortedRecordDates() {
            const records = this.getRecords();
            return Object.keys(records).sort((a, b) => new Date(b) - new Date(a));
        }
    };

    // 初始化并导出到全局
    DataManager.init();
    window.DataManager = DataManager;
    console.log('数据管理模块已加载');
})();