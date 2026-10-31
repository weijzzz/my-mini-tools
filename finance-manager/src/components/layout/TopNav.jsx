import React from 'react';
import { Wallet, ClipboardEdit, BarChart3 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const tabs = [
  { key: 'entry', label: '录入', icon: ClipboardEdit },
  { key: 'dashboard', label: '统计', icon: BarChart3 },
];

export default function TopNav() {
  const { currentPage, setCurrentPage } = useStore();

  return (
    <nav
      className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-sky-400 to-sky-600 p-1.5 rounded-xl shadow-inner border border-sky-400/30">
            <Wallet size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
            个人记账本
          </span>
        </div>

        {/* Phones use the bottom nav; wider screens get the tabs up here. */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setCurrentPage(key)}
              aria-current={currentPage === key ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
