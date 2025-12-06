import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Eye, Loader2 } from 'lucide-react';
import { useClinicId } from '../../../hooks/useClinicId';
import { api } from '../../../services/api';
import { Button } from '../../../components/Button';

interface Invoice {
  _id: string;
  invoice_number: string;
  patient_name: string;
  total_tnd: number;
  status: 'paid' | 'pending' | 'overdue';
  issued_at: string;
}

export const ClinicInvoicesList = () => {
  const clinicId = useClinicId();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    patient_name: '',
    amount: '',
    description: ''
  });

  const fetchInvoices = async () => {
    if (!clinicId) return;
    try {
      const data = await api.get<Invoice[]>(`/clinics/${clinicId}/invoices/`);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [clinicId]);

  const handleCreate = async () => {
    if (!clinicId || !newInvoice.patient_name || !newInvoice.amount) return;
    setCreating(true);
    try {
      await api.post(`/clinics/${clinicId}/invoices/create/`, {
        patient_name: newInvoice.patient_name,
        description: newInvoice.description || '',
        amount: parseFloat(newInvoice.amount),
        status: 'pending'
      });
      alert('Facture créée !');
      setShowCreate(false);
      setNewInvoice({ patient_name: '', amount: '', description: '' });
      fetchInvoices();
    } catch (e) {
      alert('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  if (!clinicId) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
          <h3 className="text-red-800 font-bold text-xl mb-2">Aucune clinique sélectionnée</h3>
          <p className="text-red-600">Connectez-vous en tant que staff ou entrez dans une clinique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Factures</h1>
        <Button onClick={() => setShowCreate(true)}><Plus size={20} className="mr-2"/>Nouvelle facture</Button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" size={40}/></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20 text-slate-400">Aucune facture pour le moment</div>
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => (
            <div key={inv._id} className="bg-white rounded-xl shadow p-6 flex justify-between items-center hover:shadow-lg transition">
              <div>
                <h3 className="font-bold text-lg">{inv.invoice_number}</h3>
                <p className="text-slate-600">{inv.patient_name} • {new Date(inv.issued_at).toLocaleDateString('fr')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{inv.total_tnd} TND</p>
                <span className={`px-3 py-1 rounded-full text-sm ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {inv.status === 'paid' ? 'Payée' : 'En attente'}
                </span>
              </div>
              <div className="flex gap-3">
                <a href={`/api/clinics/${clinicId}/invoices/${inv._id}/pdf/`} target="_blank" className="p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  <Download size={20}/>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full m-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Nouvelle facture</h2>
            <div className="space-y-5">
              <input placeholder="Nom du patient" className="w-full p-4 border rounded-xl" value={newInvoice.patient_name} onChange={e => setNewInvoice({...newInvoice, patient_name: e.target.value})}/>
              <textarea placeholder="Description" className="w-full p-4 border rounded-xl h-32" value={newInvoice.description} onChange={e => setNewInvoice({...newInvoice, description: e.target.value})}/>
              <input type="number" placeholder="Montant (TND)" className="w-full p-4 border rounded-xl" value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}/>
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleCreate} isLoading={creating} className="flex-1">Créer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};