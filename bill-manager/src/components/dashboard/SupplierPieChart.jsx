import React from 'react';
import DonutChart from './DonutChart';

const bySupplier = (bill) => bill.supplierName || '未知供货商';

export default function SupplierPieChart({ bills }) {
  return <DonutChart title="供货商占比" bills={bills} groupBy={bySupplier} />;
}
