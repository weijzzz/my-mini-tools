import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';

export default function DailyTrendChart({ transactions, selectedMonth, type = 'expense' }) {
  const isIncome = type === 'income';
  const colorClass = isIncome ? 'text-emerald-600' : 'text-sky-600';
  const bgClass = isIncome ? 'bg-emerald-500' : 'bg-sky-500';
  const hoverClass = isIncome ? 'group-hover:bg-emerald-400' : 'group-hover:bg-sky-400';
  const title = isIncome ? '每日收入趋势' : '每日支出趋势';

  const { data, maxAmount, daysInMonth } = useMemo(() => {
    if (!selectedMonth) return { data: [], maxAmount: 0, daysInMonth: 0 };
    
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = Array(daysInMonth).fill(0);
    
    transactions.forEach(txn => {
      if (txn.type === type && txn.date && txn.date.startsWith(selectedMonth)) {
        const dayStr = txn.date.split('-')[2];
        if (dayStr) {
          const dayIndex = parseInt(dayStr, 10) - 1;
          if (dayIndex >= 0 && dayIndex < daysInMonth) {
            dailyData[dayIndex] += Number(txn.amount) || 0;
          }
        }
      }
    });
    
    const max = Math.max(...dailyData, 1);
    return { data: dailyData, maxAmount: max, daysInMonth };
  }, [transactions, selectedMonth, type]);

  const hasData = transactions.length > 0 && Math.max(...data) > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className={colorClass} />
          <h3 className="text-base font-semibold text-slate-700">{title} ({selectedMonth})</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Activity size={48} className="mb-3 opacity-30" />
          <p className="text-sm">当月暂无{isIncome ? '收入' : '支出'}记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className={colorClass} />
        <h3 className="text-base font-semibold text-slate-700">{title} ({selectedMonth})</h3>
      </div>

      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="h-48 flex items-end gap-1 sm:gap-1.5 min-w-[500px] px-1 pt-8">
          {data.map((amount, index) => {
            const heightPct = (amount / maxAmount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group h-full relative">
                
                <div className={`mb-1 text-[10px] font-semibold text-slate-500 transition-opacity whitespace-nowrap ${amount > 0 ? 'opacity-100' : 'opacity-0'} origin-bottom -rotate-45 -translate-y-2 translate-x-1.5`}>
                  {amount > 0 ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                </div>

                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-1.5 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                  {isIncome ? '+' : '-'}€{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <div className="w-full absolute inset-0 z-10" />

                <div className="w-full min-w-[8px] relative bg-slate-100 rounded-t-sm overflow-hidden flex-1 flex items-end mt-2">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-700 ${bgClass} ${hoverClass}`}
                    style={{ height: `${Math.max(heightPct, amount > 0 ? 2 : 0)}%` }}
                  />
                </div>
                
                <div className={`text-[10px] mt-2 font-medium shrink-0 h-3 ${
                  (index + 1 === 1 || (index + 1) % 5 === 0 || index + 1 === daysInMonth) 
                    ? 'text-slate-500' 
                    : 'text-transparent group-hover:text-slate-400'
                }`}>
                  {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

