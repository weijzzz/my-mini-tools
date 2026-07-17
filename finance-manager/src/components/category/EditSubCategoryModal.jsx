import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useStore } from '../../context/StoreContext';
import { Trash2 } from 'lucide-react';

export default function EditSubCategoryModal({ isOpen, onClose, subCategory, onDeleted }) {
  const { updateSubCategory, deleteSubCategory, mainCategories } = useStore();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (subCategory) {
      setName(subCategory.name || '');
      setNote(subCategory.note || '');
    }
  }, [subCategory]);

  if (!subCategory) return null;

  const mainCat = mainCategories.find(c => c.id === subCategory.mainId);
  const isIncome = mainCat?.type === 'income';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateSubCategory(subCategory.id, {
      name: name.trim(),
      note: note.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`确定要删除 [${subCategory.name}] 吗？相关的历史账单不会被删除。`)) {
      deleteSubCategory(subCategory.id);
      if (onDeleted) onDeleted(subCategory.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑项目">
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
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-3 text-red-500 bg-red-50 hover:bg-red-100 font-medium rounded-xl focus:outline-none transition-colors border border-red-100"
          >
            <Trash2 size={20} />
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 px-4 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
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
