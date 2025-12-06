
// src/pages/clinic/staff/InvoicesList.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Eye, Filter, Loader2, CreditCard, DollarSign } from 'lucide-react';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';
import { Button } from '../../../components/Button';

interface Invoice {
    id: string;
    _id?: string;
    invoice_number: string;
    patient_name: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    issued_at: string;
    description?: string;
}

export const ClinicInvoicesList = () => {
  const { currentClinic } = useClinic();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
      patient_name: '',
      amount: '',
      description: ''
  });

  const fetchInvoices = async () => {
      if (!currentClinic) return;
      try {
          const data = await api.get<Invoice[]>(`/clinics/${currentClinic.id || currentClinic._id}/invoices/`);
          setInvoices(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchInvoices();
  }, [currentClinic]);

  const handleCreate = async () => {
      if (!currentClinic || !newInvoice.patient_name || !newInvoice.amount) return;
      setCreating(true);
      try {
          // Updated to use /create/ as per endpoint specification
          await api.post(`/clinics/${currentClinic.id || currentClinic._id}/invoices/create/`, {
              ...newInvoice,
              amount: parseFloat(newInvoice.amount),
              status: 'pending',
              issued_at: new Date().toISOString()
          });
          alert("Facture créée avec succès !");
          setShowCreate(false);
          setNewInvoice({ patient_name: '', amount: '', description: '' });
          fetchInvoices();
      } catch (e) {
          alert("Erreur lors de la création de la facture.");
      } finally {
          setCreating(false);
      }
  };

  const totalRevenue = invoices.reduce((sum, inv) => inv.status === 'paid' ? sum + inv.amount : sum, 0);
  const pendingAmount = invoices.reduce((sum, inv) => inv.status === 'pending' ? sum + inv.amount : sum, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Facturation</h1>
            <p className="text-slate-500">Gérez les paiements et factures patients</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                <Plus size={20} className="mr-2" /> Nouvelle facture
            </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                      <DollarSign size={24} />
                  </div>
                  <div>
                      <p className="text-slate-500 text-sm font-medium">Revenu Total</p>
                      <h3 className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} TND</h3>
                  </div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                      <CreditCard size={24} />
                  </div>
                  <div>
                      <p className="text-slate-500 text-sm font-medium">En attente</p>
                      <h3 className="text-2xl font-bold text-slate-900">{pendingAmount.toLocaleString()} TND</h3>
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input type="text" placeholder="Rechercher une facture..." className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <button className="px-4 py-3 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-50 text-slate-600 font-medium transition-colors w-full md:w-auto justify-center">
            <Filter size={18} /> Filtres
          </button>
        </div>

        {loading ? (
            <div className="p-12 text-center text-slate-500 flex justify-center">
                <Loader2 className="animate-spin" />
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                    <th className="text-left p-6">N° Facture</th>
                    <th className="text-left p-6">Patient</th>
                    <th className="text-left p-6">Date</th>
                    <th className="text-left p-6">Montant</th>
                    <th className="text-left p-6">Statut</th>
                    <th className="text-right p-6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {invoices.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune facture trouvée.</td></tr>
                    ) : (
                        invoices.map((inv) => (
                            <tr key={inv.id || inv._id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 font-medium text-slate-900">{inv.invoice_number}</td>
                                <td className="p-6 text-slate-600">{inv.patient_name}</td>
                                <td className="p-6 text-slate-500">{new Date(inv.issued_at).toLocaleDateString('fr-FR')}</td>
                                <td className="p-6 font-bold text-slate-900">{inv.amount} TND</td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {inv.status === 'paid' ? 'Payée' : inv.status === 'overdue' ? 'En retard' : 'En attente'}
                                    </span>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"><Eye size={18} /></button>
                                        <button className="p-2 hover:bg-slate-200 rounded-lg text-teal-600 transition-colors"><Download size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Nouvelle facture</h2>
            <div className="space-y-5">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom du patient</label>
                  <input 
                    type="text" 
                    placeholder="Rechercher ou saisir nom..." 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    value={newInvoice.patient_name}
                    onChange={e => setNewInvoice({...newInvoice, patient_name: e.target.value})}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description des actes</label>
                  <textarea 
                    placeholder="Consultation, Analyse..." 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                    value={newInvoice.description}
                    onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}
                  ></textarea>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Montant total (TND)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    value={newInvoice.amount}
                    onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                  />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleCreate} isLoading={creating} className="flex-1">Créer la facture</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
