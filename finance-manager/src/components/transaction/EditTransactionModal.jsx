import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
  const { updateTransaction } = useStore();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setDate(transaction.date || '');
      setNote(transaction.note || '');
    }
  }, [transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    updateTransaction(transaction.id, {
      amount: parseFloat(amount),
      date,
      note,
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`修改记录 (${transaction.subName})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            金额 (€) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-3 text-lg font-bold border border-slate-300 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${
              isIncome ? 'focus:ring-emerald-500 focus:border-emerald-500 text-emerald-600' : 'focus:ring-sky-500 focus:border-sky-500 text-sky-600'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            日期 *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${
              isIncome ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-sky-500 focus:border-sky-500'
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            备注 (可选)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${
              isIncome ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-sky-500 focus:border-sky-500'
            }`}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-3 px-4 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              isIncome 
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
                : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
            }`}
          >
            保存修改
          </button>
        </div>
      </form>
    </Modal>
  );
}
