
// ClinicPatientInvoices.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { useClinic } from '../../../context/ClinicContext';
import { Download, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../../constants';

interface Invoice {
  _id: string;
  invoice_number: string;
  total_tnd: number;
  status: string;
  issued_at: string;
}

export const ClinicPatientInvoices = () => {
  const { currentClinic } = useClinic();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (currentClinic) {
        api.get<Invoice[]>(`/clinics/${currentClinic.id || currentClinic._id}/invoices/`)
        .then(setInvoices)
        .catch(err => console.error(err));
    }
  }, [currentClinic]);

  const handleDownload = async (invoiceId: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clinics/${currentClinic?.id || currentClinic?._id}/invoices/${invoiceId}/pdf/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (e) {
        alert("Impossible de télécharger la facture. Veuillez réessayer plus tard.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Mes factures</h1>

      <div className="space-y-4">
        {invoices.length === 0 ? (
            <p className="text-slate-500 italic">Aucune facture disponible.</p>
        ) : (
            invoices.map((inv) => (
            <div key={inv._id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                <h3 className="font-bold text-lg text-slate-800">Facture {inv.invoice_number}</h3>
                <p className="text-slate-500 text-sm">Émise le {new Date(inv.issued_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right w-full sm:w-auto">
                <p className="text-2xl font-bold text-slate-900">{inv.total_tnd} TND</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {inv.status === 'paid' ? 'Payée' : 'En attente'}
                </span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button className="p-3 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                    <Eye size={20} />
                </button>
                <button 
                    onClick={() => handleDownload(inv._id)}
                    className="p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                    title="Télécharger PDF"
                >
                    <Download size={20} />
                </button>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};
