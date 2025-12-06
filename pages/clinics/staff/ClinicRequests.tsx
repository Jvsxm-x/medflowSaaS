
// src/pages/clinic/staff/Requests.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, FileText, Upload, Plus, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';
import { API_BASE_URL } from '../../../constants';

interface DynamicField {
    key: string;
    value: string;
    unit: string;
}

interface Request {
    id: string;
    _id?: string;
    patient_name: string;
    type: string;
    test_name?: string;
    requested_at: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export const ClinicRequests = () => {
  const { currentClinic } = useClinic();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'form'>('file');
  const [processing, setProcessing] = useState(false);
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  
  // Dynamic Form State
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([{ key: '', value: '', unit: '' }]);

  const fetchRequests = async () => {
    console.log("Fetching requests for clinic:", currentClinic);
      if (!currentClinic) return;
      try {
          // Fetch pending requests for this clinic
          const data = await api.get<Request[]>(`/clinics/${currentClinic.id || currentClinic._id}/requests/`);
          setRequests(data);
      } catch (err) {
          console.error("Failed to fetch requests", err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchRequests();
  }, [currentClinic]);

  const handleProcess = (req: Request) => {
      setSelectedRequest(req);
      setIsProcessModalOpen(true);
  };

  const handleAddField = () => {
      setDynamicFields([...dynamicFields, { key: '', value: '', unit: '' }]);
  };

  const handleRemoveField = (index: number) => {
      setDynamicFields(dynamicFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof DynamicField, value: string) => {
      const newFields = [...dynamicFields];
      newFields[index][field] = value;
      setDynamicFields(newFields);
  };

  const handleSubmitResult = async () => {
      if (!selectedRequest || !currentClinic) return;
      setProcessing(true);

      try {
          const requestId = selectedRequest._id || selectedRequest.id;
          
          if (uploadMode === 'file') {
              if (!file) {
                  alert("Veuillez sélectionner un fichier.");
                  setProcessing(false);
                  return;
              }
              const formData = new FormData();
              formData.append('file', file);
              formData.append('request_id', requestId);
              
              // Custom upload call to handle FormData using correct API_BASE_URL
              await fetch(`${API_BASE_URL}/clinics/${currentClinic.id || currentClinic._id}/requests/${requestId}/upload/`, {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                  },
                  body: formData
              });

          } else {
              // Submit dynamic form data
              const results = dynamicFields.reduce((acc, field) => {
                  if (field.key) acc[field.key] = `${field.value} ${field.unit}`;
                  return acc;
              }, {} as Record<string, string>);

              await api.post(`/clinics/${currentClinic.id || currentClinic._id}/requests/${requestId}/process/`, {
                  results,
                  status: 'completed'
              });
          }

          alert("Résultats envoyés au patient et au médecin prescripteur. Analyse IA lancée.");
          
          // Update local state
          setRequests(prev => prev.map(r => r.id === selectedRequest.id || r._id === selectedRequest._id ? { ...r, status: 'completed' } : r));
          setIsProcessModalOpen(false);
          setFile(null);
          setDynamicFields([{ key: '', value: '', unit: '' }]);
      } catch (e) {
          console.error(e);
          alert("Une erreur est survenue lors de l'envoi des résultats.");
      } finally {
          setProcessing(false);
      }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Demandes d'analyses</h1>
            <p className="text-slate-500">Gérez les demandes entrantes des médecins et patients</p>
        </div>
        <Button onClick={fetchRequests} variant="secondary" size="sm" isLoading={loading}>
            Actualiser
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="text-center py-12">
                <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
            </div>
        ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500">Aucune demande en attente pour le moment.</p>
            </div>
        ) : (
            requests.map((req) => (
            <div key={req.id || req._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-5 mb-4 md:mb-0 w-full md:w-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    req.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                    {req.status === 'pending' ? <Clock size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{req.patient_name}</h3>
                    <p className="text-slate-600 flex items-center gap-2 text-sm">
                    <FileText size={16} /> {req.type || 'Analyse'} {req.test_name ? `- ${req.test_name}` : ''} 
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Reçu le {new Date(req.requested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                </div>

                {req.status === 'pending' ? (
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => handleProcess(req)}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                    <Upload size={18} /> Traiter & Résultats
                    </button>
                </div>
                ) : (
                <span className="text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full flex items-center gap-2">
                    <CheckCircle size={16} /> Traité
                </span>
                )}
            </div>
            ))
        )}
      </div>

      {/* Result Processing Modal */}
      {isProcessModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                  <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">Saisie des Résultats</h3>
                          <p className="text-sm text-slate-500">Patient: {selectedRequest.patient_name}</p>
                      </div>
                      <button onClick={() => setIsProcessModalOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>

                  <div className="p-6 overflow-y-auto">
                      {/* Toggle Mode */}
                      <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                          <button 
                            className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${uploadMode === 'file' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}
                            onClick={() => setUploadMode('file')}
                          >
                              Upload Fichier (PDF/Img)
                          </button>
                          <button 
                            className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${uploadMode === 'form' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500'}`}
                            onClick={() => setUploadMode('form')}
                          >
                              Formulaire Dynamique
                          </button>
                      </div>

                      {uploadMode === 'file' ? (
                          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 transition cursor-pointer relative group">
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} accept="application/pdf,image/*" />
                              <div className="group-hover:scale-105 transition-transform duration-200">
                                <Upload size={40} className="mx-auto text-teal-500 mb-3" />
                                <p className="text-slate-700 font-semibold text-lg">
                                    {file ? file.name : "Glissez un fichier ou cliquez pour upload"}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">PDF, PNG, JPG (Max 10MB)</p>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm flex gap-2 items-start">
                                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                  <p>Ajoutez les paramètres analysés (ex: Glucose, Fer, Cholestérol). Ces données seront structurées et analysées par l'IA pour le patient.</p>
                              </div>
                              {dynamicFields.map((field, idx) => (
                                  <div key={idx} className="flex gap-3 items-start animate-fade-in">
                                      <input 
                                        placeholder="Paramètre (ex: Glucose)" 
                                        className="flex-1 p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={field.key}
                                        onChange={e => handleFieldChange(idx, 'key', e.target.value)}
                                      />
                                      <input 
                                        placeholder="Valeur" 
                                        className="w-24 p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={field.value}
                                        onChange={e => handleFieldChange(idx, 'value', e.target.value)}
                                      />
                                      <input 
                                        placeholder="Unité" 
                                        className="w-20 p-3 border rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={field.unit}
                                        onChange={e => handleFieldChange(idx, 'unit', e.target.value)}
                                      />
                                      <button 
                                        onClick={() => handleRemoveField(idx)} 
                                        className="p-3 text-red-400 hover:bg-red-50 rounded-lg hover:text-red-600 transition-colors"
                                      >
                                          <Trash2 size={20} />
                                      </button>
                                  </div>
                              ))}
                              <Button variant="secondary" onClick={handleAddField} size="sm" className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-teal-600">
                                  <Plus size={16} className="mr-2" /> Ajouter un champ
                              </Button>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                      <Button variant="secondary" onClick={() => setIsProcessModalOpen(false)}>Annuler</Button>
                      <Button onClick={handleSubmitResult} isLoading={processing}>
                          {processing ? 'Envoi en cours...' : 'Envoyer Résultats'}
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
