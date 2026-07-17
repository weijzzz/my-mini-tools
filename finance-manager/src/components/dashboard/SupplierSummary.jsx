import React, { useMemo } from 'react';
import { Users } from 'lucide-react';

const MAX_DISPLAY = 10;

export default function SupplierSummary({ bills }) {
  const suppliers = useMemo(() => {
    const map = {};
    bills.forEach((bill) => {
      const name = bill.supplierName || '未知供货商';
      const amount = Number(bill.amount) || 0;
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += amount;
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [bills]);

  const maxTotal = useMemo(() => {
    if (!suppliers.length) return 0;
    return suppliers[0].total;
  }, [suppliers]);

  const displaySuppliers = suppliers.slice(0, MAX_DISPLAY);
  const hasMore = suppliers.length > MAX_DISPLAY;

  if (!bills.length) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-sky-600" />
          <h3 className="text-base font-semibold text-slate-700">供货商排行</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Users size={48} className="mb-3 opacity-30" />
          <p className="text-sm">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-sky-600" />
        <h3 className="text-base font-semibold text-slate-700">供货商排行</h3>
      </div>

      <div className="space-y-3">
        {displaySuppliers.map((supplier, i) => {
          const widthPct = maxTotal > 0 ? (supplier.total / maxTotal) * 100 : 0;
          return (
            <div key={supplier.name} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {supplier.name}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0">
                    ({supplier.count}笔)
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap ml-2">
                  €{supplier.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="ml-7 h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-lg transition-all duration-500 ease-out"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}

        {hasMore && (
          <div className="text-center text-sm text-slate-400 pt-1">
            ⋯ 还有 {suppliers.length - MAX_DISPLAY} 个供货商
          </div>
        )}
      </div>
    </div>
  );
}

