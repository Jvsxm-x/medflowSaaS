import React, { useEffect, useState } from 'react';
import { Calendar, Edit, Trash2, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { Appointment, User } from '../../types';

export const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);

  const fetchAppointments = async () => {
    try {
      const data = await api.get<Appointment[]>('/all/appointments/');
      setAppointments(data);
    } catch (e) {
      console.error('Erreur lors du chargement des rendez-vous:', e);
    } finally {
      setLoading(false);
    }
  };
const normalize = (response: any) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.doctors)) return response.doctors;
  return [];
};
  const fetchUsers = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        api.get<User[]>('/patients/'),
        api.get<User[]>('/auth/doctors/list/')
      ]);
      setPatients(normalize(patientsRes));
      setDoctors(normalize(doctorsRes));
    } catch (e) {
      console.error('Erreur lors du chargement des utilisateurs:', e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchUsers();
  }, []);

  const getPatientName = (patientId: number | string) => {
    const patient = patients.find(p => p.id === patientId || p._id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : `Patient #${patientId}`;
  };

  const getDoctorName = (doctorId: number | string) => {
    const doctor = doctors.find(d => d.id === doctorId || d._id === doctorId) ;
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : `Docteur #${doctorId}`;
  };

  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    try {
      await api.patch(`/appointments/${id}/`, { status: newStatus });
      fetchAppointments();
    } catch (e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Gestion des Rendez-vous</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docteur</th>
              <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {appointments.map(appointment => (
              <tr key={appointment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-gray-400" />
                    {new Date(appointment.appointment_date).toLocaleString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getPatientName(appointment.patient)}
                </td>
                <td className="px-6 py-4">
                  {getDoctorName(appointment.doctor)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {appointment.reason}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'scheduled' 
                      ? 'bg-blue-100 text-blue-800'
                      : appointment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status === 'scheduled' ? 'Planifié' : 
                     appointment.status === 'completed' ? 'Terminé' : 'Annulé'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleStatusChange(appointment.id.toString(), 'completed')}
                        >
                          <CheckCircle size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusChange(appointment.id.toString(), 'cancelled')}
                        >
                          <XCircle size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};