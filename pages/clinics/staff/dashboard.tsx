// Updated staff/dashboard.tsx with API calls
import React, { useEffect, useState } from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { Users, Calendar, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { Button } from '../../../components/Button';
import { api } from '../../../services/api';

export const ClinicStaffDashboard = () => {
  const { currentClinic } = useClinic();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    todayAppointments: 0,
    activeDoctors: 0,
    revenueToday: 0
  });
  const [trafficData, setTrafficData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic) return;
      console.log("Fetching staff dashboard data for clinic:", currentClinic);
      try {
        // Active doctors
        const doctors = (await api.get(`/clinics/${currentClinic.id || currentClinic._id}/doctors/`)) as any[];
        const activeDoctors = doctors.length;

        // Pending requests
        const requests = (await api.get(`/clinics/${currentClinic.id || currentClinic._id}/requests/`)) as any[];
        const pendingRequests = requests.filter(r => r.status === 'pending').length;

        // Appointments
        const appointments = (await api.get(`/clinics/${currentClinic.id || currentClinic._id}/appointments/`)) as any[];
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(appt => appt.appointment_date.split('T')[0] === today).length;

        // Revenue today from invoices
        const invoices = (await api.get(`/clinics/${currentClinic.id || currentClinic._id}/invoices/`)) as any[];
        const revenueToday = invoices.reduce((sum, inv) => {
          if (inv.status === 'paid' && inv.issued_at.split('T')[0] === today) {
            return sum + inv.total_tnd;
          }
          return sum;
        }, 0);

        setStats({ pendingRequests, todayAppointments, activeDoctors, revenueToday });

        // Traffic data: last 7 days appointments count
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const dailyCounts = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(sevenDaysAgo);
          day.setDate(day.getDate() + i);
          const dayStr = day.toISOString().split('T')[0];
          const count = appointments.filter(appt => appt.appointment_date.split('T')[0] === dayStr).length;
          dailyCounts.push({ name: day.toLocaleDateString('fr-FR', { weekday: 'short' }), patients: count });
        }
        setTrafficData(dailyCounts);
      } catch (e) {
        console.error('Failed to fetch staff dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentClinic]);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau de Bord</h1>
            <p className="text-slate-500 mt-1">Gestion administrative - {currentClinic?.name}</p>
        </div>
        <div className="text-sm text-slate-400">
            Dernière mise à jour: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 font-medium text-sm">Demandes en attente</p>
                      <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingRequests}</h3>
                  </div>
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                      <AlertCircle size={24} />
                  </div>
              </div>
              <Link to="/clinic/dashboard/requests" className="text-orange-600 text-sm font-semibold hover:underline">Gérer les demandes</Link>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 font-medium text-sm">RDV Aujourd'hui</p>
                      <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.todayAppointments}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Calendar size={24} />
                  </div>
              </div>
              <Link to="/clinic/dashboard/appointments" className="text-blue-600 text-sm font-semibold hover:underline">Voir l'agenda</Link>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 font-medium text-sm">Médecins Affiliés</p>
                      <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.activeDoctors}</h3>
                  </div>
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                      <Users size={24} />
                  </div>
              </div>
              <Link to="/clinic/dashboard/doctors" className="text-teal-600 text-sm font-semibold hover:underline">Gérer l'équipe</Link>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 font-medium text-sm">Revenu du jour</p>
                      <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.revenueToday} <span className="text-lg font-normal text-slate-400">TND</span></h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                      <TrendingUp size={24} />
                  </div>
              </div>
              <Link to="/clinic/dashboard/invoices" className="text-green-600 text-sm font-semibold hover:underline">Voir factures</Link>
          </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                  <Activity className="text-teal-600" /> Trafic Historique (Semaine)
              </h3>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trafficData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f1f5f9' }}
                          />
                          <Bar dataKey="patients" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Users size={32} className="text-teal-700" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">Espace Collaboratif</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                  Gérez les permissions d'accès aux dossiers patients pour les {stats.activeDoctors} médecins affiliés à la clinique.
              </p>
              <Button className="mt-6" onClick={() => {}}>Gérer les accès</Button>
          </div>
      </div>
    </div>
  );
};