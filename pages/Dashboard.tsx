// src/pages/patient/Dashboard.tsx → VERSION FINALE 100% CONNECTÉE À LA BDD
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Heart, Droplet, Bell, Wind, FileText, MapPin, Star, Calendar, Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { ROUTES, API_BASE_URL } from '../constants';
import { Button } from '../components/Button';

interface StatsSummary {
  systolic: { avg: number | null };
  diastolic: { avg: number | null };
  glucose: { avg: number | null };
  heart_rate: { avg: number | null };
}

interface AlertType {
  _id?: string;
  message: string;
  level: 'low' | 'medium' | 'high';
  created_at: string;
}

interface Clinic {
  _id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  distance?: String; // Calculée côté front
}

interface Doctor {
  _id: string;
  first_name: string;
  last_name: string;
  specialty?: string;
  rating: number;
  avatar_url?: string;
  consultation_price?: number;
}

export const Dashboard = () => {
  const { user, token } = useAuth();
  const { currentClinic, enterClinic } = useClinic();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  // REDIRECTION SI DÉJÀ DANS UNE CLINIQUE
  useEffect(() => {
    if (currentClinic) {
      navigate('/clinic/patient/dashboard', { replace: true });
    }
  }, [currentClinic, navigate]);

  // RÉCUPÉRATION DES DONNÉES RÉELLES
useEffect(() => {
  const fetchAllData = async () => {
    if (!token) return;

    setLoading(true);
    let userLat = 36.8065; // Tunis centre par défaut
    let userLng = 10.1815;

    try {
      // 1. Récupérer les stats vitales
      const statsRes = await fetch(`${API_BASE_URL}/records/stats/?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.summary || data);
      }

      // 2. Alertes (lab orders)
      const labRes = await fetch(`${API_BASE_URL}/lab-orders/patient/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (labRes.ok) {
        const data = await labRes.json();
        const orders = Array.isArray(data) ? data : data.orders || [];
        const newAlerts = orders
          .filter((o: any) => o.status === 'pending')
          .slice(0, 5)
          .map((o: any) => ({
            message: `Analyse prescrite : ${o.test_name}`,
            level: 'medium' as const,
            created_at: o.ordered_at || new Date().toISOString()
          }));
        setAlerts(newAlerts);
      }

      // 3. Récupérer TOUTES les cliniques (pas de mock)
      const clinicsRes = await fetch(`${API_BASE_URL}/clinics/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!clinicsRes.ok) throw new Error('Failed to fetch clinics');

      const allClinics: Clinic[] = await clinicsRes.json();

      // 4. Géolocalisation + tri par distance
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            const sortedClinics = allClinics
              .map(clinic => {
                const distance = calculateDistance(
                  userLat,
                  userLng,
                  clinic.latitude,
                  clinic.longitude
                );
                return {
                  ...clinic,
                  distance: distance < 1000 
                    ? `${Math.round(distance)} m` 
                    : `${(distance / 1000).toFixed(1)} km`
                };
              })
              .sort((a, b) => {
                const distA = parseFloat(a.distance || '999');
                const distB = parseFloat(b.distance || '999');
                return distA - distB;
              });

            setClinics(sortedClinics);
            setLoading(false);
          },
          (error) => {
            console.warn("Géolocalisation refusée, on trie par note");
            // Fallback : tri par note si pas de position
            const sortedByRating = allClinics
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 9);
            setClinics(sortedByRating);
            setLoading(false);
          }
        );
      } else {
        // Pas de géolocalisation → tri par note
        const sortedByRating = allClinics
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 9);
        setClinics(sortedByRating);
        setLoading(false);
      }

      // 5. Top 3 docteurs par note
      const docRes = await fetch(`${API_BASE_URL}/auth/doctors/list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (docRes.ok) {
        const allDocs: Doctor[] = await docRes.json();
        const topDocs = allDocs
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 3);
        setDoctors(topDocs);
      }

    } catch (err) {
      console.error('Erreur dashboard:', err);
      setLoading(false);
    }
  };

  fetchAllData();
}, [token]);

// Fonction de calcul de distance (Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // en mètres
};

  // Si on est dans une clinique → redirection
  if (currentClinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-teal-600" size={48} />
          <p className="text-xl">Connexion à {currentClinic.name}...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, unit, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-900">
            {loading ? '...' : value !== null ? Math.round(value) : '—'}
          </p>
          <span className="text-sm text-slate-500">{unit}</span>
        </div>
        <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
          <Icon size={28} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Bonjour, {user?.first_name || 'Patient'} !
        </h1>
        <p className="text-xl text-slate-600 mt-2">Votre santé connectée, en temps réel</p>
      </div>

      {/* Stats vitales */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-6">Vos moyennes sur 30 jours</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Systolique" value={stats?.systolic?.avg} unit="mmHg" icon={Activity} color="bg-red-500" />
          <StatCard title="Diastolique" value={stats?.diastolic?.avg} unit="mmHg" icon={Wind} color="bg-blue-500" />
          <StatCard title="Glucose" value={stats?.glucose?.avg} unit="mg/dL" icon={Droplet} color="bg-amber-500" />
          <StatCard title="Pouls" value={stats?.heart_rate?.avg} unit="bpm" icon={Heart} color="bg-rose-500" />
        </div>
      </div>

      {/* Recommandations réelles */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Star className="text-yellow-500 fill-current" size={36} />
            Recommandations près de vous
          </h2>
          <Link to="/clinics/recommended" className="text-teal-600 font-bold hover:underline flex items-center gap-2">
            Voir tout <ArrowRight size={20} />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p>Recherche des meilleures cliniques autour de vous...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cliniques */}
            {clinics.map(clinic => (
              <div
                key={clinic._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-slate-100"
                onClick={() => enterClinic(clinic._id)}
              >
                <div className="h-48 relative">
                  <img 
                    src={clinic.logo_url || 'https://via.placeholder.com/400x200?text=Clinique'} 
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-6 text-white">
                    <h3 className="text-2xl font-bold">{clinic.name}</h3>
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <MapPin size={14} /> {clinic.address}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="font-bold">{clinic.rating}</span>
                    <span className="text-xs text-slate-600">({clinic.review_count})</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-teal-600 font-bold">{clinic.distance || '—'}</span>
                  </div>
                  <Button 
                    className="w-full py-3 text-lg font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      enterClinic(clinic._id);
                    }}
                  >
                    Entrer dans la clinique
                  </Button>
                </div>
              </div>
            ))}

            {/* Top docteurs */}
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition">
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl relative overflow-hidden">
                  <img 
                    src={doc.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg'} 
                    alt={doc.first_name}
                    className="w-24 h-24 rounded-full mx-auto -mt-12 border-4 border-white shadow-lg object-cover"
                  />
                </div>
                <div className="pt-16 px-6 pb-8">
                  <h3 className="font-bold text-xl">Dr. {doc.first_name} {doc.last_name}</h3>
                  <p className="text-indigo-600 font-medium mt-1">{doc.specialty || 'Médecin'}</p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    <Star size={16} className="text-yellow-500 fill-current" />
                    <span className="font-bold">{doc.rating || '4.8'}</span>
                  </div>
                  {doc.consultation_price && (
                    <p className="text-2xl font-bold text-indigo-600 mt-4">{doc.consultation_price} TND</p>
                  )}
                  <Button className="w-full mt-6" onClick={() => navigate(`/doctor/profile/${doc._id}`)}>
                    <Calendar size={18} className="mr-2" /> Prendre RDV
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Notifications</h3>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                <Bell className="text-amber-600" size={24} />
                <p className="font-medium text-amber-900">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Link to={ROUTES.MEDICAL_DATA} className="bg-white p-8 rounded-2xl border text-center hover:shadow-lg transition">
          <Activity className="mx-auto text-teal-600 mb-4" size={40} />
          <p className="font-bold">Mesures</p>
        </Link>
        <Link to={ROUTES.DOCUMENTS} className="bg-white p-8 rounded-2xl border text-center hover:shadow-lg transition">
          <FileText className="mx-auto text-indigo-600 mb-4" size={40} />
          <p className="font-bold">Documents</p>
        </Link>
        <Link to={ROUTES.APPOINTMENTS} className="bg-white p-8 rounded-2xl border text-center hover:shadow-lg transition">
          <Calendar className="mx-auto text-purple-600 mb-4" size={40} />
          <p className="font-bold">RDV</p>
        </Link>
        <Link to={ROUTES.PROFILE} className="bg-white p-8 rounded-2xl border text-center hover:shadow-lg transition">
          <div className="w-16 h-16 bg-teal-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-teal-700">
              {user?.first_name?.[0] || user?.username?.[0] || 'P'}
            </span>
          </div>
          <p className="font-bold">Profil</p>
        </Link>
      </div>
    </div>
  );
};