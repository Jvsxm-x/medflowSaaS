// src/context/ClinicContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { User } from '@/types';

export interface Clinic {
  id: string;
  _id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color?: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
}

interface ClinicContextType {
  currentClinic: Clinic | null;
  setCurrentClinic: (clinic: Clinic | null) => void;
  enterClinic: (clinicId: string) => Promise<void>;
  exitClinic: () => void;
}

const ClinicContext = createContext<ClinicContextType>({
  currentClinic: null,
  setCurrentClinic: () => {},
  enterClinic: async () => {},
  exitClinic: () => {},
});

export const ClinicProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, role } = useAuth(); // user contient username: "staff1"
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Entrer dans une clinique (patient)
  const enterClinic = async (clinicId: string) => {
    if (!clinicId || clinicId === 'undefined') return;
    try {
      const data = await api.post<Clinic>(`/clinics/${clinicId}/enter/`, {});
      const normalized: Clinic = {
        id: data._id || data.id || clinicId,
        _id: data._id || clinicId,
        name: data.name,
        logo_url: data.logo_url || '',
        primary_color: data.primary_color || '#14b8a6',
        secondary_color: data.secondary_color,
        address: data.address || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        rating: data.rating || 4.5,
        review_count: data.review_count || 0,
        is_active: data.is_active ?? true,
        created_at: data.created_at || new Date().toISOString(),
      };
      setCurrentClinic(normalized);
    } catch (err) {
      console.error('Failed to enter clinic:', err);
    }
  };

  const exitClinic = () => {
    setCurrentClinic(null);
    localStorage.removeItem('currentClinic');
  };

  // 2. CHARGEMENT AUTOMATIQUE POUR LE STAFF (le plus important)
  useEffect(() => {
    const loadStaffClinic = async () => {
      if (!user?.username || (role !== 'clinic_staff' && role !== 'clinic_admin')) {
        setLoading(false);
        return;
      }

      try {
        // Nouveau endpoint : on récupère la clinique via le lien clinic_staff
        const response = await api.get<User>(`/clinics/staff/${user.username}/clinic/`);
        const clinicData = response; // direct object

        const normalized: Clinic = {
          id: clinicData._id,
          _id: clinicData._id,
          name: clinicData.name,
          logo_url: clinicData.logo_url || '',
          primary_color: clinicData.primary_color || '#14b8a6',
          secondary_color: clinicData.secondary_color || clinicData.primary_color,
          address: clinicData.address || '',
          latitude: clinicData.latitude || 0,
          longitude: clinicData.longitude || 0,
          rating: clinicData.rating || 4.8,
          review_count: clinicData.review_count || 0,
          is_active: clinicData.is_active ?? true,
          created_at: clinicData.created_at || new Date().toISOString(),
        };

        setCurrentClinic(normalized);
      } catch (err: any) {
        console.error('Impossible de charger la clinique du staff:', err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    loadStaffClinic();
  }, [user, role]);

  // 3. Charger depuis localStorage (quand un patient entre dans une clinique)
  useEffect(() => {
    const saved = localStorage.getItem('currentClinic');
    if (saved && !currentClinic) {
      try {
        setCurrentClinic(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // 4. Appliquer le thème + sauvegarder
  useEffect(() => {
    if (currentClinic) {
      localStorage.setItem('currentClinic', JSON.stringify(currentClinic));
      document.documentElement.style.setProperty('--primary', currentClinic.primary_color);
      document.documentElement.style.setProperty('--accent', currentClinic.secondary_color || currentClinic.primary_color);
      document.title = `${currentClinic.name} - Dawini`;
    } else {
      localStorage.removeItem('currentClinic');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--accent');
      document.title = 'Dawini Santé';
    }
  }, [currentClinic]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Connexion à votre clinique...</p>
        </div>
      </div>
    );
  }

  return (
    <ClinicContext.Provider value={{ currentClinic, setCurrentClinic, enterClinic, exitClinic }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => useContext(ClinicContext);