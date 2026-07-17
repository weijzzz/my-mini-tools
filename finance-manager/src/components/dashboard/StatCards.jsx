import React, { useMemo } from 'react';
import { Wallet, FileText } from 'lucide-react';

export default function StatCards({ bills, dateLabel }) {
  const stats = useMemo(() => {
    const totalAmount = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const totalCount = bills.length;
    return { totalAmount, totalCount };
  }, [bills]);

  const monthLabel = useMemo(() => {
    if (dateLabel) return dateLabel;
    if (!bills.length) return '';
    const date = new Date(bills[0]?.date || Date.now());
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }, [bills, dateLabel]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Amount Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Wallet size={20} className="text-sky-600" />
          </div>
          <span className="text-sm font-medium text-slate-500">本月申报总额</span>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-sky-600 tracking-tight">
          €{stats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-slate-400 mt-2">{monthLabel || '当前月份'}</p>
      </div>

      {/* Total Count Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <FileText size={20} className="text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-slate-500">单据总笔数</span>
        </div>
        <div className="text-3xl md:text-4xl font-bold text-indigo-600 tracking-tight">
          {stats.totalCount}
        </div>
        <p className="text-xs text-slate-400 mt-2">笔</p>
      </div>
    </div>
  );
}

