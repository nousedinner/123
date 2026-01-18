/**
 * 计算逻辑模块 - 修正重复声明问题
 * 平均净收入只计算每日收入和必要支出，不包括额外收支
 */

// 使用立即执行函数避免全局污染
(function() {
    // 获取常量的辅助函数
    const getConstants = () => {
        return window.APP_CONSTANTS || {};
    };

    const Calculator = {
        // 计算某个月份的天数
        getDaysInMonth(year, month) {
            return new Date(year, month + 1, 0).getDate();
        },

        // 计算每日分摊的必要支出
        calculateDailyExpense(monthlyExpense, date) {
            if (!monthlyExpense || monthlyExpense <= 0) {
                return 0;
            }
            
            const year = date.getFullYear();
            const month = date.getMonth();
            const daysInMonth = this.getDaysInMonth(year, month);
            
            return monthlyExpense / daysInMonth;
        },

        // 计算每日基础净收入（仅每日收入 - 必要支出，用于计算平均值）
        calculateDailyBasicNetIncome(dailyIncome, monthlyExpense, date) {
            const dailyExpense = this.calculateDailyExpense(monthlyExpense, date);
            return dailyIncome - dailyExpense;
        },

        // 计算每日总净收入（包括额外收支，用于累计）
        calculateDailyTotalNetIncome(dailyRecord, monthlyExpense, date) {
            let netIncome = 0;
            
            // 每日收入
            if (dailyRecord.dailyIncome) {
                netIncome += dailyRecord.dailyIncome;
            }
            
            // 额外收入
            if (dailyRecord.extraIncomes) {
                dailyRecord.extraIncomes.forEach(income => {
                    netIncome += income.amount;
                });
            }
            
            // 额外支出
            if (dailyRecord.extraExpenses) {
                dailyRecord.extraExpenses.forEach(expense => {
                    netIncome -= expense.amount;
                });
            }
            
            // 减去当日分摊的必要支出
            const dailyExpense = this.calculateDailyExpense(monthlyExpense, date);
            netIncome -= dailyExpense;
            
            return netIncome;
        },

        // 计算最近N天的平均基础净收入（修正：不包括额外收支）
        calculateAverageBasicNetIncome(records, settings, days) {
            if (!settings || !records) {
                return settings ? settings.dailyIncome - (settings.monthlyExpense / 30) : 0;
            }
            
            // 使用配置的默认天数或7天
            const config = getConstants().APP_CONFIG || {};
            const averageDays = days || config.AVERAGE_DAYS || 7;
            
            const today = new Date();
            const pastDate = new Date();
            pastDate.setDate(today.getDate() - averageDays + 1); // 包含今天
            
            let totalBasicNetIncome = 0;
            let daysWithRecords = 0;
            
            // 遍历最近N天
            for (let d = new Date(pastDate); d <= today; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                
                // 只计算有记录的天数
                if (records[dateStr] && records[dateStr].dailyIncome !== undefined) {
                    const dailyIncome = records[dateStr].dailyIncome;
                    
                    const dailyBasicNetIncome = this.calculateDailyBasicNetIncome(
                        dailyIncome, 
                        settings.monthlyExpense, 
                        d
                    );
                    
                    totalBasicNetIncome += dailyBasicNetIncome;
                    daysWithRecords++;
                }
            }
            
            // 如果有记录的天数大于0，使用实际天数计算平均值
            if (daysWithRecords > 0) {
                return totalBasicNetIncome / daysWithRecords;
            } else {
                // 如果没有任何记录，使用设置的每日收入和月支出计算理论值
                return settings.dailyIncome - (settings.monthlyExpense / 30);
            }
        },

        // 计算累计净收入（包括所有额外收支）
        calculateTotalNetIncome(records, settings) {
            if (!settings || !records) return 0;
            
            let total = 0;
            
            Object.keys(records).forEach(dateStr => {
                const date = new Date(dateStr);
                const dailyRecord = records[dateStr];
                
                const dailyNetIncome = this.calculateDailyTotalNetIncome(dailyRecord, settings.monthlyExpense, date);
                total += dailyNetIncome;
            });
            
            return total;
        },

        // 计算剩余金额
        calculateRemainingAmount(totalAmount, totalNetIncome, mode) {
            if (!totalAmount || totalAmount <= 0) return 0;
            
            const modes = getConstants().APP_MODES || {};
            const remaining = totalAmount - totalNetIncome;
            
            // 对于储蓄模式，如果已经超过目标，剩余金额为0
            if (mode === modes.SAVING && remaining < 0) {
                return 0;
            }
            
            // 确保不为负数
            return Math.max(remaining, 0);
        },

        // 计算预计完成日期
        calculateEstimatedDate(remainingAmount, avgBasicNetIncome) {
            if (!remainingAmount || remainingAmount <= 0) {
                return new Date(); // 如果已经完成，返回今天
            }
            
            if (!avgBasicNetIncome || avgBasicNetIncome <= 0) {
                return null; // 净收入为负或零，无法计算
            }
            
            const daysNeeded = Math.ceil(remainingAmount / avgBasicNetIncome);
            const estimatedDate = new Date();
            estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
            
            return estimatedDate;
        },

        // 计算与目标日期的差距（天）
        calculateDaysDifference(estimatedDate, targetDate) {
            if (!estimatedDate || !targetDate) return 0;
            
            // 转换为同一天的开始时间，避免时间部分影响
            const estDate = new Date(estimatedDate);
            estDate.setHours(0, 0, 0, 0);
            
            const tgtDate = new Date(targetDate);
            tgtDate.setHours(0, 0, 0, 0);
            
            const diffTime = estDate.getTime() - tgtDate.getTime();
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        },

        // 计算进度百分比
        calculateProgressPercentage(totalAmount, totalNetIncome, mode) {
            if (!totalAmount || totalAmount <= 0) return 0;
            
            const modes = getConstants().APP_MODES || {};
            let percentage = (totalNetIncome / totalAmount) * 100;
            
            // 对于储蓄模式，如果已经超过目标，进度为100%
            if (mode === modes.SAVING && totalNetIncome > totalAmount) {
                percentage = 100;
            }
            
            return Math.min(Math.max(percentage, 0), 100);
        },

        // 计算某天记录的总额外收入
        calculateDailyExtraIncome(dailyRecord) {
            if (!dailyRecord || !dailyRecord.extraIncomes) return 0;
            
            return dailyRecord.extraIncomes.reduce((sum, income) => sum + income.amount, 0);
        },

        // 计算某天记录的总额外支出
        calculateDailyExtraExpense(dailyRecord) {
            if (!dailyRecord || !dailyRecord.extraExpenses) return 0;
            
            return dailyRecord.extraExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        },

        // 获取一周的起始日期（周一）
        getWeekStartDate(date) {
            const d = new Date(date);
            const day = d.getDay(); // 0 = 周日, 1 = 周一, ...
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            return d;
        },

        // 获取月份起始日期
        getMonthStartDate(date) {
            const d = new Date(date);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        },

        // 格式化金额显示
        formatCurrency(amount) {
            if (amount === undefined || amount === null) {
                const config = getConstants().APP_CONFIG || {};
                return (config.CURRENCY || '¥') + '0.00';
            }
            
            const config = getConstants().APP_CONFIG || {};
            const currency = config.CURRENCY || '¥';
            
            return currency + amount.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        // 格式化日期显示
        formatDate(date) {
            if (!date) return '未设置';
            
            const config = getConstants().APP_CONFIG || {};
            const format = config.DATE_FORMAT || 'zh-CN';
            
            if (format === 'zh-CN') {
                return new Date(date).toLocaleDateString('zh-CN');
            }
            
            return new Date(date).toLocaleDateString();
        }
    };

    // 导出到全局
    window.Calculator = Calculator;
    console.log('计算模块已加载');
})();