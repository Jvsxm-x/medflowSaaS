import React, { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, Calendar, Ban, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { User } from '../../types';

export const PatientsManagement = () => {
  const [patients, setPatients] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const data = await api.get<User[]>('/patients/');
      // Filtrer pour n'avoir que les patients
      const patientUsers = data.filter(user => user.role === 'patient');
      setPatients(patientUsers);
      setFiltered(patientUsers);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term)
      )
    );
  }, [search, patients]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.patch(`/admin/users/${id}/`, { is_active: !current });
      fetchPatients();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la modification');
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4">
          <Users className="text-teal-600" size={40} />
          Gestion des Patients
        </h1>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          className="w-full pl-12 pr-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((patient) => (
          <div
            key={patient._id}
            className={`bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 ${!patient.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${patient.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {patient.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {patient.first_name} {patient.last_name}
            </h3>

            <div className="space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Mail size={16} /> {patient.email}
              </p>
              {patient.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={16} /> {patient.phone}
                </p>
              )}
              {patient.birth_date && (
                <p className="flex items-center gap-2">
                  <Calendar size={16} /> Né(e) le {new Date(patient.birth_date).toLocaleDateString('fr-FR')}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-4">
                Inscrit le {new Date(patient.date_joined).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="mt-8">
              <Button
                variant={patient.is_active ? "danger" : "primary"}
                onClick={() => toggleActive(patient._id, patient.is_active)}
                className="w-full py-4 text-lg font-bold rounded-xl"
              >
{
  patient.is_active
    ? (
        <>
          <Ban size={20} className="mr-2" />
          Désactiver
        </>
      )
    : (
        <>
          <CheckCircle size={20} className="mr-2" />
          Activer
        </>
      )
}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};