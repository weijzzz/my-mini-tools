import React, { useMemo } from 'react';
import { Wallet, FileText } from 'lucide-react';

export default function StatCards({ bills, dateLabel, isYear = false }) {
  const stats = useMemo(() => {
    const totalAmount = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const totalCount = bills.length;
    return { totalAmount, totalCount };
  }, [bills]);

  const monthLabel = useMemo(() => {
    if (dateLabel) return dateLabel;
    const d = bills[0]?.date;
    if (!d) return '';
    return `${d.slice(0, 4)}年${Number(d.slice(5, 7))}月`;
  }, [bills, dateLabel]);

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {/* Total Amount Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-teal-50 flex items-center justify-center">
            <Wallet size={20} className="text-teal-600" />
          </div>
          <span className="text-sm font-medium text-slate-500">{isYear ? '年度申报总额' : '本月申报总额'}</span>
        </div>
        <div className="text-xl sm:text-3xl md:text-4xl font-bold text-teal-600 tracking-tight tabular-nums break-all">
          €{stats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-slate-400 mt-2">{monthLabel || '当前月份'}</p>
      </div>

      {/* Total Count Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-500">单据总笔数</span>
        </div>
        <div className="text-xl sm:text-3xl md:text-4xl font-bold text-indigo-600 tracking-tight tabular-nums">
          {stats.totalCount}
        </div>
        <p className="text-xs text-slate-400 mt-2">笔</p>
      </div>
    </div>
  );
}
