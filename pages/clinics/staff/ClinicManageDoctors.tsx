import React, { useEffect, useState } from 'react';
import { useClinicId } from '../../../hooks/useClinicId';
import { api } from '../../../services/api';

export const ClinicManageDoctors = () => {
  const clinicId = useClinicId();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    api.get(`/clinics/${clinicId}/doctors/`)
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (!clinicId) return <div className="p-8 text-center text-red-600">Aucune clinique</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Médecins de la clinique</h1>
      {loading ? <div>Chargement...</div> : (
        doctors.map(doc => (
          <div key={doc.username} className="bg-white p-6 rounded-xl mb-4 shadow">
            Dr. {doc.first_name} {doc.last_name} - {doc.specialty || 'Généraliste'}
          </div>
        ))
      )}
    </div>
  );
};