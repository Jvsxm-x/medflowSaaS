// src/pages/admin/PlansManagement.tsx
import React, { useEffect, useState } from 'react';
import { CreditCard, Edit, Trash2, Plus, X, Check, Tag, Users, Database, Shield } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../services/api';
import { Plan } from '../../types';
import toast from 'react-hot-toast';

export const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    name: 'free' as 'free' | 'pro' | 'enterprise',
    price_monthly: 0,
    price_yearly: 0,
    storage_limit: 0,
    features: [] as string[],
    max_users: 1,
    is_active: true,
  });

  const [newFeature, setNewFeature] = useState('');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.get<Plan[]>('/plans/');
      setPlans(data);
      setFilteredPlans(data);
    } catch (e) {
      console.error('Erreur lors du chargement des plans:', e);
      toast.error('Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFilteredPlans(
      plans.filter(plan =>
        plan.name.toLowerCase().includes(term) ||
        plan.features.some(feature => feature.toLowerCase().includes(term))
      )
    );
  }, [search, plans]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: value as 'free' | 'pro' | 'enterprise' }));
    } else if (name === 'price_monthly' || name === 'price_yearly' || name === 'storage_limit' || name === 'max_users') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Convert storage_limit to bytes
      const planData = {
        ...formData,
        storage_limit: formData.storage_limit * 1024 * 1024 * 1024, // Convert GB to bytes
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        const planId = editingPlan.id || editingPlan.id;
        await api.patch(`/plans/${planId}/`, planData);
        toast.success('Plan mis à jour avec succès');
      } else {
        await api.post('/plans/', planData);
        toast.success('Plan créé avec succès');
      }
      
      fetchPlans();
      setIsModalOpen(false);
      setEditingPlan(null);
      resetForm();
    } catch (e: any) {
      console.error('Erreur:', e);
      const errorMessage = e.response?.data?.error || e.message || 'Erreur lors de l\'opération';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      storage_limit: plan.storage_limit / (1024 * 1024 * 1024), // Convert bytes to GB
      features: [...plan.features],
      max_users: plan.max_users,
      is_active: plan.is_active,
    });
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible.')) return;
    
    try {
      await api.delete(`/plans/${id}/`);
      toast.success('Plan supprimé avec succès');
      fetchPlans();
    } catch (e: any) {
      console.error('Erreur:', e);
      const errorMessage = e.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    }
  };

  const togglePlanStatus = async (plan: Plan) => {
    try {
      const planId = plan.id || plan.id;
      await api.patch(`/plans/${planId}/`, { is_active: !plan.is_active });
      toast.success(`Plan ${!plan.is_active ? 'activé' : 'désactivé'}`);
      fetchPlans();
    } catch (e: any) {
      console.error('Erreur:', e);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      name: 'free',
      price_monthly: 0,
      price_yearly: 0,
      storage_limit: 0,
      features: [],
      max_users: 1,
      is_active: true,
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getPlanColor = (name: string) => {
    switch (name) {
      case 'free': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CreditCard className="text-teal-600" size={32} />
            Gestion des Plans d'Abonnement
          </h1>
          <p className="text-slate-600 mt-2">Créez et gérez les plans d'abonnement pour vos utilisateurs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" /> Nouveau Plan
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Rechercher un plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map(plan => {
          const planId = plan.id || plan.id;
          const storageGB = plan.storage_limit / (1024 * 1024 * 1024);
          
          return (
            <div key={planId} className={`bg-white rounded-2xl shadow-lg border ${plan.is_active ? 'border-slate-200' : 'border-red-200'} overflow-hidden hover:shadow-xl transition-shadow duration-300`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(plan.name)}`}>
                      {plan.name.toUpperCase()}
                    </span>
                    {!plan.is_active && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      {plan.price_monthly} TND<span className="text-sm text-slate-500 font-normal">/mois</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {plan.price_yearly} TND/an
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Plan {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                </h3>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Database size={16} className="text-blue-500" />
                    <span>{formatBytes(plan.storage_limit)} stockage</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={16} className="text-green-500" />
                    <span>{plan.max_users} utilisateur(s) max</span>
                  </div>
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <Check size={16} className="text-teal-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <div className="text-sm text-slate-500">
                      +{plan.features.length - 3} fonctionnalités supplémentaires
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-2" /> Modifier
                  </Button>
                  <Button
                    variant={plan.is_active ? "danger" : "success"}
                    size="sm"
                    onClick={() => togglePlanStatus(plan)}
                    className="flex-1"
                  >
                    {plan.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun plan trouvé</h3>
          <p className="text-slate-600 mb-6">
            {search ? 'Aucun plan ne correspond à votre recherche.' : 'Commencez par créer votre premier plan.'}
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" /> Créer un plan
          </Button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingPlan ? 'Modifier le plan' : 'Nouveau plan d\'abonnement'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom du plan *</label>
                    <select
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="free">Free (Gratuit)</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Limite d'utilisateurs *</label>
                    <input
                      type="number"
                      name="max_users"
                      min="1"
                      value={formData.max_users}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prix mensuel (TND) *</label>
                    <input
                      type="number"
                      name="price_monthly"
                      min="0"
                      step="0.01"
                      value={formData.price_monthly}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Prix annuel (TND) *</label>
                    <input
                      type="number"
                      name="price_yearly"
                      min="0"
                      step="0.01"
                      value={formData.price_yearly}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stockage (GB) *</label>
                  <input
                    type="number"
                    name="storage_limit"
                    min="0"
                    step="0.1"
                    value={formData.storage_limit}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.storage_limit} GB = {formData.storage_limit * 1024 * 1024 * 1024} bytes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fonctionnalités</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Ajouter une fonctionnalité..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={addFeature} variant="secondary">
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-teal-500" />
                          <span>{feature}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                  />
                  <label className="ml-2 text-sm text-slate-700">Plan actif</label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPlan(null);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" isLoading={loading}>
                    {editingPlan ? 'Mettre à jour' : 'Créer le plan'}
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