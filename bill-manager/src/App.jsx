import React, { useState } from 'react';
import { ClipboardEdit, BarChart3 } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import StoreManager from './components/store/StoreManager';
import EntryPage from './pages/EntryPage';
import DashboardPage from './pages/DashboardPage';

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-teal-50 text-teal-700 shadow-sm'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}

function AppContent() {
  const { currentPage, setCurrentPage } = useStore();
  const [showStoreManager, setShowStoreManager] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onOpenStoreManager={() => setShowStoreManager(true)} />

      {/* Desktop layout with sidebar */}
      <div className="hidden md:flex">
        <aside className="w-56 fixed top-[60px] left-0 bottom-0 bg-white border-r border-slate-200 p-4 flex flex-col gap-2 z-10">
          <NavButton
            active={currentPage === 'entry'}
            onClick={() => setCurrentPage('entry')}
            icon={ClipboardEdit}
            label="账单录入"
          />
          <NavButton
            active={currentPage === 'dashboard'}
            onClick={() => setCurrentPage('dashboard')}
            icon={BarChart3}
            label="月度统计"
          />
        </aside>
        <main className="ml-56 flex-1 w-full">
          {currentPage === 'entry' ? <EntryPage /> : <DashboardPage />}
        </main>
      </div>

      {/* Mobile layout - no sidebar */}
      <div className="md:hidden">
        <main>
          {currentPage === 'entry' ? <EntryPage /> : <DashboardPage />}
        </main>
      </div>

      <BottomNav />
      <StoreManager
        isOpen={showStoreManager}
        onClose={() => setShowStoreManager(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
