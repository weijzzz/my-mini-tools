import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import { getSuppliers } from '../../utils/storage';

export default function AddSupplierModal({ isOpen, onClose, onSupplierAdded }) {
  const { stores, currentStoreId, suppliers, addSupplier } = useStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [importStoreId, setImportStoreId] = useState('');
  const [importedSuppliers, setImportedSuppliers] = useState([]);
  
  const inputRef = useRef(null);

  const otherStores = useMemo(() => {
    return stores.filter((s) => s.id !== currentStoreId);
  }, [stores, currentStoreId]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setImportStoreId(otherStores.length > 0 ? otherStores[0].id : '');
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen, otherStores]);

  useEffect(() => {
    if (importStoreId) {
      const otherSuppliers = getSuppliers(importStoreId);
      // Filter out suppliers that already exist in the current store by name
      const currentNames = new Set(suppliers.map(s => s.name));
      setImportedSuppliers(otherSuppliers.filter(s => !currentNames.has(s.name)));
    } else {
      setImportedSuppliers([]);
    }
  }, [importStoreId, suppliers]);

  const validate = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return '请输入供货商名称';
    if (suppliers.some((s) => s.name === trimmed)) return '该供货商已存在';
    return '';
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newSupplier = addSupplier(trimmed);
    onSupplierAdded?.(newSupplier);
    onClose();
  };

  const handleImport = (supplierName) => {
    const newSupplier = addSupplier(supplierName);
    onSupplierAdded?.(newSupplier);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setName(e.target.value);
    if (error) setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增供货商" maxWidth="sm">
      <div className="space-y-6">
        {/* Manual Add Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            手动输入
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="例如：张三水果批发"
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
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-[0.98]"
            >
              添加
            </button>
          </div>
        </div>

        {/* Import Section */}
        {otherStores.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-slate-400" />
              从其他店面导入
            </label>
            <select
              value={importStoreId}
              onChange={(e) => setImportStoreId(e.target.value)}
              className="w-full mb-3 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-white"
            >
              <option value="" disabled>选择店面...</option>
              {otherStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            
            <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200 p-2">
              {importedSuppliers.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-3">该店面没有可导入的新供货商</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {importedSuppliers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleImport(s.name)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-colors cursor-pointer"
                      title="点击导入"
                    >
                      <Plus className="w-3 h-3" />
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
