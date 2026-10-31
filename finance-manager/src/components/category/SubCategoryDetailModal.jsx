import React, { useMemo, useState } from 'react';
import { FileText, CalendarDays, Euro, Edit3 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import EditTransactionModal from '../transaction/EditTransactionModal';

export default function SubCategoryDetailModal({ isOpen, onClose, subCategory }) {
  const { allTransactions, mainCategories, deleteTransaction } = useStore();
  const [editingTxn, setEditingTxn] = useState(null);

  const { groupedTransactions, totalAmount, isIncome } = useMemo(() => {
    if (!subCategory) return { groupedTransactions: [], totalAmount: 0, isIncome: false };

    const mainCat = mainCategories.find(c => c.id === subCategory.mainId);
    const isInc = mainCat?.type === 'income';
    const subTransactions = allTransactions.filter(t => t.subId === subCategory.id);
    
    // Sort descending by date
    subTransactions.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.id.localeCompare(a.id);
    });

    let total = 0;
    const groups = {};

    subTransactions.forEach(txn => {
      const monthStr = txn.date.substring(0, 7); // "2026-07"
      if (!groups[monthStr]) {
        groups[monthStr] = {
          month: monthStr,
          total: 0,
          transactions: []
        };
      }
      groups[monthStr].transactions.push(txn);
      groups[monthStr].total += Number(txn.amount);
      total += Number(txn.amount);
    });

    const groupedArray = Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));

    return { groupedTransactions: groupedArray, totalAmount: total, isIncome: isInc };
  }, [allTransactions, subCategory, mainCategories]);

  const handleDelete = (e, id, date) => {
    e.stopPropagation();
    if (confirm(`确定要删除 ${date} 的这条记录吗？`)) {
      deleteTransaction(id);
    }
  };

  if (!subCategory) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="明细对账单" maxWidth="md">
        <div className="flex flex-col h-[70vh] max-h-[600px]">
          {/* Header Info */}
          <div className={`${isIncome ? 'bg-emerald-50 border-emerald-200' : 'bg-sky-50 border-sky-200'} p-4 rounded-xl border mb-4 shrink-0`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{subCategory.name}</h3>
                {subCategory.note && (
                  <p className="text-sm text-slate-500 mt-1">{subCategory.note}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1">历史总计</span>
                <span className={`text-xl font-bold ${isIncome ? 'text-emerald-600' : 'text-sky-600'}`}>
                  {isIncome ? '+' : '-'}€{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {groupedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                <FileText size={48} className="mb-3 opacity-30" />
                <p>暂无记录</p>
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <div key={group.month} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                      <CalendarDays size={16} className="text-slate-400" />
                      {group.month.replace('-', '年')}月
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      小计: €{group.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.transactions.map((txn) => (
                      <div 
                        key={txn.id} 
                        onClick={() => setEditingTxn(txn)}
                        className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                        title="点击修改记录"
                      >
                        <div className="flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1.5">
                              {txn.date.substring(8, 10)}日
                              <Edit3 size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </div>
                          {txn.note && (
                            <span className="text-xs text-slate-500 truncate w-full">
                              {txn.note}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className={`text-right font-semibold flex items-center ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isIncome && '+'}
                            <Euro size={12} className="mr-0.5 opacity-50" />
                            {Number(txn.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          
                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, txn.id, txn.date)}
                            className="text-xs text-slate-400 hover:text-red-500 active:text-red-500 transition-colors px-2 py-2.5 -my-2"
                            title="删除此记录"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <EditTransactionModal 
        isOpen={!!editingTxn} 
        onClose={() => setEditingTxn(null)} 
        transaction={editingTxn} 
      />
    </>
  );
}
