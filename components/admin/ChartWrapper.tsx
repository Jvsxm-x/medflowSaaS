// src/components/admin/ChartWrapper.tsx → Nouveau pour les charts
import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ChartWrapper = ({ children, height = 300, className = '' }: ChartWrapperProps) => {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
};