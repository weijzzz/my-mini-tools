import React, { useState, useEffect } from 'react';
import { Save, Ban, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function TransactionEntryForm({ selectedSubId, onClear }) {
  const { addTransaction, subCategories, mainCategories } = useStore();
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState('');

  const selectedSub = subCategories.find(s => s.id === selectedSubId);
  const selectedMain = mainCategories.find(m => m.id === selectedSub?.mainId);

  useEffect(() => {
    // Reset form when selection changes
    setAmount('');
    setNote('');
  }, [selectedSubId]);

  if (!selectedSub || !selectedMain) return null;

  const isIncome = selectedMain.type === 'income';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    addTransaction({
      mainId: selectedMain.id,
      subId: selectedSub.id,
      amount: parseFloat(amount),
      date,
      note,
    });
    
    // Trigger haptic feedback on success
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    onClear(); // Reset and close form
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden animate-slide-up sticky bottom-4 z-20">
      <div className={`${isIncome ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-sky-50 border-sky-100 text-sky-800'} px-4 py-3 border-b flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">{selectedSub.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-200 text-emerald-800' : 'bg-sky-200 text-sky-800'}`}>
            {selectedMain.name}
          </span>
        </div>
        <button
          onClick={onClear}
          className={`p-1.5 rounded-full transition-colors ${isIncome ? 'text-emerald-500 hover:bg-emerald-200' : 'text-sky-500 hover:bg-sky-200'}`}
        >
          <Ban size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              金额 (€)
            </label>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full text-2xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:outline-none transition-shadow ${isIncome ? 'text-emerald-600 focus:ring-emerald-500 focus:border-emerald-500' : 'text-sky-600 focus:ring-sky-500 focus:border-sky-500'}`}
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                日期
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${isIncome ? 'focus:ring-emerald-500' : 'focus:ring-sky-500'}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            备注 (可选)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${isIncome ? 'focus:ring-emerald-500' : 'focus:ring-sky-500'}`}
            placeholder="这笔钱花在哪了？"
          />
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] ${
            isIncome 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20' 
              : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow-sky-500/20'
          }`}
        >
          <Save size={20} />
          {isIncome ? '记录收入' : '记录支出'}
        </button>
      </form>
    </div>
  );
}
