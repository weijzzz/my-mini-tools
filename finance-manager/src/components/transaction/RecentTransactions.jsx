import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Clock, Euro, Edit3 } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal';

export default function RecentTransactions() {
  const { allTransactions, deleteTransaction } = useStore();
  const [editingTxn, setEditingTxn] = useState(null);

  // Get the 5 most recent transactions
  const recentTxns = allTransactions.slice(0, 5);

  const handleDelete = (e, id, name) => {
    e.stopPropagation();
    if (confirm(`确定要删除 [${name}] 的这条记录吗？`)) {
      deleteTransaction(id);
    }
  };

  if (recentTxns.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">近期活动</h2>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTxns.map((txn) => {
            const isIncome = txn.type === 'income';
            return (
              <div 
                key={txn.id} 
                onClick={() => setEditingTxn(txn)}
                className="py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors -mx-4 px-4 sm:-mx-6 sm:px-6"
                title="点击修改记录"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {txn.mainName}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                      {txn.subName}
                      <Edit3 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{txn.date.substring(5).replace('-', '月')}日</span>
                    {txn.note && <span className="truncate flex-1 text-slate-400">· {txn.note}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <div className={`text-right font-bold flex items-center ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isIncome && '+'}
                    <Euro size={12} className="mr-0.5 opacity-50" />
                    {Number(txn.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, txn.id, txn.subName)}
                    className="text-xs text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="删除此记录"
                  >
                    撤销
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditTransactionModal 
        isOpen={!!editingTxn} 
        onClose={() => setEditingTxn(null)} 
        transaction={editingTxn} 
      />
    </>
  );
}
