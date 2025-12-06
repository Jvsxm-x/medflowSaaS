// services/adminApi.ts
import { api } from './api';
import { User, Clinic, Appointment, Plan } from '../types';

export const adminApi = {
  // Users
  getUsers: (role?: string) => {
    const url = role ? `/admin/users/?role=${role}` : '/admin/users/';
    return api.get<User[]>(url);
  },
  
  updateUser: (id: string, data: Partial<User>) => 
    api.patch(`/admin/users/${id}/`, data),
  
  createUser: (data: any) => 
    api.post('/auth/register/', data),
  
  // Doctors spécifiques
  getDoctors: () => api.get<User[]>('/auth/doctors/list/'),
  
  // Patients spécifiques
  getPatients: () => api.get<User[]>('/patients/'),
  
  // Appointments
  getAppointments: () => api.get<Appointment[]>('/medical/appointments/'),
  updateAppointment: (id: string, data: Partial<Appointment>) => {
    // Pour MongoDB, utilisez l'ID MongoDB
    return api.patch(`/appointments/${id}/`, data);
  },
  
  // Plans (à créer dans Django)
  getPlans: () => api.get<Plan[]>('/plans/'),
  createPlan: (data: Partial<Plan>) => api.post('/plans/', data),
  updatePlan: (id: string, data: Partial<Plan>) => api.patch(`/plans/${id}/`, data),
  deletePlan: (id: string) => api.delete(`/plans/${id}/`),
  
  // Clinics
  getClinics: () => api.get<Clinic[]>('/clinics/'),
};