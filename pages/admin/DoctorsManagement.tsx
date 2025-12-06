import React, { useEffect, useState } from 'react';
import { Stethoscope, Search, Edit, Trash2, Plus, Mail, Phone, Star, Ban, CheckCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { adminApi } from '../../services/adminApi';
import { User ,UserRole} from '../../types';
import toast from 'react-hot-toast';

export const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    consultation_price: 0,
    username: '',
    password: 'default123',
  });

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDoctors();
      const list = Array.isArray(data) ? data : (data as any).doctors || [];
      console.log('Médecins récupérés:', list);
      setDoctors(list);
      setFiltered(list);
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors du chargement des médecins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      doctors.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        d.specialty?.toLowerCase().includes(term)
      )
    );
  }, [search, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doctorData = {
        ...formData,
        role: 'doctor' as UserRole,
        is_active: true,
      };

      if (editingDoctor) {
        // Supprimer le password si on édite et qu'il n'est pas changé
        const { password, ...updateData } = doctorData;
        await adminApi.updateUser(editingDoctor._id || editingDoctor.id.toString(), updateData);
        toast.success('Médecin mis à jour');
      } else {
        await adminApi.createUser(doctorData);
        toast.success('Médecin créé');
      }
      
      fetchDoctors();
      setModalOpen(false);
      setEditingDoctor(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialty: '',
        consultation_price: 0,
        username: '',
        password: 'default123',
      });
    } catch (err: any) {
      console.error('Erreur:', err);
      toast.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await adminApi.updateUser(id, { is_active: !current });
      toast.success(`Médecin ${!current ? 'activé' : 'désactivé'}`);
      fetchDoctors();
    } catch (err) {
      toast.error('Erreur lors de la modification');
    }
  };

  const openEdit = (doc: User) => {
    setFormData({
      first_name: doc.first_name || '',
      last_name: doc.last_name || '',
      email: doc.email || '',
      phone: doc.phone || '',
      specialty: doc.specialty || '',
      consultation_price: doc.consultation_price || 0,
      username: doc.username || doc.email.split('@')[0] || '',
      password: '', // Laisser vide pour l'édition
    });
    setEditingDoctor(doc);
    setModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4">
          <Stethoscope className="text-indigo-600" size={40} />
          Gestion des Médecins
        </h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={20} className="mr-2" /> Ajouter un médecin
        </Button>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un médecin..."
          className="w-full pl-12 pr-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((doc) => (
          <div
            key={doc._id}
            className={`bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 ${!doc.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-6">
              <img
                src={doc.avatar || 'https://randomuser.me/api/portraits/men/46.jpg'}
                alt={doc.first_name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end mb-2">
                  <Star className="text-yellow-500 fill-current" size={20} />
                  <span className="font-bold text-xl">{doc.rating}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {doc.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">
              Dr. {doc.first_name} {doc.last_name}
            </h3>
            <p className="text-indigo-600 font-semibold text-center text-lg mb-4">{doc.specialty}</p>

            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2 text-slate-600">
                <Mail size={16} /> {doc.email}
              </p>
              {doc.phone && (
                <p className="flex items-center gap-2 text-slate-600">
                  <Phone size={16} /> {doc.phone}
                </p>
              )}
              <p className="text-2xl font-bold text-center text-indigo-600 mt-6">
                {doc.consultation_price} TND
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => openEdit(doc)} className="flex-1">
                <Edit size={18} className="mr-2" /> Modifier
              </Button>
              <Button
                variant={doc.is_active ? "danger" : "primary"}
                onClick={() => toggleActive(doc._id, doc.is_active)}
                className="flex-1"
              >
                {doc.is_active ? <Ban size={18} className="mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                {doc.is_active ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
         {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-3xl p-10 max-w-2xl w-full m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-bold mb-8 text-center">
              {editingDoctor ? 'Modifier le médecin' : 'Nouveau médecin'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <input 
                placeholder="Prénom" 
                value={formData.first_name} 
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              <input 
                placeholder="Nom" 
                value={formData.last_name} 
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              <input 
                placeholder="Nom d'utilisateur" 
                value={formData.username} 
                onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              <input 
                placeholder="Téléphone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                className="p-4 border rounded-2xl" 
              />
              <input 
                placeholder="Spécialité" 
                value={formData.specialty} 
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              <input 
                type="number" 
                placeholder="Prix consultation (TND)" 
                value={formData.consultation_price} 
                onChange={(e) => setFormData({ ...formData, consultation_price: Number(e.target.value) })} 
                required 
                className="p-4 border rounded-2xl" 
              />
              {!editingDoctor && (
                <input 
                  type="password" 
                  placeholder="Mot de passe" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  required 
                  className="p-4 border rounded-2xl" 
                />
              )}
              <div className="col-span-2 flex gap-4 justify-end mt-6">
                <Button variant="secondary" type="button" onClick={() => { setModalOpen(false); setEditingDoctor(null); }}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingDoctor ? 'Sauvegarder' : 'Créer le médecin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};