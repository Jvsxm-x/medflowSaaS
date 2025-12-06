// src/components/ClinicHeader.tsx
import { useClinic } from '../context/ClinicContext';
import { Bell, Settings } from 'lucide-react';

export const ClinicHeader = () => {
  const { currentClinic } = useClinic();
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <img src={currentClinic?.logo} alt="" className="w-10 h-10 rounded-lg" />
        <h2 className="text-xl font-bold">{currentClinic?.name} - Espace Staff</h2>
      </div>
      <div className="flex items-center gap-4">
        <button><Bell size={20} /></button>
        <button><Settings size={20} /></button>
      </div>
    </header>
  );
};