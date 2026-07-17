import React, { useState, useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';
import Toast from '../ui/Toast';

export default function QuickEntryModal({ isOpen, onClose, supplier }) {
  const { categories, addBill, selectedMonth } = useStore();
  const [amount, setAmount] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (/^[0-9\s.\-+]*$/.test(val)) {
      setAmount(val);
    }
  };

  const getDefaultDateForMonth = (monthStr) => {
    const d = new Date();
    const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const today = `${currentMonthStr}-${String(d.getDate()).padStart(2, '0')}`;
    return monthStr === currentMonthStr ? today : `${monthStr}-01`;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) return;

    let finalAmount = 0;
    let mathExpr = '';
    const sanitized = amount.replace(/\s+/g, '');

    try {
      if (/[+\-]/.test(sanitized)) {
        // eslint-disable-next-line no-new-func
        finalAmount = new Function(`return ${sanitized}`)();
        finalAmount = Math.round(finalAmount * 100) / 100;
        mathExpr = sanitized;
      } else {
        finalAmount = parseFloat(sanitized);
      }
    } catch {
      finalAmount = parseFloat(amount);
    }

    if (isNaN(finalAmount)) {
      setToast({ message: '金额格式错误', type: 'error', isVisible: true });
      return;
    }

    const finalNote = mathExpr ? `(闪电录入: ${mathExpr})` : '(闪电录入)';

    addBill({
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount: finalAmount,
      category: categories[0] || '未分类',
      date: getDefaultDateForMonth(selectedMonth),
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
      <Modal isOpen={isOpen} onClose={onClose} title="⚡ 极速录入" maxWidth="xs">
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
              placeholder="输入金额 (如 12+5)"
              className="w-full text-3xl text-center font-bold text-slate-800 bg-slate-50 rounded-xl p-3 border-b-2 border-amber-400 focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-300 placeholder:font-normal"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
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
