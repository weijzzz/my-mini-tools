import React, { useRef, useState } from 'react';
import { HardDrive, FileSpreadsheet, FileText, Download, Upload, Loader2 } from 'lucide-react';
import { exportToExcel, exportToCSV } from '../../utils/exportUtils';
import { exportBackup, importBackup } from '../../utils/backupUtils';

export default function ExportBar({ billsToExport, exportLabel }) {
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportToExcel(billsToExport || [], exportLabel);
    } catch (err) {
      alert('导出失败: ' + (err.message || '未知错误'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(billsToExport || [], exportLabel);
  };

  const handleExportBackup = () => {
    exportBackup();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('导入备份会覆盖当前所有店面的数据，确定继续吗？')) {
      e.target.value = '';
      return;
    }
    try {
      await importBackup(file);
      window.location.reload();
    } catch (err) {
      alert('导入失败: ' + (err.message || '未知错误'));
    } finally {
      // Reset file input so the same file can be selected again
      e.target.value = '';
    }
  };

  const buttons = [
    {
      label: exporting ? '生成中…' : '导出 Excel',
      icon: exporting ? Loader2 : FileSpreadsheet,
      onClick: handleExportExcel,
      className: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white',
    },
    {
      label: '导出 CSV',
      icon: FileText,
      onClick: handleExportCSV,
      className: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white',
    },
    {
      label: '备份数据',
      icon: Download,
      onClick: handleExportBackup,
      className: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white',
    },
    {
      label: '导入备份',
      icon: Upload,
      onClick: handleImportClick,
      className: 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={20} className="text-teal-600" />
        <h3 className="text-base font-semibold text-slate-700">数据导出与备份</h3>
      </div>

      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              type="button"
              key={btn.label}
              onClick={btn.onClick}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 md:py-2.5 font-medium text-sm transition-all shadow-sm hover:shadow ${btn.className}`}
            >
              <Icon size={18} className={Icon === Loader2 ? 'animate-spin' : ''} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
