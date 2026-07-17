import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Plus, Store, Check, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function StoreManager({ isOpen, onClose }) {
  const { stores, addStore, updateStore, deleteStore } = useStore();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const editInputRef = useRef(null);
  const newInputRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (isAdding && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isAdding]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditName('');
      setNewName('');
      setIsAdding(false);
      setDeleteTarget(null);
    }
  }, [isOpen]);

  const startEditing = (store) => {
    setEditingId(store.id);
    setEditName(store.name);
  };

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && editingId) {
      updateStore(editingId, { name: trimmed });
    }
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleAddStore = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addStore(trimmed);
    setNewName('');
    setIsAdding(false);
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') handleAddStore();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewName('');
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteStore(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="店面管理" maxWidth="sm">
        <div className="space-y-1">
          {stores.map((store) => (
            <div
              key={store.id}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-50 group transition-colors"
            >
              <Store className="w-4 h-4 text-slate-400 shrink-0" />

              {editingId === store.id ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleEditKeyDown}
                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={saveEdit}
                    className="p-1 text-teal-600 hover:bg-teal-50 rounded cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={cancelEdit}
                    className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700 truncate">
                    {store.name}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(store)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md cursor-pointer transition-colors"
                      title="重命名"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (stores.length <= 1) return;
                        setDeleteTarget(store);
                      }}
                      disabled={stores.length <= 1}
                      className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                        stores.length <= 1
                          ? 'text-slate-200 cursor-not-allowed'
                          : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={stores.length <= 1 ? '至少保留一个店面' : '删除'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Store */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isAdding ? (
            <div className="flex items-center gap-2">
              <input
                ref={newInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="输入店面名称"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
              />
              <button
                onClick={handleAddStore}
                disabled={!newName.trim()}
                className="px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                添加
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增店面
            </button>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="删除店面"
        message={`确定要删除「${deleteTarget?.name || ''}」吗？该店面下的所有数据将被清除，且无法恢复。`}
      />
    </>
  );
}
