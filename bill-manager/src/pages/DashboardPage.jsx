import React, { useState, useMemo } from 'react';
import { List, Calendar, CalendarDays } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import StatCards from '../components/dashboard/StatCards';
import CategoryChart from '../components/dashboard/CategoryChart';
import SupplierSummary from '../components/dashboard/SupplierSummary';
import SupplierPieChart from '../components/dashboard/SupplierPieChart';
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart';
import DailyTrendChart from '../components/dashboard/DailyTrendChart';
import ExportBar from '../components/dashboard/ExportBar';
import BillList from '../components/bill/BillList';

export default function DashboardPage() {
  const { bills, allBills, selectedMonth } = useStore();
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  const displayBills = useMemo(() => {
    if (viewMode === 'month') return bills;
    return allBills.filter(b => b.date && b.date.startsWith(selectedYear));
  }, [viewMode, bills, allBills, selectedYear]);

  const availableYears = useMemo(() => {
    const years = new Set(allBills.map(b => b.date?.substring(0, 4)).filter(Boolean));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [allBills]);

  const dateLabel = viewMode === 'year' ? `${selectedYear}年` : undefined;
  const exportLabel = viewMode === 'year' ? selectedYear : selectedMonth;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
      
      {/* Top Toggle & Year Picker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="bg-slate-200/60 p-1 rounded-xl flex items-center w-full sm:w-auto">
          <button 
            onClick={() => setViewMode('month')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${viewMode === 'month' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <Calendar size={16} />
            月度视图
          </button>
          <button 
            onClick={() => setViewMode('year')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${viewMode === 'year' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <CalendarDays size={16} />
            年度视图
          </button>
        </div>

        {viewMode === 'year' && (
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm cursor-pointer"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}年度</option>)}
          </select>
        )}
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* KPI Cards */}
        <StatCards bills={displayBills} dateLabel={dateLabel} />

        {/* Monthly Trend Chart (Only for year view) */}
        {viewMode === 'year' && (
          <MonthlyTrendChart bills={displayBills} />
        )}

        {/* Daily Trend Chart (Only for month view) */}
        {viewMode === 'month' && (
          <DailyTrendChart bills={displayBills} selectedMonth={selectedMonth} />
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CategoryChart bills={displayBills} />
          <SupplierPieChart bills={displayBills} />
          <SupplierSummary bills={displayBills} />
        </div>

        {/* Export & Backup */}
        <ExportBar billsToExport={displayBills} exportLabel={exportLabel} />

        {/* Full Bill List */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <List size={20} className="text-teal-600" />
            账单明细
          </h2>
          <BillList bills={displayBills} />
        </section>
      </div>
    </div>
  );
}
