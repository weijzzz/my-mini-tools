import React, { useState, useMemo } from 'react';
import {
  Pencil,
  Trash2,
  FileX,
  ArrowRight,
  Save,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { evaluateAmount, formatEuro, isAllowedAmountInput } from '../../utils/amount';

export default function BillList({ bills = [], limit, showTitle = true }) {
  const { categories, suppliers, updateBill, deleteBill } = useStore();

  const [editingBill, setEditingBill] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // Sort bills by date desc, then by createdAt desc
  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      // createdAt is an ISO string, so compare it as text (newest first).
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });
  }, [bills]);

  const displayBills =
    limit && !showAll ? sortedBills.slice(0, limit) : sortedBills;
  const hasMore = limit && sortedBills.length > limit;

  // Edit handlers
  const openEdit = (bill) => {
    setEditingBill(bill);
    setEditForm({
      amount: String(bill.amount),
      category: bill.category,
      date: bill.date,
      note: bill.note || '',
      supplierId: bill.supplierId,
    });
  };

  const handleEditChange = (field, value) => {
    if (field === 'amount') {
      if (isAllowedAmountInput(value)) {
        setEditForm((f) => ({ ...f, [field]: value }));
      }
      return;
    }
    setEditForm((f) => ({ ...f, [field]: value }));
  };

  const saveEdit = () => {
    if (!editingBill) return;
    const supplier = suppliers.find((s) => s.id === editForm.supplierId);
    const amount = evaluateAmount(editForm.amount);
    if (!(amount > 0)) return;
    updateBill(editingBill.id, {
      amount,
      category: editForm.category,
      date: editForm.date,
      note: editForm.note.trim(),
      supplierId: editForm.supplierId,
      supplierName: supplier?.name || editingBill.supplierName,
    });
    setEditingBill(null);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteBill(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const formatAmount = formatEuro;

  if (sortedBills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <FileX className="w-12 h-12 mb-3 text-slate-300" strokeWidth={1.2} />
        <p className="text-sm font-medium">暂无账单记录</p>
      </div>
    );
  }

  return (
    <div>
      {showTitle && (
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          账单列表
        </h3>
      )}

      {/* ===== Desktop Table ===== */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-left">
              <th className="px-4 py-3 font-medium">日期</th>
              <th className="px-4 py-3 font-medium">供货商</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium text-right">金额</th>
              <th className="px-4 py-3 font-medium">备注</th>
              <th className="px-4 py-3 font-medium text-center w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayBills.map((bill, idx) => (
              <tr
                key={bill.id}
                className={`transition-colors hover:bg-slate-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {bill.date}
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium">
                  {bill.supplierName}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                    {bill.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-teal-600 whitespace-nowrap">
                  {formatAmount(bill.amount)}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                  {bill.note || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(bill)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md cursor-pointer transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(bill)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile Cards ===== */}
      <div className="md:hidden space-y-2">
        {displayBills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-1.5"
          >
            {/* Top line: supplier + amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800 truncate mr-2">
                {bill.supplierName}
              </span>
              <span className="text-base font-bold text-teal-600 whitespace-nowrap">
                {formatAmount(bill.amount)}
              </span>
            </div>
            {/* Second line: category + date */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                {bill.category}
              </span>
              <span>{bill.date}</span>
            </div>
            {/* Third line: note + actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 truncate min-w-0 flex-1">
                {bill.note || ''}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => openEdit(bill)}
                  aria-label="编辑"
                  className="p-2.5 -my-1 text-slate-400 active:text-teal-600 active:bg-teal-50 rounded-lg cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(bill)}
                  aria-label="删除"
                  className="p-2.5 -my-1 -mr-2 text-slate-400 active:text-red-500 active:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show All Link */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          type="button"
          className="flex items-center gap-1 mt-4 mx-auto px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer transition-colors"
        >
          查看全部
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* ===== Edit Modal ===== */}
      <Modal
        isOpen={!!editingBill}
        onClose={() => setEditingBill(null)}
        title="编辑账单"
        maxWidth="lg"
      >
        {editingBill && (
          <div className="space-y-4">
            {/* Supplier Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                供货商
              </label>
              <select
                value={editForm.supplierId}
                onChange={(e) => handleEditChange('supplierId', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-white"
              >
                {/* Keep a bill's deleted supplier selectable instead of
                    silently showing (and saving) a different one. */}
                {!suppliers.some((s) => s.id === editForm.supplierId) && (
                  <option value={editForm.supplierId}>
                    {editingBill.supplierName}（已删除）
                  </option>
                )}
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                金额
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={editForm.amount}
                onChange={(e) => handleEditChange('amount', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                分类
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleEditChange('category', cat)}
                    className={`rounded-lg p-2 text-sm font-medium transition-all cursor-pointer ${
                      editForm.category === cat
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                日期
              </label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => handleEditChange('date', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                备注
              </label>
              <input
                type="text"
                value={editForm.note}
                onChange={(e) => handleEditChange('note', e.target.value)}
                placeholder="备注/账单号（选填）"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 placeholder:text-slate-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={!(evaluateAmount(editForm.amount) > 0) || !editForm.category || !editForm.date}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                保存修改
              </button>
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="删除账单"
        message={`确定要删除该笔 ${formatAmount(deleteTarget?.amount || 0)} 的账单吗？此操作不可撤销。`}
      />
    </div>
  );
}
