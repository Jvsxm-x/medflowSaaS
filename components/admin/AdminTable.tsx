// src/components/admin/AdminTable.tsx → Nouveau composant table réutilisable
import { Edit, Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '../Button';

interface AdminTableProps<T> {
  data: T[];
  columns: { key: keyof T; label: string; render?: (value: any, row: T) => React.ReactNode }[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  className?: string;
}

export const AdminTable = <T extends { _id: string }>({ data, columns, onEdit, onDelete, className = '' }: AdminTableProps<T>) => {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <table className="w-full divide-y divide-slate-200">
        <thead className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <tr>
            {columns.map(col => (
              <th key={col.key as string} className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-slate-50 transition-colors">
              {columns.map(col => (
                <td key={col.key as string} className="px-6 py-4 text-sm text-slate-900">
                  {col.render ? col.render(row[col.key], row) : row[col.key] as string}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 text-right space-x-3">
                  {onEdit && <Button variant="secondary" onClick={() => onEdit(row)}><Edit size={16} /></Button>}
                  {onDelete && <Button variant="danger" onClick={() => onDelete(row)}><Trash2 size={16} /></Button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};