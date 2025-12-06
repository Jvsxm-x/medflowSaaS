// src/components/admin/ScrollableModal.tsx → Nouveau modal scrollable
import { X } from 'lucide-react';
import React from 'react';

interface ScrollableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const ScrollableModal = ({ isOpen, onClose, title, children, footer, width = 'lg' }: ScrollableModalProps) => {
  if (!isOpen) return null;

  const widthClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[width];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden m-4" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 transition">
            <X size={24} />
          </button>
        </div>
        <div className={`max-h-[60vh] overflow-y-auto p-6 ${widthClass}`}>
          {children}
        </div>
        {footer && (
          <div className="p-6 border-t border-slate-200 flex justify-end gap-4 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};