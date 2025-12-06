// src/pages/doctor/DoctorDashboard.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Appointment {
  _id: string;
  patient_username: string;
  patient_name?: string;
  appointment_date: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface DashboardStats {
  patient_count: number;
  today_appointments: number;
  pending_lab_orders: number;
  pending_documents: number;
}

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // 1. Stats du docteur
        const statsRes = await api.get<DashboardStats>('/doctor/dashboard/');
        setStats(statsRes);

        // 2. Prochains RDV (5)
        const apptsRes = await api.get<{ appointments: Appointment[] }>('/medical/appointments/?limit=5&upcoming=true');
        setUpcomingAppointments(apptsRes.appointments || []);
      } catch (err) {
        console.error("Erreur chargement dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
        <p className="mt-4 text-slate-600">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900">
          Bonjour, Dr. {user?.first_name || user?.username?.split('@')[0]}
        </h1>
        <p className="text-lg text-slate-600 mt-2">Voici votre activité du jour</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Patients suivis</p>
              <p className="text-4xl font-bold mt-2">{stats?.patient_count || 0}</p>
            </div>
            <Users size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">RDV aujourd'hui</p>
              <p className="text-4xl font-bold mt-2">{stats?.today_appointments || 0}</p>
            </div>
            <Calendar size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Analyses en attente</p>
              <p className="text-4xl font-bold mt-2">{stats?.pending_lab_orders || 0}</p>
            </div>
            <Clock size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Documents à valider</p>
              <p className="text-4xl font-bold mt-2">{stats?.pending_documents || 0}</p>
            </div>
            <CheckCircle size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-xl mb-10">
        <h3 className="text-2xl font-bold mb-6">Actions rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/doctor/patients"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all flex items-center justify-between group"
          >
            <span className="font-medium">Voir mes patients</span>
            <ArrowRight className="group-hover:translate-x-2 transition" />
          </Link>
          <Link
            to="/doctor/appointments"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all flex items-center justify-between group"
          >
            <span className="font-medium">Gérer les RDV</span>
            <ArrowRight className="group-hover:translate-x-2 transition" />
          </Link>
          <Link
            to="/doctor/lab-orders"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all flex items-center justify-between group"
          >
            <span className="font-medium">Prescrire une analyse</span>
            <ArrowRight className="group-hover:translate-x-2 transition" />
          </Link>
          <Link
            to="/doctor/document-reviews"
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-xl transition-all flex items-center justify-between group"
          >
            <span className="font-medium">Valider documents</span>
            <ArrowRight className="group-hover:translate-x-2 transition" />
          </Link>
        </div>
      </div>

      {/* Prochains RDV */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-800">Prochains rendez-vous</h3>
          <Link to="/doctor/appointments" className="text-teal-600 font-medium hover:underline flex items-center gap-1">
            Voir tout <ArrowRight size={18} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {upcomingAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun rendez-vous prévu pour le moment</p>
              <p className="text-sm text-slate-400 mt-2">Profitez-en pour vous reposer</p>
            </div>
          ) : (
            upcomingAppointments.map((appt) => (
              <div
                key={appt._id}
                className="px-8 py-6 hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="bg-teal-100 p-4 rounded-full">
                    <Clock className="text-teal-600" size={28} />
                  </div>
                  <div>
                    <p className="font-bold text-xl text-slate-900">
                      {appt.patient_name || appt.patient_username}
                    </p>
                    <p className="text-slate-600 capitalize">
                      {formatDate(appt.appointment_date)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1 italic">Motif : {appt.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                    appt.status === 'scheduled' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {appt.status === 'scheduled' ? 'Prévu' : 'Terminé'}
                  </span>
                  <Link
                    to={`/doctor/patients/${appt.patient_username}`}
                    className="text-teal-600 hover:bg-teal-50 p-3 rounded-full transition"
                    title="Voir le dossier patient"
                  >
                    <ArrowRight size={22} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};