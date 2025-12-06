import React, { useEffect, useState } from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';
import { Calendar, Clock, Stethoscope, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { User } from '../../../types';
import { useNavigate } from 'react-router-dom';

export const ClinicBooking = () => {
  const { currentClinic } = useClinic();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
      doctor: '',
      date: '',
      time: '09:00',
      reason: ''
  });

  useEffect(() => {
    if (currentClinic) {
        api.get<User[]>(`/clinics/${currentClinic.id || currentClinic._id}/doctors/`)
           .then(data => setDoctors(data))
           .catch(err => console.error("Failed to load doctors", err))
           .finally(() => setLoading(false));
    }
  }, [currentClinic]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          const appointmentDate = new Date(`${formData.date}T${formData.time}`);
          
          await api.post('/medical/appointments/', {
              doctor: formData.doctor,
              clinic_id: currentClinic?.id || currentClinic?._id,
              appointment_date: appointmentDate.toISOString(),
              reason: formData.reason,
              status: 'scheduled'
          });
          
          alert("Rendez-vous confirmé avec succès !");
          navigate('/clinic/patient/dashboard');
      } catch (e) {
          alert("Erreur lors de la réservation. Veuillez réessayer.");
      } finally {
          setSubmitting(false);
      }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Prendre un rendez-vous</h1>
        <p className="text-slate-500">Chez {currentClinic?.name}</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                <Stethoscope className="inline mr-2 text-teal-600" size={18} />
                Choisir un médecin
                </label>
                <select 
                    className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    value={formData.doctor}
                    onChange={e => setFormData({...formData, doctor: e.target.value})}
                    required
                >
                <option value="">Sélectionnez un praticien</option>
                {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                        Dr. {doc.first_name} {doc.last_name} {doc.specialty ? `- ${doc.specialty}` : ''}
                    </option>
                ))}
                </select>
                {loading && <p className="text-xs text-slate-500 mt-2">Chargement des médecins...</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline mr-2 text-teal-600" size={18} />
                Date souhaitée
                </label>
                <input 
                    type="date" 
                    className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required 
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                <Clock className="inline mr-2 text-teal-600" size={18} />
                Heure
                </label>
                <select 
                    className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                >
                <option>09:00</option>
                <option>09:30</option>
                <option>10:00</option>
                <option>10:30</option>
                <option>11:00</option>
                <option>14:00</option>
                <option>14:30</option>
                <option>15:00</option>
                <option>16:00</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                Motif de consultation
                </label>
                <input 
                    type="text" 
                    placeholder="Ex: Contrôle annuel, Fièvre, Consultation spécialisée..." 
                    className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    required
                />
            </div>
            </div>

            <Button 
                type="submit" 
                isLoading={submitting} 
                className="w-full py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
            >
                Confirmer le rendez-vous
            </Button>
        </form>
      </div>
    </div>
  );
};