import React, { useEffect, useMemo, useRef } from 'react';
import { Activity } from 'lucide-react';

export default function DailyTrendChart({ bills, selectedMonth }) {
  const { data, maxAmount, daysInMonth } = useMemo(() => {
    if (!selectedMonth) return { data: [], maxAmount: 0, daysInMonth: 0 };
    
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    
    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = Array(daysInMonth).fill(0);
    
    bills.forEach(bill => {
      if (bill.date && bill.date.startsWith(selectedMonth)) {
        const dayStr = bill.date.split('-')[2];
        if (dayStr) {
          const dayIndex = parseInt(dayStr, 10) - 1;
          if (dayIndex >= 0 && dayIndex < daysInMonth) {
            dailyData[dayIndex] += Number(bill.amount) || 0;
          }
        }
      }
    });
    
    const max = Math.max(...dailyData, 1);
    return { data: dailyData, maxAmount: max, daysInMonth };
  }, [bills, selectedMonth]);

  const hasData = bills.length > 0 && Math.max(...data) > 0;
  const scrollRef = useRef(null);
  const lastDayWithData = data.reduce((last, amount, i) => (amount > 0 ? i : last), -1);

  // On a phone the chart is wider than the screen. Bring the most recent day
  // with spending into view instead of always showing the 1st of the month.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || lastDayWithData < 0 || el.scrollWidth <= el.clientWidth) return;
    const ratio = (lastDayWithData + 1) / Math.max(daysInMonth, 1);
    el.scrollLeft = Math.max(0, ratio * el.scrollWidth - el.clientWidth + 24);
  }, [lastDayWithData, daysInMonth, selectedMonth]);

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-teal-600" />
          <h3 className="text-base font-semibold text-slate-700">每日支出趋势 ({selectedMonth})</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Activity size={48} className="mb-3 opacity-30" />
          <p className="text-sm">当月暂无支出记录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-teal-600" />
        <h3 className="text-base font-semibold text-slate-700">每日支出趋势 ({selectedMonth})</h3>
      </div>

      {/* Horizontal scroll container for narrow screens */}
      <div ref={scrollRef} className="overflow-x-auto pb-4 overscroll-x-contain">
        <div className="h-48 flex items-end gap-1 sm:gap-1.5 min-w-[500px] px-1 pt-8">
          {data.map((amount, index) => {
            const heightPct = (amount / maxAmount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group h-full relative">
                
                {/* Permanent Value Label (Rotated for space) */}
                <div className={`mb-1 text-[10px] font-semibold text-slate-500 transition-opacity whitespace-nowrap ${amount > 0 ? 'opacity-100' : 'opacity-0'} origin-bottom -rotate-45 -translate-y-2 translate-x-1.5`}>
                  {amount > 0 ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-1.5 rounded whitespace-nowrap z-20 pointer-events-none shadow-md">
                  €{amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                
                {/* Helper invisible area to make hovering easier */}
                <div className="w-full absolute inset-0 z-10" />

                {/* Bar Container */}
                <div className="w-full min-w-[8px] relative bg-slate-100 rounded-t-sm overflow-hidden flex-1 flex items-end mt-2">
                  <div 
                    className="w-full bg-teal-500 rounded-t-sm transition-all duration-700 group-hover:bg-teal-400"
                    style={{ height: `${Math.max(heightPct, amount > 0 ? 2 : 0)}%` }}
                  />
                </div>
                
                {/* Label */}
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
