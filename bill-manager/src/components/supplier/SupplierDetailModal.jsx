import React, { useMemo } from 'react';
import { FileText, CalendarDays, Euro } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';

export default function SupplierDetailModal({ isOpen, onClose, supplier }) {
  const { allBills } = useStore();

  const { groupedBills, totalAmount } = useMemo(() => {
    if (!supplier) return { groupedBills: [], totalAmount: 0 };

    const supplierBills = allBills.filter(b => b.supplierId === supplier.id);
    
    // Sort descending by date (and ID to keep latest on top if same day)
    supplierBills.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.id.localeCompare(a.id);
    });

    let total = 0;
    const groups = {};

    supplierBills.forEach(bill => {
      const monthStr = bill.date.substring(0, 7); // e.g. "2026-07"
      if (!groups[monthStr]) {
        groups[monthStr] = {
          month: monthStr,
          total: 0,
          bills: []
        };
      }
      groups[monthStr].bills.push(bill);
      groups[monthStr].total += Number(bill.amount);
      total += Number(bill.amount);
    });

    // Convert to array and sort months descending
    const groupedArray = Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));

    return { groupedBills: groupedArray, totalAmount: total };
  }, [allBills, supplier]);

  if (!supplier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="供货商对账单" maxWidth="md">
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        {/* Header Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{supplier.name}</h3>
              {supplier.note && (
                <p className="text-sm text-slate-500 mt-1">{supplier.note}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-1">历史总交易额</span>
              <span className="text-xl font-bold text-teal-600">
                €{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Bills List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {groupedBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <FileText size={48} className="mb-3 opacity-30" />
              <p>暂无该供货商的交易记录</p>
            </div>
          ) : (
            groupedBills.map((group) => (
              <div key={group.month} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Month Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <CalendarDays size={16} className="text-slate-400" />
                    {group.month.replace('-', '年')}月
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    小计: €{group.total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Bills List */}
                <div className="divide-y divide-slate-100">
                  {group.bills.map((bill) => (
                    <div key={bill.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {bill.date.substring(8, 10)}日
                          </span>
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {bill.category}
                          </span>
                        </div>
                        {bill.note && (
                          <span className="text-xs text-slate-500 truncate w-full">
                            {bill.note}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4 font-semibold text-slate-800 flex items-center">
                        <Euro size={12} className="mr-0.5 text-slate-400" />
                        {Number(bill.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
