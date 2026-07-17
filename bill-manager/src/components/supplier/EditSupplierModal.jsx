import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';

export default function EditSupplierModal({ isOpen, onClose, supplier, onDeleted }) {
  const { updateSupplier, deleteSupplier, suppliers } = useStore();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && supplier) {
      setName(supplier.name || '');
      setNote(supplier.note || '');
      setError('');
      setShowConfirmDelete(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, supplier]);

  const validate = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return '请输入供货商名称';
    if (
      suppliers.some((s) => s.name === trimmed && s.id !== supplier.id)
    ) {
      return '该供货商名称已存在';
    }
    return '';
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const validationError = validate(trimmedName);
    if (validationError) {
      setError(validationError);
      return;
    }

    updateSupplier(supplier.id, {
      name: trimmedName,
      note: note.trim(),
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    
    deleteSupplier(supplier.id);
    onDeleted?.(supplier.id);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="管理供货商" maxWidth="sm">
      <div className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            供货商名称
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-300 focus:ring-red-500/40 focus:border-red-400'
                  : 'border-slate-300 focus:ring-teal-500/40 focus:border-teal-400'
              }`}
            />
            {error && (
              <p className="absolute -bottom-5 left-0 text-xs text-red-500">{error}</p>
            )}
          </div>
        </div>

        {/* Note Input */}
        <div className={error ? 'mt-6' : 'mt-4'}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            备注信息（联系电话/地址等）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="选填..."
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-colors resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-3">
          {showConfirmDelete ? (
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              确认删除?
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="删除此供货商"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            保存修改
          </button>
        </div>
      </div>
    </Modal>
  );
}
