import React, { useState, useRef, useEffect } from 'react';
import { Receipt, ChevronDown, Store, Settings } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function Header({ onOpenStoreManager }) {
  const { stores, currentStore, switchStore, selectedMonth, setSelectedMonth } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchStore = (storeId) => {
    switchStore(storeId);
    setDropdownOpen(false);
  };

  const handleManageStores = () => {
    setDropdownOpen(false);
    onOpenStoreManager?.();
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white backdrop-blur-md border-b border-slate-700/50 shadow-[0_1px_12px_rgba(0,0,0,0.25)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-[52px] md:h-[60px] px-3 md:px-5">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Receipt className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
          <span className="text-base md:text-lg font-bold tracking-wide">
            账单管家
          </span>
        </div>

        {/* Center: Store Switcher */}
        <div className="relative mx-3 md:mx-6 flex-1 max-w-[220px] md:max-w-xs" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 w-full justify-center px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 transition-colors text-sm md:text-base cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[100px] md:max-w-[160px]">
              {currentStore?.name || '选择店面'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="max-h-52 overflow-y-auto py-1">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleSwitchStore(store.id)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                      store.id === currentStore?.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100">
                <button
                  onClick={handleManageStores}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-slate-500 hover:text-teal-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  管理店面
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Month Picker */}
        <div className="shrink-0">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-700/60 hover:bg-slate-700 text-white text-xs md:text-sm rounded-lg border-0 px-2 md:px-3 py-1.5 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50 [color-scheme:dark]"
          />
        </div>
      </div>
    </header>
  );
}
