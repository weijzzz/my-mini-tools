import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, ArrowUpToLine } from 'lucide-react';
import Modal from './Modal';
import { moveItem } from '../../utils/sort';

const ACCENTS = {
  teal: { save: 'bg-teal-600 hover:bg-teal-700', preset: 'text-teal-700 bg-teal-50', drag: 'ring-teal-400' },
  sky: { save: 'bg-sky-600 hover:bg-sky-700', preset: 'text-sky-700 bg-sky-50', drag: 'ring-sky-400' },
};

/**
 * Reorder a list: drag the ≡ handle, or use 置顶 / ↑ / ↓.
 *
 * items:   [{ id, label, sublabel? }]
 * presets: [{ label, sort: (items) => items }] one-tap orders, e.g. A→Z
 * renderActions(item): optional extra buttons per row (rename, delete…)
 */
export default function ReorderModal({
  isOpen,
  onClose,
  title = '调整顺序',
  hint = '按住左侧 ≡ 拖动，或用右侧按钮移动',
  items,
  onSave,
  presets = [],
  renderActions,
  accent = 'teal',
}) {
  const colors = ACCENTS[accent] || ACCENTS.teal;
  const [order, setOrder] = useState(items);
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const drag = useRef(null);
  const listRef = useRef(null);

  // Start from the current order every time the sheet opens. Later prop
  // changes (e.g. a rename via renderActions) update labels, keeping the
  // order being edited.
  useEffect(() => {
    if (isOpen) setOrder(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    setOrder((prev) => {
      const byId = new Map(items.map((i) => [i.id, i]));
      const kept = prev.filter((i) => byId.has(i.id)).map((i) => byId.get(i.id));
      const added = items.filter((i) => !prev.some((p) => p.id === i.id));
      return [...kept, ...added];
    });
  }, [items, isOpen]);

  const move = (from, to) => setOrder((o) => moveItem(o, from, to));

  const onHandleDown = (e, index) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const row = e.currentTarget.closest('[data-row]');
    const rowH = (row?.getBoundingClientRect().height || 48) + 6; // + gap
    drag.current = { startY: e.clientY, index, rowH };
    setDragId(order[index].id);
    setDragOffset(0);
  };

  const onHandleMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const scroller = listRef.current?.closest('.overflow-y-auto');
    if (scroller) {
      // Scroll the sheet when dragging near its top or bottom edge.
      const box = scroller.getBoundingClientRect();
      if (e.clientY < box.top + 48) scroller.scrollTop -= 10;
      else if (e.clientY > box.bottom - 48) scroller.scrollTop += 10;
    }
    const steps = Math.round((e.clientY - d.startY) / d.rowH);
    const target = Math.max(0, Math.min(order.length - 1, d.index + steps));
    if (target !== d.index) {
      const from = d.index;
      setOrder((o) => moveItem(o, from, target));
      d.startY += (target - from) * d.rowH;
      d.index = target;
    }
    setDragOffset(e.clientY - d.startY);
  };

  const onHandleUp = () => {
    drag.current = null;
    setDragId(null);
    setDragOffset(0);
  };

  const handleSave = () => {
    onSave(order.map((i) => i.id));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <p className="text-xs text-slate-500 mb-3">{hint}</p>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setOrder((o) => p.sort(o))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colors.preset} active:scale-95 transition`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <ul ref={listRef} className="space-y-1.5 select-none">
        {order.map((item, index) => {
          const dragging = dragId === item.id;
          return (
            <li
              key={item.id}
              data-row
              className={`flex items-center gap-1 rounded-xl border bg-white pr-1 ${
                dragging ? `relative z-10 shadow-lg ring-2 ${colors.drag} border-transparent` : 'border-slate-200'
              }`}
              style={dragging ? { transform: `translateY(${dragOffset}px)` } : undefined}
            >
              <button
                type="button"
                aria-label={`拖动 ${item.label}`}
                onPointerDown={(e) => onHandleDown(e, index)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                className="p-3 text-slate-400 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <GripVertical size={18} />
              </button>
              <span className="w-6 text-xs text-slate-400 tabular-nums shrink-0">{index + 1}</span>
              <div className="flex-1 min-w-0 py-2">
                <div className="text-sm font-medium text-slate-800 truncate">{item.label}</div>
                {item.sublabel && <div className="text-[11px] text-slate-400 truncate">{item.sublabel}</div>}
              </div>
              {renderActions?.(item)}
              <button
                type="button"
                aria-label={`置顶 ${item.label}`}
                disabled={index === 0}
                onClick={() => move(index, 0)}
                className="p-2.5 text-slate-500 disabled:opacity-25 active:bg-slate-100 rounded-lg"
              >
                <ArrowUpToLine size={16} />
              </button>
              <button
                type="button"
                aria-label={`上移 ${item.label}`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                className="p-2.5 text-slate-500 disabled:opacity-25 active:bg-slate-100 rounded-lg"
              >
                <ChevronUp size={18} />
              </button>
              <button
                type="button"
                aria-label={`下移 ${item.label}`}
                disabled={index === order.length - 1}
                onClick={() => move(index, index + 1)}
                className="p-2.5 text-slate-500 disabled:opacity-25 active:bg-slate-100 rounded-lg"
              >
                <ChevronDown size={18} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-5 sm:-mx-6 mt-4 px-5 sm:px-6 pt-3 pb-1 bg-white border-t border-slate-100 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 active:bg-slate-200"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={`flex-[2] py-3 rounded-xl text-sm font-semibold text-white ${colors.save}`}
        >
          保存顺序
        </button>
      </div>
    </Modal>
  );
}
