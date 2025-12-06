import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { useClinic } from '../../../context/ClinicContext';
import { Star, Calendar, Phone, Stethoscope, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Doctor {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  rating?: number;
  phone?: string;
  email?: string;
  avatar?: string;
}

export const ClinicDoctorsList = () => {
  const { currentClinic } = useClinic();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentClinic) {
        api.get<Doctor[]>(`/clinics/${currentClinic.id || currentClinic._id}/doctors/`)
        .then(data => setDoctors(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [currentClinic]);

  const filteredDoctors = doctors.filter(d => 
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-12 text-center text-slate-500">Chargement de l'équipe médicale...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nos Spécialistes</h1>
            <p className="text-slate-600">Une équipe d'experts à votre écoute chez {currentClinic?.name}</p>
          </div>
          <div className="relative w-full md:w-72">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
                type="text" 
                placeholder="Rechercher (nom, spécialité)..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
             />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doc) => (
          <div key={doc.username} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-500 text-2xl font-bold overflow-hidden">
                {doc.avatar ? (
                    <img src={doc.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span>{doc.first_name[0]}{doc.last_name[0]}</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                    Dr. {doc.first_name} {doc.last_name}
                </h3>
                <p className="text-teal-600 font-medium flex items-center gap-1 text-sm mt-1">
                    <Stethoscope size={14} /> {doc.specialty || 'Médecin généraliste'}
                </p>
                <div className="flex items-center gap-1 text-yellow-500 mt-2 text-sm">
                    <Star size={14} fill="currentColor" />
                    <span className="font-bold text-slate-700">{doc.rating?.toFixed(1) || "5.0"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6 border-t border-slate-50 pt-4">
              {doc.phone && (
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="p-2 bg-slate-50 rounded-lg"><Phone size={16} /></div>
                  <span>{doc.phone}</span>
                </div>
              )}
               <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <div className="p-2 bg-slate-50 rounded-lg"><MapPin size={16} /></div>
                  <span>{currentClinic?.name} - 2ème étage</span>
                </div>
            </div>

            <Link to="/clinic/patient/book" className="block">
                <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                <Calendar size={18} />
                Prendre RDV
                </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};