import React from 'react';
import { Wallet, LogOut } from 'lucide-react';

export default function TopNav() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-sky-400 to-sky-600 p-1.5 rounded-xl shadow-inner border border-sky-400/30">
            <Wallet size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
            个人记账本
          </span>
        </div>
      </div>
    </nav>
  );
}
