import React, { useRef, useState } from 'react';
import { Truck, Receipt, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import SupplierGrid from '../components/supplier/SupplierGrid';
import BillEntryForm from '../components/bill/BillEntryForm';
import BillList from '../components/bill/BillList';

export default function EntryPage() {
  const { bills } = useStore();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const formRef = useRef(null);

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    // On a phone the form is below a long supplier grid: bring it into view
    // so the next tap is the amount, not a scroll.
    const el = formRef.current;
    if (supplier && el && window.innerWidth < 768) {
      const top = el.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.45) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
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
        <section ref={formRef} className="scroll-mt-16">
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
