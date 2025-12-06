// src/components/admin/AdminCard.tsx → Nouveau composant réutilisable
import React from 'react';

interface AdminCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const AdminCard = ({ title, children, icon, className = '', footer }: AdminCardProps) => {
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}>
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          {icon}
          {title}
        </h3>
        {footer && <div className="text-sm text-slate-500">{footer}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};