import React, { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Toast from '../ui/Toast';

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDefaultDateForMonth(monthStr) {
  const currentMonthStr = getTodayString().substring(0, 7);
  if (monthStr === currentMonthStr) {
    return getTodayString();
  }
  return `${monthStr}-01`;
}

export default function BillEntryForm({ selectedSupplier }) {
  const { categories, addBill, selectedMonth } = useStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => getDefaultDateForMonth(selectedMonth));
  const [note, setNote] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  React.useEffect(() => {
    if (!date.startsWith(selectedMonth)) {
      setDate(getDefaultDateForMonth(selectedMonth));
    }
  }, [selectedMonth, date]);

  const canSubmit = selectedSupplier && amount && parseFloat(amount) > 0 && category;

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Allow digits, spaces, decimal point, plus, minus
    if (/^[0-9\s.\-+]*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    let finalAmount = 0;
    let mathExpr = '';
    const sanitized = amount.replace(/\s+/g, '');

    try {
      if (/[+\-]/.test(sanitized)) {
        // Safe evaluation since we only allowed digits, dots, plus, minus
        // eslint-disable-next-line no-new-func
        finalAmount = new Function(`return ${sanitized}`)();
        // Fix floating point precision issues for currency (e.g. 0.1 + 0.2 = 0.30000000000000004)
        finalAmount = Math.round(finalAmount * 100) / 100;
        mathExpr = sanitized;
      } else {
        finalAmount = parseFloat(sanitized);
      }
    } catch {
      finalAmount = parseFloat(amount);
    }

    if (isNaN(finalAmount)) {
      showToast('金额计算错误，请检查输入格式', 'error');
      return;
    }

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
          placeholder="输入金额"
          className="w-full text-3xl md:text-4xl text-center font-semibold text-slate-800 bg-slate-50 rounded-xl p-4 border-b-2 border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-300 placeholder:font-normal transition-shadow"
        />
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
