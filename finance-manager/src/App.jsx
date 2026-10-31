import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import TopNav from './components/layout/TopNav';
import BottomNav from './components/layout/BottomNav';
import EntryPage from './pages/EntryPage';
import DashboardPage from './pages/DashboardPage';

function AppContent() {
  const { currentPage } = useStore();

  // Each tab starts at the top instead of inheriting the other tab's scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-sky-200">
      <TopNav />
      <main className="flex-1 overflow-x-hidden">
        {currentPage === 'entry' ? <EntryPage /> : <DashboardPage />}
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
