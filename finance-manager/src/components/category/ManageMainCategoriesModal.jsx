import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import ReorderModal from '../ui/ReorderModal';
import { compareNames } from '../../utils/sort';

/**
 * Manage the tabs (餐饮 / 交通 / …): order, rename, delete.
 * Rename and delete apply at once; the order applies on 保存顺序.
 */
export default function ManageMainCategoriesModal({ isOpen, onClose }) {
  const {
    mainCategories,
    subCategories,
    allTransactions,
    reorderMainCategories,
    renameMainCategory,
    deleteMainCategory,
  } = useStore();
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');

  const usage = useMemo(() => {
    const map = new Map();
    for (const t of allTransactions) map.set(t.mainId, (map.get(t.mainId) || 0) + 1);
    return map;
  }, [allTransactions]);

  const items = useMemo(
    () =>
      mainCategories.map((c) => ({
        id: c.id,
        name: c.name,
        label: c.name,
        sublabel: `${c.type === 'income' ? '收入' : '支出'} · ${
          subCategories.filter((s) => s.mainId === c.id).length
        } 个项目 · ${usage.get(c.id) || 0} 笔`,
      })),
    [mainCategories, subCategories, usage]
  );

  useEffect(() => {
    if (renaming) setNewName(renaming.name);
  }, [renaming]);

  const handleDelete = (item) => {
    if (mainCategories.length <= 1) {
      alert('至少要保留一个分类');
      return;
    }
    const subs = subCategories.filter((s) => s.mainId === item.id).length;
    const msg = subs
      ? `删除「${item.name}」和它下面的 ${subs} 个项目？\n已记的账不会删除，统计里仍然显示。`
      : `删除「${item.name}」？已记的账不会删除。`;
    if (confirm(msg)) deleteMainCategory(item.id);
  };

  const saveRename = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (name && renaming) renameMainCategory(renaming.id, name);
    setRenaming(null);
  };

  return (
    <>
      <ReorderModal
        isOpen={isOpen}
        onClose={onClose}
        title="管理分类标签"
        hint="常用的放前面：拖动 ≡ 或用右侧按钮；✏️ 改名，🗑 删除"
        accent="sky"
        items={items}
        presets={[
          {
            label: '按使用次数',
            sort: (list) =>
              [...list].sort((a, b) => (usage.get(b.id) || 0) - (usage.get(a.id) || 0) || compareNames(a.name, b.name)),
          },
          {
            label: '支出在前',
            sort: (list) => {
              const type = new Map(mainCategories.map((c) => [c.id, c.type]));
              return [...list].sort((a, b) => (type.get(a.id) === 'income') - (type.get(b.id) === 'income'));
            },
          },
        ]}
        onSave={reorderMainCategories}
        renderActions={(item) => (
          <>
            <button
              type="button"
              aria-label={`改名 ${item.name}`}
              onClick={() => setRenaming(item)}
              className="p-2.5 text-slate-400 active:text-sky-600 active:bg-sky-50 rounded-lg"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              aria-label={`删除 ${item.name}`}
              onClick={() => handleDelete(item)}
              className="p-2.5 text-slate-400 active:text-red-500 active:bg-red-50 rounded-lg"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      <Modal isOpen={!!renaming} onClose={() => setRenaming(null)} title="修改分类名称" maxWidth="sm">
        <form onSubmit={saveRename} className="space-y-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="分类名称"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold disabled:opacity-40"
          >
            保存
          </button>
        </form>
      </Modal>
    </>
  );
}
