import React, { useMemo, useState } from 'react';
import { Download, Upload, Wallet, TrendingUp, TrendingDown, Calendar, CalendarDays } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import DailyTrendChart from '../components/dashboard/DailyTrendChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import CategoryChart from '../components/dashboard/CategoryChart';
import SubCategoryPieChart from '../components/dashboard/SubCategoryPieChart';
import RecentTransactions from '../components/transaction/RecentTransactions';
import { getAllStorageData, restoreAllStorageData } from '../utils/storage';
import { todayString } from '../utils/date';

export default function DashboardPage() {
  const { allTransactions, selectedMonth, setSelectedMonth } = useStore();
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'

  const selectedYear = selectedMonth.split('-')[0];

  const handleExport = () => {
    const data = getAllStorageData();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${todayString()}.json`;
    document.body.appendChild(a);
    a.click();
    // Revoking immediately can cancel the download on some Android browsers.
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      let data;
      try {
        data = JSON.parse(event.target.result);
      } catch {
        alert('文件格式错误：不是有效的 JSON 备份');
        return;
      }
      if (!confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) return;
      try {
        restoreAllStorageData(data);
        window.location.reload();
      } catch (err) {
        alert('导入失败：' + (err.message || '未知错误'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Derive stats for selected month OR year
  const availableYears = useMemo(() => {
    const years = new Set(allTransactions.map((t) => t.date?.slice(0, 4)).filter(Boolean));
    years.add(String(new Date().getFullYear()));
    years.add(selectedYear);
    return [...years].sort().reverse();
  }, [allTransactions, selectedYear]);

  const { totalIncome, totalExpense, totalNet, incomeTxns, expenseTxns } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const iTxns = [];
    const eTxns = [];

    const prefix = viewMode === 'month' ? selectedMonth : selectedYear;

    allTransactions.forEach(t => {
      if (t.date?.startsWith(prefix)) {
        if (t.type === 'income') {
          income += t.amount;
          iTxns.push(t);
        } else {
          expense += t.amount;
          eTxns.push(t);
        }
      }
    });

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      totalNet: income - expense,
      incomeTxns: iTxns,
      expenseTxns: eTxns
    };
  }, [allTransactions, selectedMonth, viewMode, selectedYear]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 space-y-6">
      {/* Top Bar: View Picker & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={16} /> 月度
            </button>
            <button
              type="button"
              onClick={() => setViewMode('year')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CalendarDays size={16} /> 年度
            </button>
          </div>
          
          {viewMode === 'month' ? (
            <input
              type="month"
              aria-label="选择月份"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          ) : (
            <select
              aria-label="选择年份"
              value={selectedYear}
              onChange={(e) => {
                const currentMonthStr = selectedMonth.split('-')[1];
                setSelectedMonth(`${e.target.value}-${currentMonthStr}`);
              }}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          )}
        </div>
        <div className="w-full sm:w-auto flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            <Download size={16} /> 导出
          </button>
          <label className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors cursor-pointer">
            <Upload size={16} /> 导入
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expense */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingDown size={64} />
          </div>
          <p className="text-slate-500 text-sm font-semibold mb-1 relative z-10">
            {viewMode === 'month' ? '本月' : '本年度'}总支出
          </p>
          <p className="text-3xl font-black text-sky-600 relative z-10">
            €{totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Income */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} />
          </div>
          <p className="text-slate-500 text-sm font-semibold mb-1 relative z-10">
            {viewMode === 'month' ? '本月' : '本年度'}总收入
          </p>
          <p className="text-3xl font-black text-emerald-600 relative z-10">
            €{totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Net */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={64} />
          </div>
          <p className="text-slate-500 text-sm font-semibold mb-1 relative z-10">
            {viewMode === 'month' ? '本月' : '本年度'}结余
          </p>
          <p className={`text-3xl font-black relative z-10 ${totalNet >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
            {totalNet > 0 ? '+' : ''}€{totalNet.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Expense Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {viewMode === 'month' ? (
          <DailyTrendChart transactions={allTransactions} selectedMonth={selectedMonth} type="expense" />
        ) : (
          <div className="col-span-1 lg:col-span-2">
            <MonthlyTrendChart transactions={allTransactions} type="expense" year={selectedYear} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart transactions={expenseTxns} />
        <SubCategoryPieChart transactions={expenseTxns} />
      </div>

      {/* Income Charts */}
      {incomeTxns.length > 0 && (
        <>
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">收入统计</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {viewMode === 'month' ? (
                <DailyTrendChart transactions={allTransactions} selectedMonth={selectedMonth} type="income" />
              ) : (
                <div className="col-span-1 lg:col-span-2">
                  <MonthlyTrendChart transactions={allTransactions} type="income" year={selectedYear} />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryChart transactions={incomeTxns} />
            <SubCategoryPieChart transactions={incomeTxns} />
          </div>
        </>
      )}

      {/* Every record of the selected period, tap to edit */}
      <RecentTransactions
        transactions={[...expenseTxns, ...incomeTxns]}
        title={viewMode === 'month' ? '本月明细' : '本年度明细'}
        limit={20}
        sortByDate
        hideWhenEmpty={false}
      />
    </div>
  );
}
