import React from 'react';
import { ClipboardEdit, BarChart3 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const tabs = [
  { key: 'entry', label: '录入', icon: ClipboardEdit },
  { key: 'dashboard', label: '统计', icon: BarChart3 },
];

export default function BottomNav() {
  const { currentPage, setCurrentPage } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => setCurrentPage(key)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[52px] gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-teal-500'
                  : 'text-slate-400 active:text-slate-500'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-xs ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
