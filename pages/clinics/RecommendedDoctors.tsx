// src/pages/doctors/RecommendedDoctors.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Star, Stethoscope, Calendar, Phone, MapPin, Clock, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

interface Doctor {
  _id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  rating: number;
  consultation_price?: number;
  avatar_url?: string;
  address?: string;
  phone?: string;
}

export const RecommendedDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await api.get<Doctor[]>('/auth/doctors/list/');
        const list = Array.isArray(data) ? data : (data as any).doctors || [];
        const top = list
          .filter((d: any) => d.rating >= 4.0)
          .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        setDoctors(top);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const openBookingModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const closeModal = () => setSelectedDoctor(null);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" size={48} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-12">Meilleurs Médecins</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {doctors.map((doc) => (
          <div
            key={doc._id}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-4"
          >
            <div className="h-64 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
              <img
                src={doc.avatar_url || 'https://randomuser.me/api/portraits/men/46.jpg'}
                alt={doc.first_name}
                className="w-36 h-36 rounded-full border-8 border-white shadow-2xl absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 object-cover"
              />
            </div>

            <div className="pt-24 px-10 pb-12 text-center">
              <h3 className="text-2xl font-bold text-slate-900">
                Dr. {doc.first_name} {doc.last_name}
              </h3>
              <p className="text-indigo-600 font-bold text-xl mt-2">
                {doc.specialty || 'Médecin généraliste'}
              </p>

              <div className="flex items-center justify-center gap-2 my-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={24} fill={i < Math.floor(doc.rating || 4.5) ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-3xl font-bold">{doc.rating || '4.8'}</span>
              </div>

              {doc.consultation_price && (
                <p className="text-3xl font-bold text-indigo-600 mb-8">
                  {doc.consultation_price} TND
                </p>
             ) }

              <Button
                onClick={() => openBookingModal(doc)}
                className="w-full py-5 text-xl font-bold rounded-2xl shadow-lg"
              >
                <Calendar className="mr-3" size={24} />
                Prendre rendez-vous
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RDV RAPIDE */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-3xl p-10 max-w-lg w-full m-4 shadow-3xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-8">
              <img
                src={selectedDoctor.avatar_url || 'https://randomuser.me/api/portraits/men/46.jpg'}
                alt=""
                className="w-32 h-32 rounded-full mx-auto border-8 border-white shadow-2xl -mt-20"
              />
              <h2 className="text-3xl font-bold mt-6">
                Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
              </h2>
              <p className="text-xl text-indigo-600 font-semibold mt-2">{selectedDoctor.specialty}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-8 text-lg">
                <div className="text-center">
                  <Star className="mx-auto text-yellow-500 fill-current" size={32} />
                  <p className="font-bold text-2xl mt-2">{selectedDoctor.rating}</p>
                </div>
                {selectedDoctor.consultation_price && (
                  <div className="text-center">
                    <span className="text-4xl font-bold text-indigo-600">{selectedDoctor.consultation_price}</span>
                    <p className="text-slate-600">TND</p>
                  </div>
                )}
              </div>

              <Button
                className="w-full py-5 text-xl"
                onClick={() => {
                  navigate('/appointments', { state: { doctorId: selectedDoctor._id } });
                  closeModal();
                }}
              >
                Choisir un créneau
              </Button>

              <Button variant="secondary" onClick={closeModal} className="w-full py-4">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};