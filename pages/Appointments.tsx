// src/pages/Appointments.tsx → VERSION FIXÉE & INDESTRUCTIBLE
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Appointment, User, Patient } from '../types';
import { Button } from '../components/Button';
import { 
  Calendar as CalendarIcon, Clock, User as UserIcon, CheckCircle, 
  XCircle, Search, AlertTriangle, Plus, X, ChevronLeft, ChevronRight, List 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Appointments = () => {
  const { role, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // View State
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Search & Form
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  // Confirmation
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, action: 'completed' | 'cancelled' | null, id: number | null}>({
    isOpen: false, action: null, id: null
  });

  // Chargement sécurisé des données
  const fetchAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>('/medical/appointments/');
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch appointments', e);
      setAppointments([]);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await api.get<any>('/auth/doctors/list/');
      console.log('Fetched doctors:', data);
      const listOfDoctors = data && data.doctors && Array.isArray(data.doctors) ? data.doctors : [];
      setDoctors(listOfDoctors);
      console.log('Doctors state updated:', listOfDoctors);
    } catch (e) {
      console.error('Failed to fetch doctors', e);
      setDoctors([]);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.get<Patient[]>('/patients/');
      setPatients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch patients', e);
      setPatients([]);
    }
  };

  useEffect(() => {
    fetchAppointments();
    if (role === 'patient') fetchDoctors();
    if (role === 'doctor') fetchPatients();
  }, [role]);

  // Pré-remplissage de la date depuis le calendrier
  useEffect(() => {
    if (isModalOpen && selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 16);
      setDate(iso);
    }
  }, [isModalOpen, selectedDate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason) return;
    setLoading(true);
    try {
      const payload: any = {
        appointment_date: new Date(date).toISOString(),
        reason,
        status: 'scheduled'
      };

      if (role === 'patient') {
        payload.doctor = parseInt(selectedDoctor);
        payload.patient = user?.id;
      } else if (role === 'doctor') {
        payload.patient = parseInt(selectedPatientId);
        payload.doctor = user?.id;
      }

      await api.post('/medical/appointments/', payload);
      alert('Rendez-vous créé avec succès !');
      setIsModalOpen(false);
      setReason(''); setDate(''); setSelectedDoctor(''); setSelectedPatientId('');
      fetchAppointments();
    } catch (e) {
      alert('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const promptStatusChange = (id: number, action: 'completed' | 'cancelled') => {
    setConfirmDialog({ isOpen: true, action, id });
  };

  const executeStatusChange = async () => {
    if (!confirmDialog.id || !confirmDialog.action) return;
    try {
      await api.patch(`/medical/appointments/${confirmDialog.id}/`, { status: confirmDialog.action });
      setAppointments(prev => prev.map(a => 
        a.id === confirmDialog.id ? { ...a, status: confirmDialog.action } : a
      ));
    } catch (e) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setConfirmDialog({ isOpen: false, action: null, id: null });
    }
  };

  const getPatientName = (id: number) => {
    const p = patients.find(p => p.id === id);
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient #${id}` : `Patient ID: ${id}`;
  };

  // --- Calendar Logic (inchangé, juste sécurisé) ---
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const navigateMonth = (dir: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (dir === 'prev' ? -1 : 1));
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const clicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(isSameDay(selectedDate || new Date(0), clicked) ? null : clicked);
  };

  // Filtrage sécurisé
  const filteredAppointments = appointments
    .filter(appt => {
      if (!search) return true;
      if (role === 'doctor') {
        return getPatientName(appt.patient).toLowerCase().includes(search.toLowerCase());
      }
      return appt.reason.toLowerCase().includes(search.toLowerCase());
    })
    .filter(appt => {
      if (view !== 'calendar' || !selectedDate) return true;
      return isSameDay(new Date(appt.appointment_date), selectedDate);
    });

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(null); }} className="px-3 py-1 text-sm hover:bg-slate-100 rounded-lg">Aujourd'hui</button>
            <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
            <div key={d} className="text-xs font-bold text-slate-400 py-2">{d}</div>
          ))}
          {[...blanks, ...days].map((day, i) => {
            if (!day) return <div key={i} className="h-24"></div>;
            const cellDate = new Date(year, month, day);
            const isSelected = selectedDate && isSameDay(selectedDate, cellDate);
            const isToday = isSameDay(new Date(), cellDate);
            const dayAppts = appointments.filter(a => isSameDay(new Date(a.appointment_date), cellDate));

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 rounded-lg border p-2 cursor-pointer hover:shadow-md transition-all
                  ${isSelected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200'}
                  ${isToday ? 'ring-2 ring-blue-300' : ''}
                `}
              >
                <div className={`text-sm font-medium ${isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}`}>
                  {day}
                </div>
                {dayAppts.length > 0 && (
                  <div className="text-xs mt-1">
                    <span className="bg-teal-100 text-teal-700 px-1 rounded">{dayAppts.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {role === 'doctor' ? 'Gestion des Rendez-vous' : 'Mes Rendez-vous'}
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>Liste</button>
            <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'calendar' ? 'bg-white shadow-sm' : ''}`}>Calendrier</button>
          </div>
          <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2"/>Nouveau RDV</Button>
        </div>
      </div>

      {/* Vue Calendrier */}
      {view === 'calendar' && renderCalendar()}

      {/* Liste */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
            Aucun rendez-vous trouvé
          </div>
        ) : (
          filteredAppointments.map(appt => (
            <div key={appt.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{appt.reason}</h3>
                <p className="text-sm text-slate-500">
                  {new Date(appt.appointment_date).toLocaleString('fr-FR')}
                  {' • '}
                  {role === 'patient' ? `Dr. ID: ${appt.doctor}` : getPatientName(appt.patient)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                  ${appt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
                    appt.status === 'completed' ? 'bg-green-100 text-green-700' : 
                    'bg-red-100 text-red-700'}`}>
                  {appt.status}
                </span>
                {appt.status === 'scheduled' && (
                  <div className="flex gap-2">
                    {role === 'doctor' && (
                      <button onClick={() => promptStatusChange(appt.id, 'completed')} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                        <CheckCircle size={20}/>
                      </button>
                    )}
                    <button onClick={() => promptStatusChange(appt.id, 'cancelled')} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                      <XCircle size={20}/>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal & Dialogs (inchangés) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-6">Nouveau rendez-vous</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {role === 'patient' ? (
                console.log(doctors),
                <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required className="w-full p-3 border rounded-lg">
                  <option value="">Choisir un médecin</option>
                  {
                  
                  doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.first_name} {d.last_name}</option>)}
                </select>
              ) : (
                <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required className="w-full p-3 border rounded-lg">
                  <option value="">Choisir un patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              )}
              <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-3 border rounded-lg"/>
              <textarea placeholder="Motif" value={reason} onChange={e => setReason(e.target.value)} required className="w-full p-3 border rounded-lg h-24"/>
              <div className="flex gap-3">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" isLoading={loading}>Confirmer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog (inchangé) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-4">
              {confirmDialog.action === 'cancelled' ? 'Annuler le RDV ?' : 'Marquer comme terminé ?'}
            </h3>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmDialog({isOpen: false, action: null, id: null})}>Retour</Button>
              <Button 
                className={confirmDialog.action === 'cancelled' ? 'bg-red-600' : 'bg-green-600'}
                onClick={executeStatusChange}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};