import React, { useState, useEffect } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Toast from '../ui/Toast';
import { evaluateAmount, isAllowedAmountInput, isAmountExpression } from '../../utils/amount';
import { defaultDateForMonth } from '../../utils/date';
import { readStoreValue, writeStoreValue } from '../../utils/storage';

export default function BillEntryForm({ selectedSupplier }) {
  const { categories, addBill, selectedMonth, currentStoreId } = useStore();

  const [amount, setAmount] = useState('');
  // Start with the category used last time in this store: most bills from a
  // shop share one, so this saves a tap per bill.
  const [category, setCategoryState] = useState(() => {
    const last = readStoreValue(currentStoreId, 'last_category', '');
    return categories.includes(last) ? last : '';
  });
  const setCategory = (cat) => {
    setCategoryState(cat);
    writeStoreValue(currentStoreId, 'last_category', cat);
  };
  const [date, setDate] = useState(() => defaultDateForMonth(selectedMonth));
  const [note, setNote] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  // Follow the month picker, but only when the month actually changes, so a
  // date typed by hand is not overwritten on every render.
  useEffect(() => {
    setDate((d) => (d.startsWith(selectedMonth) ? d : defaultDateForMonth(selectedMonth)));
  }, [selectedMonth]);

  const parsedAmount = evaluateAmount(amount);
  const canSubmit = selectedSupplier && parsedAmount > 0 && category && date;

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Digits, "," or "." as decimal mark, and + / - for quick sums.
    if (isAllowedAmountInput(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const finalAmount = parsedAmount;
    if (Number.isNaN(finalAmount)) {
      showToast('金额计算错误，请检查输入格式', 'error');
      return;
    }
    const mathExpr = isAmountExpression(amount) ? amount.replace(/\s+/g, '') : '';

    let finalNote = note.trim();
    if (mathExpr) {
      finalNote = finalNote + (finalNote ? ' ' : '') + `(计算: ${mathExpr})`;
    }

    addBill({
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      amount: finalAmount,
      category,
      date,
      note: finalNote,
    });

    showToast(`已添加 €${finalAmount.toFixed(2)} 账单`);

    // Clear amount and note, keep supplier/date/category
    setAmount('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selected Supplier Indicator */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
        <Truck className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        {selectedSupplier ? (
          <span className="text-sm font-medium text-slate-700">
            {selectedSupplier.name}
          </span>
        ) : (
          <span className="text-sm text-slate-400">请先选择供货商</span>
        )}
      </div>

      {/* Amount Input */}
      <div>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={handleAmountChange}
          placeholder="输入金额，如 12,50 或 10+5"
          aria-label="金额"
          className="w-full text-3xl md:text-4xl text-center font-semibold text-slate-800 bg-slate-50 rounded-xl p-4 border-b-2 border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-300 placeholder:font-normal placeholder:text-xl transition-shadow"
        />
        {amount.trim() && Number.isNaN(parsedAmount) && (
          <p className="mt-1.5 text-center text-xs text-rose-500">格式不对，例如 12,50 或 10+5</p>
        )}
        {isAmountExpression(amount) && parsedAmount > 0 && (
          <p className="mt-1.5 text-center text-xs text-slate-500">= €{parsedAmount.toFixed(2)}</p>
        )}
      </div>

      {/* Category Buttons */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          分类
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg p-2.5 text-sm font-medium transition-all duration-100 cursor-pointer ${
                category === cat
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Note Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            日期
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
            备注
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注/账单号（选填）"
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-colors placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-3.5 font-semibold text-lg transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" />
        确认添加
      </button>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </form>
  );
}
