import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';

export default function AddMainCategoryModal({ isOpen, onClose }) {
  const { addMainCategory, setCurrentMainCategoryId } = useStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Default icon is 'Tag' for custom categories
    const newCat = addMainCategory(name.trim(), type, 'Tag');
    setCurrentMainCategoryId(newCat.id);
    setName('');
    setType('expense');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增主分类标签">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            收支类型
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 px-4 rounded-xl border-2 font-medium transition-colors ${
                type === 'expense'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 px-4 rounded-xl border-2 font-medium transition-colors ${
                type === 'income'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              收入
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            分类名称 *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'expense' ? "如：教育、医疗、人情..." : "如：理财、奖金..."}
            className={`w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:outline-none transition-shadow ${
              type === 'income' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-sky-500 focus:border-sky-500'
            }`}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-3 px-4 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              type === 'income' 
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
                : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
            }`}
          >
            保存大类
          </button>
        </div>
      </form>
    </Modal>
  );
}
