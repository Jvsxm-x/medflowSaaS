
// src/pages/clinic/staff/Settings.tsx
import React, { useEffect, useState } from 'react';
import { Upload, Palette, Building2, Save, Loader2 } from 'lucide-react';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';
import { Button } from '../../../components/Button';

export const ClinicSettings = () => {
  const { currentClinic, setCurrentClinic } = useClinic();
  const [formData, setFormData] = useState({
      name: '',
      address: '',
      primaryColor: '#14b8a6',
      secondaryColor: '#06b6d4',
      logo: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
      if (currentClinic) {
          setFormData({
              name: currentClinic.name || '',
              address: '', // Assuming address field might exist or needs to be added to type
              primaryColor: currentClinic.primaryColor || '#14b8a6',
              secondaryColor: currentClinic.secondaryColor || '#06b6d4',
              logo: currentClinic.logo || ''
          });
      }
  }, [currentClinic]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
      if (!currentClinic) return;
      setSaving(true);
      try {
          const updated = await api.patch<any>(`/clinics/${currentClinic.id || currentClinic._id}/`, formData);
          setCurrentClinic({ ...currentClinic, ...updated });
          alert("Paramètres mis à jour avec succès !");
      } catch (e) {
          alert("Erreur lors de la mise à jour.");
      } finally {
          setSaving(false);
      }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Paramètres de la clinique</h1>
        {saving && <span className="text-sm text-teal-600 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Enregistrement...</span>}
      </div>

      <div className="space-y-8">
        {/* Identity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800">
            <Building2 size={24} className="text-teal-600" /> Identité de la clinique
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-700">Logo URL</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl w-48 h-48 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <Upload size={48} className="text-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-bold">Changer URL</span>
                </div>
              </div>
              <input 
                type="text" 
                name="logo"
                placeholder="https://..." 
                className="mt-4 w-full p-2 border rounded-lg text-sm"
                value={formData.logo} 
                onChange={handleChange}
              />
            </div>
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Nom de la clinique</label>
                  <input 
                    type="text" 
                    name="name"
                    className="w-full p-4 border border-slate-200 rounded-xl text-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.name} 
                    onChange={handleChange}
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Adresse complète</label>
                  <input 
                    type="text" 
                    name="address"
                    placeholder="Adresse complète" 
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    value={formData.address} 
                    onChange={handleChange}
                  />
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800">
            <Palette size={24} className="text-purple-600" /> Thème & couleurs
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-700">Couleur principale</label>
              <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    name="primaryColor"
                    className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                    value={formData.primaryColor} 
                    onChange={handleChange}
                  />
                  <span className="font-mono text-slate-500 uppercase">{formData.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-700">Couleur secondaire</label>
              <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    name="secondaryColor"
                    className="w-16 h-16 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm"
                    value={formData.secondaryColor} 
                    onChange={handleChange}
                  />
                  <span className="font-mono text-slate-500 uppercase">{formData.secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right pt-4">
          <Button 
            onClick={handleSave} 
            isLoading={saving} 
            className="px-10 py-4 text-lg font-bold rounded-xl shadow-lg shadow-teal-500/20"
          >
            <Save size={24} className="mr-2" /> Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
};
