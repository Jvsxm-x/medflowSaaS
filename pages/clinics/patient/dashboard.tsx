// Updated patient/dashboard.tsx with API calls
import React, { useEffect, useState } from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, FileText, CreditCard, Stethoscope, ArrowRight, Activity, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';

export const ClinicPatientDashboard = () => {
  const { currentClinic } = useClinic();
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState(null);
  const [lastDocument, setLastDocument] = useState(null);
  const [unpaidAmount, setUnpaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentClinic) return;
      try {
        // Fetch appointments
        const appointmentsResponse = await api.get(`/medical/appointments/?clinic_id=${currentClinic.id || currentClinic._id}`);
        const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : (appointmentsResponse as any)?.appointments || [];
        const now = new Date();
        const futureAppts = appointments.filter(appt => new Date(appt.appointment_date) > now);
        const sortedFuture = futureAppts.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
        setNextAppointment(sortedFuture[0] || null);

        // Fetch documents
        const docsResponse = await api.get(`/patient/documents/?clinic_id=${currentClinic.id || currentClinic._id}`);
        const documents = (docsResponse as any)?.documents || [];
        const sortedDocs = documents.sort((a, b) => new Date((b as any).uploaded_at).getTime() - new Date((a as any).uploaded_at).getTime());
        setLastDocument(sortedDocs[0] || null);

        // Fetch invoices
        const invoicesResponse = await api.get(`/clinics/${currentClinic.id || currentClinic._id}/invoices/`);
        const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : (invoicesResponse as any)?.invoices || [];
        const unpaid = invoices.reduce((sum, inv) => (inv as any).status !== 'paid' ? sum + (inv as any).total_tnd : sum, 0);
        setUnpaidAmount(unpaid);
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentClinic]);

  if (!currentClinic || loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-3xl p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
                 <img 
                    src={currentClinic.logo_url || 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png'} 
                    alt="Logo" 
                    className="w-16 h-16 bg-white rounded-2xl p-2 shadow-sm"
                 />
                 <div>
                    <h1 className="text-3xl font-bold">Bienvenue chez {currentClinic.name}</h1>
                    <p className="text-teal-100 text-lg">Espace Patient de {user?.first_name} {user?.last_name}</p>
                 </div>
            </div>
            <p className="max-w-2xl opacity-90 leading-relaxed">
                Accédez à vos dossiers médicaux, prenez rendez-vous avec nos spécialistes et gérez vos factures en toute simplicité directement depuis cet espace sécurisé.
            </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
             <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                     <Calendar size={24} />
                 </div>
                 <span className="text-slate-500 font-medium">Prochain RDV</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">
               {nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Aucun'}
             </h3>
             <Link to="/clinic/patient/book" className="text-blue-600 text-sm font-semibold mt-2 inline-flex items-center gap-1 hover:underline">
                Prendre rendez-vous <ArrowRight size={14} />
             </Link>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
             <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                     <FileText size={24} />
                 </div>
                 <span className="text-slate-500 font-medium">Dernier Document</span>
             </div>
             <h3 className="text-xl font-bold text-slate-900">{lastDocument ? lastDocument.title : 'Aucun'}</h3>
             <p className="text-xs text-slate-400">
               {lastDocument ? new Date(lastDocument.uploaded_at).toLocaleDateString('fr-FR') : ''}
             </p>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
             <div className="flex items-center gap-4 mb-2">
                 <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                     <CreditCard size={24} />
                 </div>
                 <span className="text-slate-500 font-medium">Factures</span>
             </div>
             <h3 className="text-2xl font-bold text-slate-900">{unpaidAmount} TND</h3>
             <span className={`text-xs font-bold px-2 py-1 rounded-full ${unpaidAmount === 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
               {unpaidAmount === 0 ? 'Tout est payé' : 'En attente'}
             </span>
         </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
         <Activity className="text-teal-600" /> Actions Rapides
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/clinic/patient/book" className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-500 transition-all duration-300">
              <Calendar className="text-slate-400 group-hover:text-teal-600 mb-4 transition-colors" size={32} />
              <h3 className="font-bold text-slate-800">Prendre RDV</h3>
              <p className="text-sm text-slate-500 mt-1">Consultez nos disponibilités</p>
          </Link>

          <Link to="/clinic/patient/doctors" className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 transition-all duration-300">
              <Stethoscope className="text-slate-400 group-hover:text-blue-600 mb-4 transition-colors" size={32} />
              <h3 className="font-bold text-slate-800">Nos Médecins</h3>
              <p className="text-sm text-slate-500 mt-1">Découvrez nos spécialistes</p>
          </Link>

          <Link to="/clinic/patient/records" className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-500 transition-all duration-300">
              <FileText className="text-slate-400 group-hover:text-purple-600 mb-4 transition-colors" size={32} />
              <h3 className="font-bold text-slate-800">Mes Dossiers</h3>
              <p className="text-sm text-slate-500 mt-1">Résultats et ordonnances</p>
          </Link>

          <Link to="/clinic/patient/invoices" className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-orange-500 transition-all duration-300">
              <CreditCard className="text-slate-400 group-hover:text-orange-600 mb-4 transition-colors" size={32} />
              <h3 className="font-bold text-slate-800">Paiements</h3>
              <p className="text-sm text-slate-500 mt-1">Historique de facturation</p>
          </Link>
      </div>
    </div>
  );
};