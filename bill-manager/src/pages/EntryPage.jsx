import React, { useState } from 'react';
import { Truck, Receipt, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import SupplierGrid from '../components/supplier/SupplierGrid';
import BillEntryForm from '../components/bill/BillEntryForm';
import BillList from '../components/bill/BillList';

export default function EntryPage() {
  const { suppliers, bills, addBill, updateBill, deleteBill } = useStore();
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
      <div className="space-y-6 md:space-y-8">
        {/* Supplier Selection */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Truck size={20} className="text-teal-600" />
            选择供货商
          </h2>
          <SupplierGrid
            selectedSupplierId={selectedSupplier?.id || null}
            onSelect={handleSelectSupplier}
          />
        </section>

        {/* Bill Entry Form */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Receipt size={20} className="text-teal-600" />
            录入账单
          </h2>
          <BillEntryForm selectedSupplier={selectedSupplier} />
        </section>

        {/* Recent Bills */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Clock size={20} className="text-teal-600" />
            最近录入
          </h2>
          <BillList bills={bills} limit={10} />
        </section>
      </div>
    </div>
  );
}
