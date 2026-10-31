import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import SubCategoryGrid from '../components/category/SubCategoryGrid';
import TransactionEntryForm from '../components/transaction/TransactionEntryForm';
import RecentTransactions from '../components/transaction/RecentTransactions';
import AddMainCategoryModal from '../components/category/AddMainCategoryModal';
import ManageMainCategoriesModal from '../components/category/ManageMainCategoriesModal';
import { Utensils, Car, ShoppingBag, Wallet, Tag, Plus, SlidersHorizontal } from 'lucide-react';

// Older saved categories have no `icon`, so fall back to the default ids.
const DEFAULT_ICON_BY_ID = {
  cat_food: 'Utensils',
  cat_trans: 'Car',
  cat_shop: 'ShoppingBag',
  cat_income: 'Wallet',
};

const ICON_MAP = {
  Utensils: <Utensils size={18} />,
  Car: <Car size={18} />,
  ShoppingBag: <ShoppingBag size={18} />,
  Wallet: <Wallet size={18} />,
  Tag: <Tag size={18} />
};

export default function EntryPage() {
  const { mainCategories, currentMainCategoryId, setCurrentMainCategoryId } = useStore();
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [addMainCatModalOpen, setAddMainCatModalOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const handleSubSelect = (sub) => {
    setSelectedSubId(sub ? sub.id : null);
  };

  const currentMainCat = mainCategories.find(c => c.id === currentMainCategoryId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
      {/* Top Tabs for Main Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4 md:mx-0 md:px-0 overscroll-x-contain">
        {mainCategories.map((cat) => {
          const isActive = currentMainCategoryId === cat.id;
          const isIncome = cat.type === 'income';
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isActive}
              onClick={(e) => {
                setCurrentMainCategoryId(cat.id);
                setSelectedSubId(null);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap shrink-0 border-2 ${
                isActive
                  ? isIncome 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                    : 'bg-sky-50 text-sky-700 border-sky-500 shadow-sm'
                  : 'bg-white text-slate-500 border-transparent hover:bg-slate-50'
              }`}
            >
              <span className={isActive ? (isIncome ? 'text-emerald-500' : 'text-sky-500') : 'text-slate-400'}>
                {ICON_MAP[cat.icon || DEFAULT_ICON_BY_ID[cat.id]] || <Tag size={18} />}
              </span>
              {cat.name}
            </button>
          );
        })}

        {/* Add / manage main categories */}
        <button
          type="button"
          aria-label="新增大分类"
          onClick={() => setAddMainCatModalOpen(true)}
          className="flex items-center justify-center min-w-[52px] h-[52px] rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-all shrink-0 ml-1"
          title="新增大分类"
        >
          <Plus size={20} />
        </button>
        <button
          type="button"
          aria-label="排序和管理分类"
          onClick={() => setManageOpen(true)}
          className="flex items-center justify-center min-w-[52px] h-[52px] rounded-2xl bg-white border-2 border-transparent text-slate-400 active:text-sky-600 active:bg-sky-50 transition-all shrink-0"
          title="排序和管理分类"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          选择具体项目 ({currentMainCat?.name})
        </h2>
        
        {/* Render Sub Categories Grid */}
        <SubCategoryGrid 
          selectedSubId={selectedSubId} 
          onSelect={handleSubSelect} 
        />
      </div>

      <RecentTransactions />

      {selectedSubId && (
        <TransactionEntryForm 
          selectedSubId={selectedSubId} 
          onClear={() => setSelectedSubId(null)} 
        />
      )}

      <AddMainCategoryModal 
        isOpen={addMainCatModalOpen} 
        onClose={() => setAddMainCatModalOpen(false)} 
      />
      <ManageMainCategoriesModal isOpen={manageOpen} onClose={() => setManageOpen(false)} />
    </div>
  );
}
