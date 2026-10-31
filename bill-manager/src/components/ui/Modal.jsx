import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// Callers pass either a shorthand ("sm") or a full Tailwind class ("max-w-sm").
const WIDTHS = {
  xs: 'sm:max-w-xs',
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

function widthClass(maxWidth) {
  if (WIDTHS[maxWidth]) return WIDTHS[maxWidth];
  if (typeof maxWidth === 'string' && maxWidth.startsWith('max-w-')) return `sm:${maxWidth}`;
  return WIDTHS.md;
}

// Modals can stack (detail → edit → confirm). Track them so only the top one
// reacts to Escape and the page stays locked until the last one closes.
const openStack = [];

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) {
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const token = {};
    openStack.push(token);
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === token) {
        onCloseRef.current?.();
      }
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      const idx = openStack.indexOf(token);
      if (idx !== -1) openStack.splice(idx, 1);
      if (openStack.length === 0) document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4 animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`w-full ${widthClass(maxWidth)} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up flex flex-col max-h-[90dvh] sm:max-h-[85vh]`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
