import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';

const COLORS = [
  '#0d9488', '#6366f1', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#84cc16', '#ef4444',
];

export default function SubCategoryPieChart({ transactions }) {
  const { categories, total } = useMemo(() => {
    const map = {};
    let total = 0;
    transactions.forEach((txn) => {
      const cat = txn.subName || '未知子项目';
      const amount = Number(txn.amount) || 0;
      if (!map[cat]) map[cat] = { name: cat, total: 0, count: 0 };
      map[cat].total += amount;
      map[cat].count += 1;
      total += amount;
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    return { categories: sorted, total };
  }, [transactions]);

  const segments = useMemo(() => {
    if (!categories.length || total === 0) return [];
    const circumference = 2 * Math.PI * 80;
    let offset = 0;
    return categories.map((cat, i) => {
      const pct = cat.total / total;
      const dashLen = pct * circumference;
      const seg = {
        ...cat,
        pct,
        color: COLORS[i % COLORS.length],
        dasharray: `${dashLen} ${circumference - dashLen}`,
        dashoffset: -offset,
      };
      offset += dashLen;
      return seg;
    });
  }, [categories, total]);

  if (!transactions.length) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={20} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-slate-700">具体项目占比</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <PieChart size={48} className="mb-3 opacity-30" />
          <p className="text-sm">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={20} className="text-emerald-600" />
        <h3 className="text-base font-semibold text-slate-700">具体项目占比</h3>
      </div>

      <div className="flex justify-center mb-5">
        <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="30" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="100" cy="100" r="80" fill="none"
              stroke={seg.color} strokeWidth="30"
              strokeDasharray={seg.dasharray} strokeDashoffset={seg.dashoffset}
              strokeLinecap="butt" transform="rotate(-90 100 100)"
              className="transition-all duration-700"
            />
          ))}
          <text x="100" y="94" textAnchor="middle" className="fill-slate-400" fontSize="11" fontWeight="500">总计</text>
          <text x="100" y="112" textAnchor="middle" className="fill-slate-700" fontSize="15" fontWeight="700">
            €{total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-sm text-slate-600 truncate flex-1">{seg.name}</span>
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              €{seg.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 whitespace-nowrap">{(seg.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
