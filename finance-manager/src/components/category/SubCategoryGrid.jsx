import React, { useState, useRef, useMemo } from 'react';
import { Truck, Plus, Settings, Zap, FileText, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import AddSubCategoryModal from './AddSubCategoryModal';
import QuickEntryModal from '../transaction/QuickEntryModal';
import EditSubCategoryModal from './EditSubCategoryModal';
import SubCategoryDetailModal from './SubCategoryDetailModal';

export default function SubCategoryGrid({ selectedSubId, onSelect }) {
  const { subCategories, currentMainCategoryId, mainCategories } = useStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [quickEntrySub, setQuickEntrySub] = useState(null);
  const [editSub, setEditSub] = useState(null);
  const [detailSub, setDetailSub] = useState(null);

  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const currentMainCat = mainCategories.find(c => c.id === currentMainCategoryId);
  const isIncome = currentMainCat?.type === 'income';

  const visibleSubs = useMemo(() => {
    return subCategories.filter(s => s.mainId === currentMainCategoryId);
  }, [subCategories, currentMainCategoryId]);

  const handleSubAdded = (sub) => {
    onSelect(sub);
  };

  const handleEdit = (e, sub) => {
    e.stopPropagation();
    setEditSub(sub);
  };

  const handleQuickEntry = (e, sub) => {
    e.stopPropagation();
    setQuickEntrySub(sub);
  };

  const handleShowDetail = (e, sub) => {
    e.stopPropagation();
    setDetailSub(sub);
  };

  const handleDeleted = (deletedId) => {
    if (selectedSubId === deletedId) {
      onSelect(null);
    }
  };

  const handleTouchStart = (e, sub) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setDetailSub(sub);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (sub) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    onSelect(sub);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-2.5 pt-2 pl-2">
        {visibleSubs.map((sub) => {
          const isSelected = selectedSubId === sub.id;
          
          let selectedClasses = 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/30 text-sky-700';
          let unselectedClasses = 'border-slate-200 bg-white text-slate-700 hover:shadow-md hover:scale-[1.02] active:scale-95';
          let iconColor = isSelected ? 'text-sky-500' : 'text-slate-300';
          
          if (isIncome) {
            selectedClasses = 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 text-emerald-700';
            iconColor = isSelected ? 'text-emerald-500' : 'text-slate-300';
          }

          return (
            <button
              key={sub.id}
              onClick={() => handleClick(sub)}
              onTouchStart={(e) => handleTouchStart(e, sub)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
              onMouseDown={(e) => handleTouchStart(e, sub)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className={`relative group flex flex-col items-center justify-center min-h-[64px] rounded-xl p-3 border-2 transition-all duration-150 cursor-pointer select-none ${
                isSelected ? selectedClasses : unselectedClasses
              }`}
            >
              {/* Edit button on top right */}
              <span
                onClick={(e) => handleEdit(e, sub)}
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full transition-opacity cursor-pointer hover:bg-slate-200 shadow-sm z-10 border border-slate-200"
                title="编辑/删除"
              >
                <Settings className="w-3.5 h-3.5" />
              </span>

              {/* Quick Entry Button */}
              <span
                onClick={(e) => handleQuickEntry(e, sub)}
                className="absolute -top-3 -left-3 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full transition-transform cursor-pointer hover:from-amber-500 hover:to-amber-600 shadow-md z-10 hover:scale-110 active:scale-95 border-2 border-white"
                title="极速录入"
              >
                <Zap className="w-5 h-5" fill="currentColor" />
              </span>
              
              {/* Detail Button */}
              <span
                onClick={(e) => handleShowDetail(e, sub)}
                className={`absolute -bottom-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full transition-opacity cursor-pointer shadow-sm z-10 border border-white md:opacity-0 md:group-hover:opacity-100 opacity-100 ${
                  isIncome ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                }`}
                title="明细详情 (长按卡片也可以)"
              >
                <FileText className="w-3 h-3" />
              </span>

              <Tag
                className={`w-5 h-5 mb-1 ${iconColor}`}
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium truncate w-full text-center leading-tight mt-1">
                {sub.name}
              </span>
              {sub.note && (
                <span className="text-[10px] text-slate-400 truncate w-full text-center mt-0.5">
                  {sub.note}
                </span>
              )}
            </button>
          );
        })}

        {/* Add New SubCategory Card */}
        <button
          onClick={() => setAddModalOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[64px] rounded-xl p-3 border-2 border-dashed border-slate-300 text-slate-400 transition-all duration-150 cursor-pointer active:scale-95 ${
            isIncome 
              ? 'hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/50' 
              : 'hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50'
          }`}
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-sm font-medium">新增</span>
        </button>
      </div>

      <AddSubCategoryModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubAdded={handleSubAdded}
      />

      <QuickEntryModal
        isOpen={!!quickEntrySub}
        onClose={() => setQuickEntrySub(null)}
        subCategory={quickEntrySub}
      />

      <EditSubCategoryModal
        isOpen={!!editSub}
        onClose={() => setEditSub(null)}
        subCategory={editSub}
        onDeleted={handleDeleted}
      />

      <SubCategoryDetailModal
        isOpen={!!detailSub}
        onClose={() => setDetailSub(null)}
        subCategory={detailSub}
      />
    </>
  );
}
