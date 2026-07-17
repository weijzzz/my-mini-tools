import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

export default function MonthlyTrendChart({ transactions, type = 'expense', year }) {
  const isIncome = type === 'income';
  const colorClass = isIncome ? 'text-emerald-600' : 'text-sky-600';
  const bgClass = isIncome ? 'bg-emerald-500' : 'bg-sky-500';
  const hoverClass = isIncome ? 'group-hover:bg-emerald-400' : 'group-hover:bg-sky-400';
  const title = isIncome ? '年度收入趋势' : '年度支出趋势';

  const { data, maxAmount } = useMemo(() => {
    const monthlyData = Array(12).fill(0);
    const targetYear = year || new Date().getFullYear().toString();
    
    transactions.forEach(txn => {
      if (txn.type === type && txn.date && txn.date.startsWith(targetYear)) {
        const monthStr = txn.date.split('-')[1];
        if (monthStr) {
          const monthIndex = parseInt(monthStr, 10) - 1;
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyData[monthIndex] += Number(txn.amount) || 0;
          }
        }
      }
    });
    
    const max = Math.max(...monthlyData, 1);
    return { data: monthlyData, maxAmount: max };
  }, [transactions, type, year]);

  const hasData = transactions.length > 0 && Math.max(...data) > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className={colorClass} />
          <h3 className="text-base font-semibold text-slate-700">{title}</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <BarChart3 size={48} className="mb-3 opacity-30" />
          <p className="text-sm">今年暂无{isIncome ? '收入' : '支出'}记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className={colorClass} />
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      </div>

      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="h-56 flex items-end gap-1.5 sm:gap-2 lg:gap-3 mt-4 min-w-[360px] px-1 pt-8">
          {data.map((amount, index) => {
            const heightPct = (amount / maxAmount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group h-full relative">
                
                <div className={`mb-1 text-[10px] sm:text-xs font-semibold text-slate-600 transition-opacity whitespace-nowrap ${amount > 0 ? 'opacity-100' : 'opacity-0'} origin-bottom -rotate-45 -translate-y-2 translate-x-2`}>
                  {amount > 0 ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                </div>

                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                  {isIncome ? '+' : '-'}€{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                <div className="w-full absolute inset-0 z-10" />

                <div className="w-full relative bg-slate-100 rounded-t-md overflow-hidden flex-1 flex items-end mt-2">
                  <div 
                    className={`w-full rounded-t-md transition-all duration-700 ${bgClass} ${hoverClass}`}
                    style={{ height: `${Math.max(heightPct, amount > 0 ? 2 : 0)}%` }}
                  />
                </div>
                
                <div className="text-xs text-slate-500 mt-2 font-medium shrink-0 h-4">
                  {index + 1}月
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

