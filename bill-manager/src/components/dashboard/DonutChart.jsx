import React, { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { formatEuro } from '../../utils/amount';

const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];
const OTHER_COLOR = '#94a3b8';
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut + legend for "share of total" breakdowns.
 *
 * Only the largest slices get their own colour; the rest are folded into one
 * grey "其他" slice so two different suppliers never share a colour.
 */
export default function DonutChart({ title, bills, groupBy, emptyLabel = '暂无数据' }) {
  const { segments, total } = useMemo(() => {
    const map = new Map();
    let sum = 0;
    for (const bill of bills) {
      const key = groupBy(bill);
      const amount = Number(bill.amount) || 0;
      map.set(key, (map.get(key) || 0) + amount);
      sum += amount;
    }
    const sorted = [...map.entries()]
      .map(([name, value]) => ({ name, total: value }))
      .sort((a, b) => b.total - a.total);

    let slices = sorted;
    if (sorted.length > COLORS.length + 1) {
      const head = sorted.slice(0, COLORS.length);
      const rest = sorted.slice(COLORS.length);
      slices = [
        ...head,
        { name: `其他 (${rest.length})`, total: rest.reduce((a, b) => a + b.total, 0), other: true },
      ];
    }

    let offset = 0;
    const segs = sum > 0
      ? slices.map((slice, i) => {
          const pct = slice.total / sum;
          const dashLen = pct * CIRCUMFERENCE;
          const seg = {
            ...slice,
            pct,
            color: slice.other ? OTHER_COLOR : COLORS[i % COLORS.length],
            dasharray: `${dashLen} ${CIRCUMFERENCE - dashLen}`,
            dashoffset: -offset,
          };
          offset += dashLen;
          return seg;
        })
      : [];
    return { segments: segs, total: sum };
  }, [bills, groupBy]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={20} className="text-teal-600" />
        <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      </div>

      {segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <PieChart size={48} className="mb-3 opacity-30" />
          <p className="text-sm">{emptyLabel}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-5">
            <svg viewBox="0 0 200 200" className="w-full max-w-[200px]" role="img" aria-label={title}>
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="30" />
              {segments.map((seg) => (
                <circle
                  key={seg.name}
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="30"
                  strokeDasharray={seg.dasharray}
                  strokeDashoffset={seg.dashoffset}
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-700"
                />
              ))}
              <text x="100" y="94" textAnchor="middle" className="fill-slate-400" fontSize="11" fontWeight="500">
                总计
              </text>
              <text x="100" y="112" textAnchor="middle" className="fill-slate-700" fontSize="15" fontWeight="700">
                {formatEuro(total)}
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
            {segments.map((seg) => (
              <div key={seg.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-sm text-slate-600 truncate flex-1 min-w-0">{seg.name}</span>
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap tabular-nums">
                  {formatEuro(seg.total)}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap w-11 text-right tabular-nums">
                  {(seg.pct * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
