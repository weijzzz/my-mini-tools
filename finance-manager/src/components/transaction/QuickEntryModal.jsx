import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';
import { Zap } from 'lucide-react';
import { evaluateAmount, isAllowedAmountInput, isAmountExpression } from '../../utils/amount';
import { todayString } from '../../utils/date';

export default function QuickEntryModal({ isOpen, onClose, subCategory, onAdded }) {
  const { addTransaction, mainCategories } = useStore();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
    }
  }, [isOpen]);

  if (!subCategory) return null;

  const mainCat = mainCategories.find(c => c.id === subCategory.mainId);
  const isIncome = mainCat?.type === 'income';

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = evaluateAmount(amount);
    if (!(value > 0)) return;
    const expr = isAmountExpression(amount) ? amount.replace(/\s+/g, '') : '';

    const txn = addTransaction({
      mainId: subCategory.mainId,
      subId: subCategory.id,
      amount: value,
      date: todayString(),
      note: expr ? `极速录入 (${expr})` : '极速录入',
    });
    
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 50, 30]);
    }
    onAdded?.(txn);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ 极速录入" maxWidth="sm">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">{subCategory.name}</h3>
        <p className="text-sm text-slate-500 mt-1">记录今日的一笔{isIncome ? '收入' : '支出'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <input
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            aria-label="金额"
            required
            autoFocus
            value={amount}
            onChange={(e) => isAllowedAmountInput(e.target.value) && setAmount(e.target.value)}
            className={`w-full text-4xl text-center font-black px-4 py-4 bg-slate-50 border-2 rounded-2xl focus:outline-none transition-all ${
              isIncome 
                ? 'text-emerald-600 border-emerald-100 focus:border-emerald-500 focus:bg-emerald-50'
                : 'text-sky-600 border-sky-100 focus:border-sky-500 focus:bg-sky-50'
            }`}
            placeholder="0,00"
          />
        </div>

        <button
          type="submit"
          disabled={!(evaluateAmount(amount) > 0)}
          className={`w-full flex disabled:opacity-40 items-center justify-center gap-2 py-4 text-white font-bold text-lg rounded-2xl transition-all shadow-lg active:scale-[0.98] ${
            isIncome 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30'
              : 'bg-gradient-to-br from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/30'
          }`}
        >
          <Zap size={22} fill="currentColor" />
          确认{isIncome ? '收入' : '记账'}
        </button>
      </form>
    </Modal>
  );
}
