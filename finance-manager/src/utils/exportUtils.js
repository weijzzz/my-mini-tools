import * as XLSX from 'xlsx';

export function exportToExcel(bills, filename = '账单导出') {
  const rows = bills.map((bill) => ({
    日期: bill.date || '',
    供货商: bill.supplierName || '',
    分类: bill.category || '',
    金额: typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount) || 0,
    备注: bill.note || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 14 }, // 日期
    { wch: 18 }, // 供货商
    { wch: 14 }, // 分类
    { wch: 12 }, // 金额
    { wch: 24 }, // 备注
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(bills, filename = '账单导出') {
  const headers = ['日期', '供货商', '分类', '金额', '备注'];
  const rows = bills.map((bill) =>
    [
      bill.date || '',
      bill.supplierName || '',
      bill.category || '',
      typeof bill.amount === 'number' ? bill.amount : parseFloat(bill.amount) || 0,
      bill.note || '',
    ]
      .map((field) => {
        const str = String(field);
        // Escape fields containing commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  // BOM for proper Chinese encoding in Excel
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

