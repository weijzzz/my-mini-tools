import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import { formatEuro } from '../../utils/amount';
import { todayString } from '../../utils/date';

// The day a bill was typed in, in local time.
function enteredDay(bill) {
  return bill.createdAt ? todayString(new Date(bill.createdAt)) : '';
}

function shortDate(d) {
  return d ? `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日` : '';
}

/**
 * Move a day's bills to another date in one go.
 *
 * Pick the day either by bill date or by the day the bills were typed in
 * (for "I entered last week's invoices today and forgot to change the date"),
 * untick any that should stay, choose the new date, done.
 */
export default function BatchDateModal({ isOpen, onClose, initialDate, onMoved }) {
  const { allBills, moveBillsToDate } = useStore();
  const [mode, setMode] = useState('date'); // 'date' | 'entered'
  const [sourceDate, setSourceDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const dayOf = mode === 'date' ? (b) => b.date : enteredDay;

  // Most recent days that have bills, as one-tap choices.
  const recentDays = useMemo(() => {
    const map = new Map();
    for (const b of allBills) {
      const d = dayOf(b);
      if (d) map.set(d, (map.get(d) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBills, mode]);

  const matches = useMemo(
    () =>
      allBills
        .filter((b) => dayOf(b) === sourceDate)
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || ''))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBills, sourceDate, mode]
  );

  useEffect(() => {
    if (!isOpen) return;
    setMode('date');
    setSourceDate(initialDate || todayString());
    setTargetDate('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Everything on the chosen day starts ticked.
  useEffect(() => {
    setSelected(new Set(matches.map((b) => b.id)));
  }, [matches]);

  const chosen = matches.filter((b) => selected.has(b.id));
  const chosenTotal = chosen.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const allTicked = matches.length > 0 && chosen.length === matches.length;
  const canMove = chosen.length > 0 && targetDate && chosen.some((b) => b.date !== targetDate);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleMove = () => {
    if (!canMove) return;
    const moved = moveBillsToDate(
      chosen.map((b) => b.id),
      targetDate
    );
    onMoved?.(moved, targetDate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="批量改日期" maxWidth="lg">
      <div className="space-y-4">
        {/* 1. which day */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">① 选出哪一天的账单</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              {[
                ['date', '按账单日期'],
                ['entered', '按录入那天'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`px-2.5 py-1.5 rounded-md font-medium ${
                    mode === key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="date"
            value={sourceDate}
            onChange={(e) => setSourceDate(e.target.value)}
            aria-label="原日期"
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
          {recentDays.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1 -mx-1 px-1">
              {recentDays.map(([d, n]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSourceDate(d)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium border ${
                    d === sourceDate
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {shortDate(d)} · {n}笔
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. which bills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">② 勾选要移动的</span>
            {matches.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected(allTicked ? new Set() : new Set(matches.map((b) => b.id)))}
                className="text-xs font-medium text-teal-700 px-2 py-1"
              >
                {allTicked ? '全不选' : '全选'}
              </button>
            )}
          </div>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl">
              {shortDate(sourceDate) || '这一天'}没有账单
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {matches.map((b) => {
                const on = selected.has(b.id);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => toggle(b.id)}
                      aria-pressed={on}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-slate-50"
                    >
                      {on ? (
                        <CheckSquare className="w-5 h-5 text-teal-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-slate-800 truncate">{b.supplierName}</span>
                        <span className="block text-[11px] text-slate-400 truncate">
                          {mode === 'entered' ? `账单日期 ${b.date}` : b.category}
                          {b.note ? ` · ${b.note}` : ''}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatEuro(b.amount)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 3. new date */}
        <div>
          <span className="block text-sm font-semibold text-slate-700 mb-2">③ 改到哪一天</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            aria-label="新日期"
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          />
        </div>

        <button
          type="button"
          disabled={!canMove}
          onClick={handleMove}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-600 text-white font-semibold disabled:opacity-40 active:scale-[0.98] transition"
        >
          <CalendarClock className="w-5 h-5" />
          {chosen.length > 0 ? (
            <>
              移动 {chosen.length} 笔（{formatEuro(chosenTotal)}）
              {targetDate && (
                <>
                  <ArrowRight className="w-4 h-4" /> {shortDate(targetDate)}
                </>
              )}
            </>
          ) : (
            '先选要移动的账单'
          )}
        </button>
      </div>
    </Modal>
  );
}
