import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Zap, MoreHorizontal, Search, X, ArrowUpDown, FileText, Pencil, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import AddSupplierModal from './AddSupplierModal';
import QuickEntryModal from '../bill/QuickEntryModal';
import EditSupplierModal from './EditSupplierModal';
import SupplierDetailModal from './SupplierDetailModal';
import Modal from '../ui/Modal';
import ReorderModal from '../ui/ReorderModal';
import Toast from '../ui/Toast';
import { SORT_MODES, compareNames, filterByQuery, groupByInitial, sortItems } from '../../utils/sort';

const SEARCH_THRESHOLD = 6;

export default function SupplierGrid({ selectedSupplierId, onSelect }) {
  const { suppliers, allBills, supplierSort, setSupplierSort, reorderSuppliers } = useStore();
  const [query, setQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addInitialName, setAddInitialName] = useState('');
  const [quickEntrySupplier, setQuickEntrySupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [detailSupplier, setDetailSupplier] = useState(null);
  const [menuSupplier, setMenuSupplier] = useState(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });

  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  // Bills per supplier, for the 常用 order and the small count on each card.
  const counts = useMemo(() => {
    const map = new Map();
    for (const b of allBills) map.set(b.supplierId, (map.get(b.supplierId) || 0) + 1);
    return map;
  }, [allBills]);

  const visible = useMemo(
    () => filterByQuery(sortItems(suppliers, supplierSort, counts), query),
    [suppliers, supplierSort, counts, query]
  );

  // A→Z: one section per first letter, like a phone's contact list.
  const sections = useMemo(
    () => (supplierSort === 'name' ? groupByInitial(visible) : null),
    [supplierSort, visible]
  );

  const jumpTo = (letter) => {
    document.getElementById(`supplier-letter-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const reorderItems = useMemo(
    () =>
      sortItems(suppliers, supplierSort, counts).map((s) => ({
        id: s.id,
        label: s.name,
        sublabel: `${counts.get(s.id) || 0} 笔${s.note ? ` · ${s.note}` : ''}`,
        name: s.name,
      })),
    [suppliers, supplierSort, counts]
  );

  // Never leave a pending long-press timer behind after unmount.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handlePressStart = (e, supplier) => {
    if (e.button !== undefined && e.button !== 0) return;
    clearTimeout(timerRef.current);
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      navigator.vibrate?.(40);
      setDetailSupplier(supplier);
    }, 500);
  };

  const handlePressEnd = () => clearTimeout(timerRef.current);

  const handleClick = (supplier) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onSelect(supplier);
  };

  const openAdd = (name = '') => {
    setAddInitialName(name);
    setAddModalOpen(true);
  };

  const handleQuickAdded = (bill) => {
    setToast({ message: `⚡ 已记 €${bill.amount.toFixed(2)} · ${bill.supplierName}`, type: 'success', isVisible: true });
  };

  const fromMenu = (action) => {
    const s = menuSupplier;
    setMenuSupplier(null);
    if (!s) return;
    if (action === 'quick') setQuickEntrySupplier(s);
    if (action === 'detail') setDetailSupplier(s);
    if (action === 'edit') setEditSupplier(s);
  };

  const renderCard = (supplier) => {
    const isSelected = selectedSupplierId === supplier.id;
    const count = counts.get(supplier.id) || 0;
    return (
      <div
        key={supplier.id}
        className={`relative flex min-h-[60px] rounded-xl border transition-colors overflow-hidden ${
          isSelected
            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/25'
            : 'border-slate-200 bg-white'
        }`}
      >
        <button
          type="button"
          onClick={() => handleClick(supplier)}
          onPointerDown={(e) => handlePressStart(e, supplier)}
          onPointerUp={handlePressEnd}
          onPointerLeave={handlePressEnd}
          onPointerCancel={handlePressEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-pressed={isSelected}
          className="flex-1 min-w-0 text-left pl-3 pr-8 py-2 select-none active:bg-slate-50"
        >
          <span
            className={`flex items-center gap-1 text-sm font-semibold leading-tight ${
              isSelected ? 'text-teal-800' : 'text-slate-800'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-teal-600" strokeWidth={3} />}
            <span className="line-clamp-2 break-words">{supplier.name}</span>
          </span>
          <span className="block mt-0.5 text-[11px] text-slate-400 truncate">
            {supplier.note || (count ? `${count} 笔` : '还没有账单')}
          </span>
        </button>

        {/* More: detail / edit, sits inside the name area */}
        <button
          type="button"
          aria-label={`更多操作 ${supplier.name}`}
          onClick={() => setMenuSupplier(supplier)}
          className="absolute right-11 bottom-0.5 p-1.5 text-slate-400 active:text-slate-700"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          aria-label={`极速录入 ${supplier.name}`}
          onClick={() => setQuickEntrySupplier(supplier)}
          className="w-11 shrink-0 flex items-center justify-center border-l border-slate-100 text-amber-500 active:bg-amber-50"
        >
          <Zap className="w-5 h-5" fill="currentColor" />
        </button>
      </div>
    );
  };

  const addCard =
    visible.length === 0 && query ? (
      <button
        type="button"
        onClick={() => openAdd(query.trim())}
        className="col-span-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 active:bg-teal-50"
      >
        <Plus className="w-4 h-4" />
        没找到，新增「{query.trim()}」
      </button>
    ) : (
      <button
        type="button"
        onClick={() => openAdd()}
        className="flex items-center justify-center gap-1.5 min-h-[60px] rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-teal-400 hover:text-teal-500 active:bg-teal-50/50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">新增</span>
      </button>
    );

  return (
    <>
      {suppliers.length > 0 && (
        <div className="space-y-2 mb-3">
          {suppliers.length > SEARCH_THRESHOLD && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`搜索 ${suppliers.length} 个供货商`}
                aria-label="搜索供货商"
                enterKeyHint="search"
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
              />
              {query && (
                <button
                  type="button"
                  aria-label="清除搜索"
                  onClick={() => setQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/60 p-0.5 rounded-lg" role="radiogroup" aria-label="供货商排序">
              {SORT_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={supplierSort === m.key}
                  onClick={() => setSupplierSort(m.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    supplierSort === m.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setReorderOpen(true)}
              className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 active:text-teal-700 rounded-lg active:bg-teal-50"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              调整顺序
            </button>
          </div>

          {sections && sections.length >= 4 && (
            <nav aria-label="按字母跳转" className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-0.5 md:mx-0 md:px-0">
              {sections.map(({ letter }) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => jumpTo(letter)}
                  className="shrink-0 min-w-8 h-8 px-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 active:bg-teal-600 active:text-white"
                >
                  {letter}
                </button>
              ))}
            </nav>
          )}
        </div>
      )}

      {sections ? (
        <div className="space-y-3">
          {sections.map(({ letter, items }) => (
            <section
              key={letter}
              id={`supplier-letter-${letter}`}
              aria-label={`${letter} 开头`}
              className="scroll-mt-[calc(4rem+env(safe-area-inset-top))]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="min-w-6 h-6 px-1.5 rounded-md bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                  {letter}
                </span>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-400">{items.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">{items.map(renderCard)}</div>
            </section>
          ))}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">{addCard}</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {visible.map(renderCard)}
          {addCard}
        </div>
      )}

      <AddSupplierModal
        isOpen={addModalOpen}
        initialName={addInitialName}
        onClose={() => setAddModalOpen(false)}
        onSupplierAdded={(s) => {
          setQuery('');
          onSelect(s);
        }}
      />

      <QuickEntryModal
        isOpen={!!quickEntrySupplier}
        onClose={() => setQuickEntrySupplier(null)}
        supplier={quickEntrySupplier}
        onAdded={handleQuickAdded}
      />

      <EditSupplierModal
        isOpen={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        supplier={editSupplier}
        onDeleted={(id) => selectedSupplierId === id && onSelect(null)}
      />

      <SupplierDetailModal
        isOpen={!!detailSupplier}
        onClose={() => setDetailSupplier(null)}
        supplier={detailSupplier}
      />

      {/* ⋯ action sheet */}
      <Modal isOpen={!!menuSupplier} onClose={() => setMenuSupplier(null)} title={menuSupplier?.name || ''} maxWidth="sm">
        <div className="space-y-2 pb-1">
          {[
            { key: 'quick', icon: Zap, label: '极速录入', cls: 'text-amber-600' },
            { key: 'detail', icon: FileText, label: '对账详情（长按卡片也可以）', cls: 'text-teal-600' },
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
        title="调整供货商顺序"
        items={reorderItems}
        presets={[
          { label: '按名称 A→Z', sort: (list) => [...list].sort((a, b) => compareNames(a.name, b.name)) },
          {
            label: '按常用',
            sort: (list) =>
              [...list].sort(
                (a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || compareNames(a.name, b.name)
              ),
          },
        ]}
        onSave={(ids) => {
          reorderSuppliers(ids);
          setSupplierSort('custom');
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
