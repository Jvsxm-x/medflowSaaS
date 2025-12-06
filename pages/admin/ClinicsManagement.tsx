import React, { useEffect, useState } from 'react';
import { Building2, Edit, Trash2, Plus, X, Search, MapPin } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { Clinic, User } from '../../types';

export const ClinicsManagement = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    primary_color: '#14b8a6',
    secondary_color: '#06b6d4',
    logo_url: '',
    phone: '',
    is_active: true,
  });

  const fetchClinics = async () => {
    try {
      const data = await api.get<Clinic[]>('/clinics/');
      setClinics(data);
      setFilteredClinics(data);
    } catch (e) {
      console.error('Erreur lors du chargement des cliniques:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      // Récupérer les utilisateurs pouvant être staff de clinique
      const response = await api.get<User[]>('/admin/users/');
      const staffUsers = response.filter(user => 
        user.role === 'clinic_staff' || user.role === 'clinic_admin'
      );
      setStaffUsers(staffUsers);
    } catch (e) {
      console.error('Erreur lors du chargement des staffs:', e);
    }
  };

  useEffect(() => {
    fetchClinics();
    fetchStaffUsers();
  }, []);

  useEffect(() => {
    setFilteredClinics(
      clinics.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, clinics]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const clinicData = {
        ...formData,
        latitude: parseFloat(formData.latitude.toString()),
        longitude: parseFloat(formData.longitude.toString())
      };

      if (editingClinic) {
        await api.patch(`/clinics/${editingClinic.id || editingClinic._id}/`, clinicData);
      } else {
        await api.post('/clinics/', clinicData);
      }
      
      fetchClinics();
      setIsModalOpen(false);
      setEditingClinic(null);
      setFormData({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        primary_color: '#14b8a6',
        secondary_color: '#06b6d4',
        logo_url: '',
        phone: '',
        is_active: true,
      });
    } catch (e) {
      console.error('Erreur:', e);
      alert('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setFormData({
      name: clinic.name,
      address: clinic.address,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      primary_color: clinic.primary_color || '#14b8a6',
      secondary_color: clinic.secondary_color || '#06b6d4',
      logo_url: clinic.logo_url || '',
      phone: clinic.phone || '',
      is_active: clinic.is_active ?? true,
    });
    setEditingClinic(clinic);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await api.delete(`/clinics/${id}/`);
      fetchClinics();
    } catch (e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la suppression');
    }
  };

  const handleToggleActive = async (clinic: Clinic) => {
    try {
      const clinicId = clinic.id || clinic._id;
      await api.patch(`/clinics/${clinicId}/`, { is_active: !clinic.is_active });
      fetchClinics();
    } catch (e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la modification');
    }
  };

  if (loading && clinics.length === 0) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Gestion des Cliniques</h1>

      <div className="flex justify-between mb-6 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher clinique..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClinics.map(clinic => {
              const clinicId = clinic.id || clinic._id;
              return (
                <tr key={clinicId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {clinic.logo_url && (
                        <img src={clinic.logo_url} alt={clinic.name} className="h-10 w-10 rounded-full mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{clinic.name}</div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            {clinic.latitude.toFixed(4)}, {clinic.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{clinic.address}</td>
                  <td className="px-6 py-4 text-gray-900">{clinic.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span>{clinic.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-400 text-sm ml-1">({clinic.review_count || 0})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      clinic.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleEdit(clinic)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={clinic.is_active ? "danger" : "success"}
                        onClick={() => handleToggleActive(clinic)}
                      >
                        {clinic.is_active ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleDelete(clinicId!)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredClinics.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4">Aucune clinique trouvée</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingClinic ? 'Modifier la clinique' : 'Nouvelle clinique'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClinic(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nom de la clinique"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Téléphone"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Adresse complète"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      name="latitude"
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="Latitude"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      name="longitude"
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="Longitude"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur primaire</label>
                    <input
                      name="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={handleChange}
                      className="w-full h-10 border rounded-lg cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                    <input
                      name="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={handleChange}
                      className="w-full h-10 border rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo</label>
                  <input
                    name="logo_url"
                    value={formData.logo_url}
                    onChange={handleChange}
                    placeholder="https://exemple.com/logo.png"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Clinique active</label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingClinic(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" isLoading={loading}>
                    {editingClinic ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};