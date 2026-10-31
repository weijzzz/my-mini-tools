import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';
import Toast from '../ui/Toast';
import { evaluateAmount, isAllowedAmountInput, isAmountExpression } from '../../utils/amount';
import { defaultDateForMonth } from '../../utils/date';

export default function QuickEntryModal({ isOpen, onClose, supplier }) {
  const { categories, addBill, selectedMonth } = useStore();
  const [amount, setAmount] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (isAllowedAmountInput(val)) {
      setAmount(val);
    }
  };

  const parsedAmount = evaluateAmount(amount);
  const canSubmit = parsedAmount > 0;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) {
      if (amount.trim()) setToast({ message: '金额格式错误', type: 'error', isVisible: true });
      return;
    }

    const finalAmount = parsedAmount;
    const mathExpr = isAmountExpression(amount) ? amount.replace(/\s+/g, '') : '';
    const finalNote = mathExpr ? `(闪电录入: ${mathExpr})` : '(闪电录入)';

    addBill({
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount: finalAmount,
      category: categories[0] || '未分类',
      date: defaultDateForMonth(selectedMonth),
      note: finalNote,
    });

    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!supplier) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="⚡ 极速录入" maxWidth="sm">
        <div className="space-y-4">
          <div className="text-center mb-2">
            <span className="text-sm text-slate-500">供货商</span>
            <h3 className="text-lg font-bold text-slate-800">{supplier.name}</h3>
          </div>
          
          <div>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              placeholder="金额，如 12,5+8"
              aria-label="金额"
              className="w-full text-3xl text-center font-bold text-slate-800 bg-slate-50 rounded-xl p-3 border-b-2 border-amber-400 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-300 placeholder:font-normal"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 font-semibold text-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          >
            <Zap className="w-5 h-5" />
            快速记账
          </button>
        </div>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </>
  );
}
