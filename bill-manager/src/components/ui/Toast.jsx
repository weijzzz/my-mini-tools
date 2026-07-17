import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const typeConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    iconColor: 'text-rose-500',
  },
  info: {
    icon: Info,
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-800',
    iconColor: 'text-teal-500',
  },
};

export default function Toast({ message, type = 'info', isVisible, onClose }) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-[60] animate-in slide-in-from-top fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${config.bg} ${config.border}`}
      >
        <Icon size={20} className={`flex-shrink-0 ${config.iconColor}`} />
        <span className={`text-sm font-medium ${config.text}`}>{message}</span>
        <button
          onClick={onClose}
          className={`ml-2 flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
