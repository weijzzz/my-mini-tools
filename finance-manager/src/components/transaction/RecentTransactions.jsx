import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Clock, Euro, Edit3, Trash2, ChevronDown } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal';

/**
 * Tappable list of transactions (tap a row to edit it).
 *
 * Without props it shows the latest entries on the entry page. The dashboard
 * passes the selected month/year's transactions, sorted by date.
 */
export default function RecentTransactions({
  transactions,
  title = '近期活动',
  limit = 5,
  sortByDate = false,
  hideWhenEmpty = true,
}) {
  const { allTransactions, deleteTransaction } = useStore();
  const [editingTxn, setEditingTxn] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const source = transactions ?? allTransactions;
  const sorted = useMemo(() => {
    // Entry page: newest entries first, whatever order storage or an
    // imported backup has them in.
    if (!sortByDate) {
      return [...source].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }
    return [...source].sort(
      (a, b) =>
        (b.date || '').localeCompare(a.date || '') ||
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    );
  }, [source, sortByDate]);

  const visible = expanded || !limit ? sorted : sorted.slice(0, limit);
  const hiddenCount = sorted.length - visible.length;

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    if (confirm(`确定要删除 [${name}] 的这条记录吗？`)) {
      deleteTransaction(id);
    }
  };

  if (sorted.length === 0 && hideWhenEmpty) return null;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          {sortByDate && <span className="text-sm text-slate-400">{sorted.length} 笔</span>}
        </div>

        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">暂无记录</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((txn) => {
              const isIncome = txn.type === 'income';
              return (
                <div
                  key={txn.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingTxn(txn)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingTxn(txn)}
                  className="py-3 flex items-center justify-between group cursor-pointer active:bg-slate-50 hover:bg-slate-50 transition-colors -mx-4 px-4 sm:-mx-6 sm:px-6"
                  title="点击修改记录"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {txn.mainName}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                        {txn.subName}
                        <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                      <span className="shrink-0">{Number(txn.date.slice(5, 7))}月{Number(txn.date.slice(8, 10))}日</span>
                      {txn.note && <span className="truncate text-slate-400">· {txn.note}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <div className={`text-right font-bold flex items-center tabular-nums ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isIncome && '+'}
                      <Euro size={12} className="mr-0.5 opacity-50" />
                      {Number(txn.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, txn.id, txn.subName)}
                      className="p-2.5 -mr-2.5 text-slate-300 hover:text-red-500 active:text-red-500 transition-colors"
                      aria-label={`删除 ${txn.subName} 记录`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-2 w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-sky-600"
          >
            显示全部（还有 {hiddenCount} 笔）
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      <EditTransactionModal
        isOpen={!!editingTxn}
        onClose={() => setEditingTxn(null)}
        transaction={editingTxn}
      />
    </>
  );
}
