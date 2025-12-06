
// src/components/layouts/ClinicStaffLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { ClinicHeader } from '../ClinicHeader';

export const ClinicStaffLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden ml-72 transition-all duration-300">
        {/* Header with Clinic Branding */}
        <ClinicHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
