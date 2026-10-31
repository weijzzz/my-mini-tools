import React, { useState, useRef, useEffect } from 'react';
import { Truck, Plus, Settings, Zap, FileText } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import AddSupplierModal from './AddSupplierModal';
import QuickEntryModal from '../bill/QuickEntryModal';
import EditSupplierModal from './EditSupplierModal';
import SupplierDetailModal from './SupplierDetailModal';

export default function SupplierGrid({ selectedSupplierId, onSelect }) {
  const { suppliers } = useStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [quickEntrySupplier, setQuickEntrySupplier] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [detailSupplier, setDetailSupplier] = useState(null);

  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const handleSupplierAdded = (supplier) => {
    onSelect(supplier);
  };

  const handleEdit = (e, supplier) => {
    e.stopPropagation();
    setEditSupplier(supplier);
  };

  const handleQuickEntry = (e, supplier) => {
    e.stopPropagation();
    setQuickEntrySupplier(supplier);
  };

  const handleShowDetail = (e, supplier) => {
    e.stopPropagation();
    setDetailSupplier(supplier);
  };

  const handleDeleted = (deletedId) => {
    if (selectedSupplierId === deletedId) {
      onSelect(null);
    }
  };

  // Never leave a pending long-press timer behind after unmount.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Pointer events cover touch and mouse in one path. The old touch + mouse
  // pair fired twice on phones (touch, then the emulated mouse events).
  const handlePressStart = (e, supplier) => {
    if (e.button !== undefined && e.button !== 0) return;
    clearTimeout(timerRef.current);
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      // Trigger haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setDetailSupplier(supplier);
    }, 500);
  };

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (supplier) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onSelect(supplier);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-2.5 pt-2 pl-2">
        {suppliers.map((supplier) => {
          const isSelected = selectedSupplierId === supplier.id;
          return (
            <button
              type="button"
              key={supplier.id}
              onClick={() => handleClick(supplier)}
              onPointerDown={(e) => handlePressStart(e, supplier)}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onPointerCancel={handlePressEnd}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative group flex flex-col items-center justify-center min-h-[64px] rounded-xl p-3 border-2 transition-all duration-150 cursor-pointer select-none ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/30 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:shadow-md hover:scale-[1.02] active:scale-95'
              }`}
            >
              {/* Edit button on top right */}
              <span
                role="button"
                aria-label={`编辑 ${supplier.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleEdit(e, supplier)}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full transition-opacity cursor-pointer hover:bg-slate-200 shadow-sm z-10 border border-slate-200"
                title="编辑/删除"
              >
                <Settings className="w-3.5 h-3.5" />
              </span>

              {/* Quick Entry Button (Enlarged) on top left */}
              <span
                role="button"
                aria-label={`极速录入 ${supplier.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleQuickEntry(e, supplier)}
                className="absolute -top-3 -left-3 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full transition-transform cursor-pointer hover:from-amber-500 hover:to-amber-600 shadow-md z-10 hover:scale-110 active:scale-95 border-2 border-white"
                title="极速录入"
              >
                <Zap className="w-5 h-5" fill="currentColor" />
              </span>
              
              {/* Detail Button on bottom right (backup for long press) */}
              <span
                role="button"
                aria-label={`对账详情 ${supplier.name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => handleShowDetail(e, supplier)}
                className="absolute -bottom-2 -right-2 w-7 h-7 flex items-center justify-center bg-teal-100 text-teal-600 rounded-full transition-opacity cursor-pointer hover:bg-teal-200 shadow-sm z-10 border border-white md:opacity-0 md:group-hover:opacity-100 opacity-100"
                title="对账详情 (长按卡片也可以)"
              >
                <FileText className="w-3 h-3" />
              </span>

              <Truck
                className={`w-5 h-5 mb-1 ${
                  isSelected ? 'text-teal-500' : 'text-slate-300'
                }`}
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium truncate w-full text-center leading-tight mt-1">
                {supplier.name}
              </span>
              {supplier.note && (
                <span className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5">
                  {supplier.note}
                </span>
              )}
            </button>
          );
        })}

        {/* Add New Supplier Card */}
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex flex-col items-center justify-center min-h-[64px] rounded-xl p-3 border-2 border-dashed border-slate-300 text-slate-400 hover:border-teal-400 hover:text-teal-500 hover:bg-teal-50/50 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-sm font-medium">新增</span>
        </button>
      </div>

      <AddSupplierModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSupplierAdded={handleSupplierAdded}
      />

      <QuickEntryModal
        isOpen={!!quickEntrySupplier}
        onClose={() => setQuickEntrySupplier(null)}
        supplier={quickEntrySupplier}
      />

      <EditSupplierModal
        isOpen={!!editSupplier}
        onClose={() => setEditSupplier(null)}
        supplier={editSupplier}
        onDeleted={handleDeleted}
      />

      <SupplierDetailModal
        isOpen={!!detailSupplier}
        onClose={() => setDetailSupplier(null)}
        supplier={detailSupplier}
      />
    </>
  );
}
