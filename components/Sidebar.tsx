// src/components/Sidebar.tsx → VERSION FINALE 100% FONCTIONNELLE
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import {
  LayoutDashboard,
  BrainCircuit,
  UserCircle,
  LogOut,
  ClipboardList,
  Users,
  CalendarDays,
  Settings,
  ShieldCheck,
  TestTube,
  FileCheck,
  CreditCard,
  Stethoscope,
  Building2,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { ROUTES } from '../constants';

export const Sidebar = () => {
  const { user, role } = useAuth();
  const { currentClinic, exitClinic } = useClinic();
  const navigate = useNavigate();
  const location = useLocation();
const logout = useAuth().logout;
  const isInClinicMode = !!currentClinic;

  // COULEURS DYNAMIQUES
  const getGradient = () => {
    if (isInClinicMode && currentClinic?.primary_color) {
      return `from-[${currentClinic.primary_color}] to-[${currentClinic.secondary_color || currentClinic.primary_color + 'cc'}]`;
    }
    switch (role) {
      case 'doctor': return 'from-blue-500 to-indigo-600';
      case 'admin': return 'from-amber-500 to-orange-600';
      case 'clinic_staff':
      case 'clinic_admin': return 'from-purple-600 to-pink-600';
      default: return 'from-teal-500 to-cyan-500';
    }
  };

  const gradient = getGradient();

  // LIENS SELON LE RÔLE
  const getLinks = () => {
    // ADMIN — TOUS LES LIENS
    if (role === 'admin') {
      return [
        { to: '/v1/portal/admin/dashboard', label: 'Dashboard Général', icon: LayoutDashboard },
        { to: '/v1/portal/admin/users', label: 'Utilisateurs', icon: Users },
        { to: '/v1/portal/admin/clinics', label: 'Cliniques', icon: Building2 },
        { to: '/v1/portal/admin/doctors', label: 'Médecins', icon: Stethoscope },
        { to: '/v1/portal/admin/patients', label: 'Patients', icon: Users },
        { to: '/v1/portal/admin/appointments', label: 'Rendez-vous', icon: CalendarDays },
        { to: '/v1/portal/admin/plans', label: 'Plans & Tarifs', icon: CreditCard },
        { to: '/v1/portal/admin/payments', label: 'Paiements', icon: CreditCard },
        { to: '/v1/portal/admin/settings', label: 'Paramètres Système', icon: Settings },
      ];
    }

    // CLINIC STAFF
    if (role === 'clinic_staff' || role === 'clinic_admin') {
      return [
        { to: '/clinic/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { to: '/clinic/dashboard/requests', label: 'Demandes patients', icon: ClipboardList },
        { to: '/clinic/dashboard/doctors', label: 'Nos médecins', icon: Users },
        { to: '/clinic/dashboard/invoices', label: 'Factures', icon: CreditCard },
        { to: '/clinic/dashboard/appointments', label: 'Rendez-vous', icon: CalendarDays },
        { to: '/clinic/dashboard/settings', label: 'Paramètres', icon: Settings },
      ];
    }

    // DOCTOR
    if (role === 'doctor') {
      return [
        { to: '/doctor/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { to: '/doctor/patients', label: 'Patients', icon: Users },
        { to: '/doctor/orders', label: 'Analyses', icon: TestTube },
        { to: '/doctor/reviews', label: 'Documents', icon: FileCheck },
        { to: '/doctor/appointments', label: 'Agenda', icon: CalendarDays },
        { to: '/doctor/profile', label: 'Profil', icon: Settings },
      ];
    }

    // PATIENT — EN MODE CLINIQUE
    if (isInClinicMode) {
      return [
        { to: '/clinic/patient/dashboard', label: 'Accueil Clinique', icon: LayoutDashboard },
        { to: '/clinic/patient/doctors', label: 'Nos médecins', icon: Users },
        { to: '/clinic/patient/book', label: 'Prendre RDV', icon: CalendarDays },
        { to: '/clinic/patient/records', label: 'Mes données', icon: Activity },
        { to: '/clinic/patient/invoices', label: 'Factures', icon: CreditCard },
      ];
    }

    // PATIENT — MODE NORMAL
    return [
      { to: ROUTES.DASHBOARD, label: 'Accueil', icon: LayoutDashboard },
      { to: ROUTES.MEDICAL_DATA, label: 'Mes mesures', icon: Activity },
      { to: ROUTES.ANALYSIS, label: 'Analyse IA', icon: BrainCircuit },
      { to: ROUTES.DOCUMENTS, label: 'Documents', icon: FileCheck },
      { to: ROUTES.APPOINTMENTS, label: 'Rendez-vous', icon: CalendarDays },
      { to: 'clinics/recommended', label: 'Cliniques', icon: Building2 },
      { to: 'doctors/best', label: 'Médecins', icon: Stethoscope },
      { to: ROUTES.PROFILE, label: 'Profil', icon: UserCircle },
    ];
  };

  const links = getLinks();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleExitClinic = () => {
    exitClinic(); // Nettoie le contexte + localStorage
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-72 bg-slate-900 text-white h-screen fixed left-0 top-0 z-50 flex flex-col overflow-y-auto">
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800">
        {isInClinicMode ? (
          <div className="flex items-center gap-4">
            <img
              src={currentClinic?.logo_url || '/default-clinic.png'}
              alt={currentClinic?.name}
              className="w-16 h-16 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
            />
            <div>
              <h1 className="text-2xl font-bold line-clamp-1">{currentClinic?.name}</h1>
              <p className="text-cyan-300 text-sm font-medium">Espace Patient</p>
            </div>
          </div>
        ) : (
          <>
            <h1 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
              Dawini
            </h1>
            <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-medium">
              {role === 'patient' ? 'Patient' : role === 'admin' ? 'Admin' : role} Portal
            </p>
          </>
        )}
      </div>

      {/* RETOUR SI EN MODE CLINIQUE (patient uniquement) */}
      {isInClinicMode && role === 'patient' && (
        <div className="px-6 py-4 bg-slate-800/60">
          <button
            onClick={handleExitClinic}
            className="flex items-center gap-3 text-cyan-300 hover:text-white transition-all font-medium text-lg"
          >
            <ArrowLeft size={22} />
            Retour à mon compte
          </button>
        </div>
      )}

      {/* MENU */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                active
                  ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-2xl font-bold border border-white/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-lg font-medium">{link.label}</span>
              {active && (
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 to-teal-500 rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER INFO + LOGOUT */}
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold bg-gradient-to-br ${gradient} text-white shadow-xl`}>
            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-slate-400 capitalize">
              {isInClinicMode && role === 'patient'
                ? `Patient @ ${currentClinic?.name}`
                : role === 'admin'
                ? 'Administrateur'
                : role}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-2xl font-bold text-lg transition-all hover:scale-105"
        >
          <LogOut size={22} />
          Déconnexion
        </button>
      </div>
    </div>
  );
};
