/**
 * 常量定义模块 - 避免变量冲突版本
 */

// 使用立即执行函数避免全局污染
(function() {
    // 存储键名
    const STORAGE_KEYS = {
        SETTINGS: 'finance_tracker_settings',
        RECORDS: 'finance_tracker_records',
        MODE: 'finance_tracker_mode',
        VERSION: 'finance_tracker_v1.0'
    };

    // 应用模式
    const APP_MODES = {
        DEBT: 'debt',
        SAVING: 'saving'
    };

    // 应用配置
    const APP_CONFIG = {
        DEFAULT_MODE: APP_MODES.DEBT,
        AVERAGE_DAYS: 7, // 计算平均净收入的天数
        CURRENCY: '¥',
        DATE_FORMAT: 'zh-CN'
    };

    // 记录类型
    const RECORD_TYPES = {
        DAILY_INCOME: 'dailyIncome',
        EXTRA_INCOME: 'extraIncome',
        EXTRA_EXPENSE: 'extraExpense'
    };

    // 视图类型
    const VIEW_TYPES = {
        DAY: 'day',
        WEEK: 'week',
        MONTH: 'month'
    };

    // 消息文本
    const MESSAGES = {
        CONFIRM_CLEAR: '确定要清除所有数据吗？此操作不可撤销，所有设置和记录都将被永久删除。',
        OVERWRITE_RECORD: '今天已经有一条收入记录，是否要覆盖它？',
        SETUP_REQUIRED: '请先完成初始设置以开始使用',
        SETUP_SAVED: '设置已保存！现在可以开始记录您的财务数据。',
        DATA_CLEARED: '所有数据已清除',
        RECORD_SAVED: '记录已保存'
    };

    // 错误消息
    const ERROR_MESSAGES = {
        INVALID_AMOUNT: '请输入有效的金额',
        INVALID_DATE: '请输入有效的日期',
        MISSING_DESCRIPTION: '请输入描述',
        SETUP_INCOMPLETE: '请先完成初始设置'
    };

    // 导出所有常量到全局对象
    window.APP_CONSTANTS = {
        STORAGE_KEYS,
        APP_MODES,
        APP_CONFIG,
        RECORD_TYPES,
        VIEW_TYPES,
        MESSAGES,
        ERROR_MESSAGES
    };
    
    console.log('常量模块已加载');
})();