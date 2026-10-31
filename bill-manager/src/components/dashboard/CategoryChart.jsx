import React from 'react';
import DonutChart from './DonutChart';

const byCategory = (bill) => bill.category || '未分类';

export default function CategoryChart({ bills }) {
  return <DonutChart title="分类占比" bills={bills} groupBy={byCategory} />;
}
