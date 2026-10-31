import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';

export default function AddSubCategoryModal({ isOpen, onClose, onSubAdded }) {
  const { addSubCategory, currentMainCategoryId, mainCategories } = useStore();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const currentMainCat = mainCategories.find(c => c.id === currentMainCategoryId);
  const isIncome = currentMainCat?.type === 'income';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // The note used to be collected and then dropped; it is now saved.
    const newSub = addSubCategory(currentMainCategoryId, name.trim(), note.trim());

    if (onSubAdded) {
      onSubAdded(newSub);
    }
    setName('');
    setNote('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`新增 ${currentMainCat?.name || ''} 项目`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            项目名称 *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isIncome ? "如：工资、兼职..." : "如：肯德基、地铁..."}
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
            placeholder="如：固定月薪"
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
            保存项目
          </button>
        </div>
      </form>
    </Modal>
  );
}
