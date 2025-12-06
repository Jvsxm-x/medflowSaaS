
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Patient } from '../types';
import { Button } from '../components/Button';
import { UserCircle, Save, MapPin, Phone, Calendar, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PatientProfile = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    birth_date: '',
    phone: '',
    address: '',
    emergency_contact: '',
    medical_history: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // UPDATED: GET /auth/profile/
        const p = await api.get<Patient>('/auth/profile/');
        setPatient(p);
        setFormData({
            birth_date: p.birth_date || '',
            phone: p.phone || '',
            address: p.address || '',
            emergency_contact: p.emergency_contact || '',
            medical_history: p.medical_history || ''
        });
      } catch (e) {
        console.error("Profile load error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        // UPDATED: PATCH /auth/profile/ to update personal details
        await api.patch<Patient>('/auth/profile/', formData);
        alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
            <div className="bg-teal-100 p-4 rounded-full text-teal-700">
                <UserCircle size={40} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Patient Profile</h2>
                <p className="text-slate-500">Manage your personal information</p>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="mb-6 pb-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="block text-slate-400 text-xs mb-1">Username</span>
                        <span className="font-medium text-slate-900">{user?.username}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="block text-slate-400 text-xs mb-1">Email</span>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-900">{user?.email}</span>
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unverified</span>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400"/> Date of Birth
                        </label>
                        <input 
                            type="date"
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.birth_date}
                            onChange={e => setFormData({...formData, birth_date: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Phone size={16} className="text-slate-400"/> Phone Number
                        </label>
                        <input 
                            type="tel"
                            placeholder="+33..."
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400"/> Address
                    </label>
                    <input 
                        type="text"
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact</label>
                    <input 
                        type="text"
                        placeholder="Name & Phone"
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={formData.emergency_contact}
                        onChange={e => setFormData({...formData, emergency_contact: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
                    <textarea 
                        rows={4}
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={formData.medical_history}
                        onChange={e => setFormData({...formData, medical_history: e.target.value})}
                        placeholder="Allergies, past surgeries, chronic conditions..."
                    />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                        <Save size={18} className="mr-2" />
                        Save Profile
                    </Button>
                </div>
            </form>
        </div>
    </div>
  );
};
