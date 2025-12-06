// src/pages/patient/MedicalData.tsx

import React, { useEffect, useState } from 'react';
import { Activity, Plus, Heart, Droplet, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants';

interface MedicalRecord {
  _id?: string;
  id?: string;
  systolic: number;
  diastolic: number;
  glucose: number;
  heart_rate: number;
  notes?: string;
  recorded_at: string;
  patient?: string | number;
}

export const MedicalData = () => {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    glucose: '',
    heart_rate: '',
    notes: '',
  });

  const fetchRecords = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/records/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const sorted = (data || []).sort((a: any, b: any) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      setRecords(sorted);
    } catch (e) {
      console.error('Erreur chargement données médicales', e);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleOpenModal = (record?: MedicalRecord) => {
    if (record) {
      setEditingId(record._id || record.id?.toString() || null);
      setFormData({
        systolic: record.systolic.toString(),
        diastolic: record.diastolic.toString(),
        glucose: record.glucose.toString(),
        heart_rate: record.heart_rate.toString(),
        notes: record.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({ systolic: '', diastolic: '', glucose: '', heart_rate: '', notes: '' });
    }
    setIsModalOpen(true);
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!token) return;

  setIsLoading(true);
  const payload = {
    systolic: parseFloat(formData.systolic),
    diastolic: parseFloat(formData.diastolic),
    glucose: parseFloat(formData.glucose),
    heart_rate: parseFloat(formData.heart_rate),
    notes: formData.notes || undefined,
    recorded_at: new Date().toISOString(),
  };

  try {
    let res;
    let newRecord;

    if (editingId) {
      res = await fetch(`${API_BASE_URL}/records/${editingId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API_BASE_URL}/records/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    }

    // Accepte 200 (PUT) et 201 (POST)
    if (res.status === 200 || res.status === 201) {
      newRecord = await res.json();

      setRecords(prev => {
        if (editingId) {
          return prev.map(r =>
            (r._id || r.id?.toString()) === editingId ? newRecord : r
          );
        }
        return [newRecord, ...prev];
      });

      setIsModalOpen(false);
      setFormData({ systolic: '', diastolic: '', glucose: '', heart_rate: '', notes: '' });
    } else {
      const error = await res.json();
      alert(error.detail || error.error || `Erreur ${res.status}`);
    }
  } catch (e) {
    console.error(e);
    alert('Erreur réseau. Vérifiez votre connexion.');
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette mesure ?')) return;
    try {
      await fetch(`${API_BASE_URL}/records/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setRecords(prev => prev.filter(r => (r._id || r.id?.toString()) !== id));
    } catch (e) {
      alert('Impossible de supprimer');
    }
  };

  // Données pour les graphiques (ordre croissant)
  const chartData = [...records]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(r => ({
      date: new Date(r.recorded_at).toLocaleDateString('fr-FR'),
      systolic: r.systolic,
      diastolic: r.diastolic,
      glucose: r.glucose,
      hr: r.heart_rate,
    }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Mes Mesures Vitales</h2>
          <p className="text-slate-600 mt-1">Suivi tension, glycémie, pouls</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-teal-600 hover:bg-teal-700">
          <Plus size={18} className="mr-2" /> Ajouter une mesure
        </Button>
      </div>

      {/* Graphiques */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Activity className="text-red-500" /> Tension Artérielle
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[60, 200]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolique" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolique" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Droplet className="text-amber-500" /> Glycémie & Pouls
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="glucose" stroke="#eab308" name="Glucose (mg/dL)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="hr" stroke="#ec4899" name="Pouls (bpm)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-200">
          <AlertCircle size={48} className="mx-auto text-blue-500 mb-4" />
          <p className="text-xl text-slate-700">Aucune mesure enregistrée</p>
          <p className="text-slate-600 mt-2">Commencez par ajouter votre première mesure</p>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tension</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Glucose</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Pouls</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Notes</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(rec => (
              <tr key={rec._id || rec.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm">{new Date(rec.recorded_at).toLocaleString('fr-FR')}</td>
                <td className="px-6 py-4 font-medium">{rec.systolic}/{rec.diastolic}</td>
                <td className="px-6 py-4">{rec.glucose}</td>
                <td className="px-6 py-4">{rec.heart_rate}</td>
                <td className="px-6 py-4 text-sm text-slate-600 italic">{rec.notes || '—'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(rec)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(rec._id || rec.id!.toString())} className="text-red-600 hover:bg-red-50 p-2 rounded">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Aucune mesure pour le moment
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingId ? 'Modifier' : 'Nouvelle'} mesure
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Systolique</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={formData.systolic}
                    onChange={e => setFormData({ ...formData, systolic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Diastolique</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={formData.diastolic}
                    onChange={e => setFormData({ ...formData, diastolic: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={formData.glucose}
                    onChange={e => setFormData({ ...formData, glucose: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pouls (bpm)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={formData.heart_rate}
                    onChange={e => setFormData({ ...formData, heart_rate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};