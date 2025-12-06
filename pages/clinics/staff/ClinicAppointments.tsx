
// src/pages/clinic/staff/Appointments.tsx
import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';

interface Appointment {
    id: string;
    patient_name: string;
    doctor_name: string;
    appointment_date: string;
    status: string;
    reason: string;
}

export const ClinicAppointments = () => {
  const { currentClinic } = useClinic();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const fetchAppointments = async () => {
      if (!currentClinic) return;
      try {
          const data = await api.get<Appointment[]>(`/clinics/${currentClinic.id || currentClinic._id}/appointments/`);
          setAppointments(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchAppointments();
  }, [currentClinic]);

  // Calendar Logic
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay(); // 0 Sun
  
  const changeMonth = (offset: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setSelectedDate(newDate);
  };

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const filteredAppointments = appointments.filter(a => 
      isSameDay(new Date(a.appointment_date), selectedDate)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Agenda Clinique</h1>

      <div className="grid lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                  {selectedDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20} /></button>
                <button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 text-sm font-medium hover:bg-slate-100 rounded-lg">Auj.</button>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-slate-400 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1">
              {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
              {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                  const isToday = isSameDay(date, new Date());
                  const isSelected = isSameDay(date, selectedDate);
                  const dayAppts = appointments.filter(a => isSameDay(new Date(a.appointment_date), date));
                  const hasAppts = dayAppts.length > 0;

                  return (
                    <div 
                        key={day} 
                        onClick={() => setSelectedDate(date)}
                        className={`
                            rounded-xl p-2 cursor-pointer transition-all border flex flex-col justify-between hover:shadow-md
                            ${isSelected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200' : 'border-slate-100 bg-white hover:border-teal-200'}
                        `}
                    >
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-teal-600 text-white' : 'text-slate-700'}`}>
                            {day}
                        </span>
                        {hasAppts && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {dayAppts.slice(0, 3).map((_, idx) => (
                                    <div key={idx} className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                ))}
                                {dayAppts.length > 3 && <span className="text-[9px] text-slate-400">+</span>}
                            </div>
                        )}
                    </div>
                  );
              })}
            </div>
        </div>

        {/* Daily Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-slate-900 border-b border-slate-100 pb-4">
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          
          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2">
            {loading ? (
                <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-teal-600"/></div>
            ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">Aucun rendez-vous ce jour.</div>
            ) : (
                filteredAppointments.map((appt, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-teal-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white p-1.5 rounded-md shadow-sm text-teal-600">
                        <Clock size={16} />
                    </div>
                    <span className="font-bold text-lg text-slate-800">
                        {new Date(appt.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    </div>
                    <p className="font-semibold text-slate-900">{appt.patient_name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <User size={14} /> Dr. {appt.doctor_name}
                    </div>
                    <p className="text-xs text-teal-600 mt-2 font-medium bg-teal-50 px-2 py-1 rounded w-fit">
                        {appt.reason}
                    </p>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
