import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Zap, MoreHorizontal, Search, X, ArrowUpDown, FileText, Pencil, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import AddSubCategoryModal from './AddSubCategoryModal';
import QuickEntryModal from '../transaction/QuickEntryModal';
import EditSubCategoryModal from './EditSubCategoryModal';
import SubCategoryDetailModal from './SubCategoryDetailModal';
import Modal from '../ui/Modal';
import ReorderModal from '../ui/ReorderModal';
import Toast from '../ui/Toast';
import { SORT_MODES, compareNames, filterByQuery, sortItems } from '../../utils/sort';

const SEARCH_THRESHOLD = 8;

export default function SubCategoryGrid({ selectedSubId, onSelect }) {
  const {
    subCategories,
    currentMainCategoryId,
    mainCategories,
    allTransactions,
    subSort,
    setSubSort,
    reorderSubCategories,
  } = useStore();
  const [query, setQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [quickEntrySub, setQuickEntrySub] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [detailSub, setDetailSub] = useState(null);
  const [menuSub, setMenuSub] = useState(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const currentMainCat = mainCategories.find((c) => c.id === currentMainCategoryId);
  const isIncome = currentMainCat?.type === 'income';
  const tone = isIncome
    ? { sel: 'border-emerald-500 bg-emerald-50 ring-emerald-500/25', text: 'text-emerald-800', check: 'text-emerald-600', seg: 'text-emerald-700' }
    : { sel: 'border-sky-500 bg-sky-50 ring-sky-500/25', text: 'text-sky-800', check: 'text-sky-600', seg: 'text-sky-700' };

  const counts = useMemo(() => {
    const map = new Map();
    for (const t of allTransactions) map.set(t.subId, (map.get(t.subId) || 0) + 1);
    return map;
  }, [allTransactions]);

  const mine = useMemo(
    () => subCategories.filter((s) => s.mainId === currentMainCategoryId),
    [subCategories, currentMainCategoryId]
  );
  const visible = useMemo(() => filterByQuery(sortItems(mine, subSort, counts), query), [mine, subSort, counts, query]);

  const reorderItems = useMemo(
    () =>
      sortItems(mine, subSort, counts).map((s) => ({
        id: s.id,
        name: s.name,
        label: s.name,
        sublabel: `${counts.get(s.id) || 0} 笔${s.note ? ` · ${s.note}` : ''}`,
      })),
    [mine, subSort, counts]
  );

  // Switching tabs starts with an empty search.
  useEffect(() => setQuery(''), [currentMainCategoryId]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handlePressStart = (e, sub) => {
    if (e.button !== undefined && e.button !== 0) return;
    clearTimeout(timerRef.current);
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      navigator.vibrate?.(40);
      setDetailSub(sub);
    }, 500);
  };
  const handlePressEnd = () => clearTimeout(timerRef.current);

  const handleClick = (sub) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onSelect(sub);
  };

  const fromMenu = (action) => {
    const s = menuSub;
    setMenuSub(null);
    if (!s) return;
    if (action === 'quick') setQuickEntrySub(s);
    if (action === 'detail') setDetailSub(s);
    if (action === 'edit') setEditSub(s);
  };

  return (
    <>
      {mine.length > 1 && (
        <div className="space-y-2 mb-3">
          {mine.length > SEARCH_THRESHOLD && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`搜索 ${mine.length} 个项目`}
                aria-label="搜索项目"
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              {query && (
                <button type="button" aria-label="清除搜索" onClick={() => setQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg" role="radiogroup" aria-label="项目排序">
              {SORT_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={subSort === m.key}
                  onClick={() => setSubSort(m.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    subSort === m.key ? `bg-white shadow-sm ${tone.seg}` : 'text-slate-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReorderOpen(true)}
              className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 rounded-lg active:bg-slate-100"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              调整顺序
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {visible.map((sub) => {
          const isSelected = selectedSubId === sub.id;
          const count = counts.get(sub.id) || 0;
          return (
            <div
              key={sub.id}
              className={`relative flex min-h-[60px] rounded-xl border overflow-hidden transition-colors ${
                isSelected ? `${tone.sel} ring-2` : 'border-slate-200 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => handleClick(sub)}
                onPointerDown={(e) => handlePressStart(e, sub)}
                onPointerUp={handlePressEnd}
                onPointerLeave={handlePressEnd}
                onPointerCancel={handlePressEnd}
                onContextMenu={(e) => e.preventDefault()}
                aria-pressed={isSelected}
                className="flex-1 min-w-0 text-left pl-3 pr-8 py-2 select-none active:bg-slate-50"
              >
                <span className={`flex items-center gap-1 text-sm font-semibold leading-tight ${isSelected ? tone.text : 'text-slate-800'}`}>
                  {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ${tone.check}`} strokeWidth={3} />}
                  <span className="line-clamp-2 break-words">{sub.name}</span>
                </span>
                <span className="block mt-0.5 text-[11px] text-slate-400 truncate">
                  {sub.note || (count ? `${count} 笔` : '还没有记录')}
                </span>
              </button>
              <button
                type="button"
                aria-label={`更多操作 ${sub.name}`}
                onClick={() => setMenuSub(sub)}
                className="absolute right-11 bottom-0.5 p-1.5 text-slate-400 active:text-slate-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={`极速录入 ${sub.name}`}
                onClick={() => setQuickEntrySub(sub)}
                className="w-11 shrink-0 flex items-center justify-center border-l border-slate-100 text-amber-500 active:bg-amber-50"
              >
                <Zap className="w-5 h-5" fill="currentColor" />
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={`flex items-center justify-center gap-1.5 min-h-[60px] rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors ${
            isIncome ? 'active:border-emerald-400 active:text-emerald-500' : 'active:border-sky-400 active:text-sky-500'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">新增</span>
        </button>
      </div>

      <AddSubCategoryModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSubAdded={(s) => onSelect(s)} />

      <QuickEntryModal
        isOpen={!!quickEntrySub}
        onClose={() => setQuickEntrySub(null)}
        subCategory={quickEntrySub}
        onAdded={(txn) =>
          setToast({ message: `⚡ 已记 €${txn.amount.toFixed(2)} · ${txn.subName}`, type: 'success', isVisible: true })
        }
      />

      <EditSubCategoryModal
        isOpen={!!editSub}
        onClose={() => setEditSub(null)}
        subCategory={editSub}
        onDeleted={(id) => selectedSubId === id && onSelect(null)}
      />

      <SubCategoryDetailModal isOpen={!!detailSub} onClose={() => setDetailSub(null)} subCategory={detailSub} />

      <Modal isOpen={!!menuSub} onClose={() => setMenuSub(null)} title={menuSub?.name || ''} maxWidth="sm">
        <div className="space-y-2 pb-1">
          {[
            { key: 'quick', icon: Zap, label: '极速录入（日期为今天）', cls: 'text-amber-600' },
            { key: 'detail', icon: FileText, label: '历史明细（长按卡片也可以）', cls: 'text-sky-600' },
            { key: 'edit', icon: Pencil, label: '编辑 / 删除', cls: 'text-slate-600' },
          ].map(({ key, icon: Icon, label, cls }) => (
            <button
              key={key}
              type="button"
              onClick={() => fromMenu(key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-50 active:bg-slate-100 text-sm font-medium text-slate-700"
            >
              <Icon className={`w-5 h-5 ${cls}`} />
              {label}
            </button>
          ))}
        </div>
      </Modal>

      <ReorderModal
        isOpen={reorderOpen}
        onClose={() => setReorderOpen(false)}
        title={`调整「${currentMainCat?.name || ''}」项目顺序`}
        accent="sky"
        items={reorderItems}
        presets={[
          { label: '按名称 A→Z', sort: (list) => [...list].sort((a, b) => compareNames(a.name, b.name)) },
          {
            label: '按常用',
            sort: (list) =>
              [...list].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || compareNames(a.name, b.name)),
          },
        ]}
        onSave={(ids) => {
          reorderSubCategories(currentMainCategoryId, ids);
          setSubSort('custom');
        }}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />
    </>
  );
}
