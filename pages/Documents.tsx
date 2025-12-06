
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { MedicalDocument,User, PredictionResult } from '../types';
import { FileText, Download, Upload, Trash2, Loader2, BrainCircuit, CheckCircle, Clock, ChevronDown, ChevronUp, User as UserIcon, Sparkles, XCircle, Database, Share2, X, Link as LinkIcon, Mail, Copy, Shield, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useSaaS } from '../context/SaaSContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { API_BASE_URL } from '../constants';

export const Documents = () => {
  const { user,token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals & Sharing State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<MedicalDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Advanced Sharing State
  const [shareMode, setShareMode] = useState<'platform' | 'email' | 'link'>('platform');
  const [shareDoctorId, setShareDoctorId] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Charger les documents du patient
  const fetchDocuments = async () => {
    try {
      const res = await api.get<{ documents: MedicalDocument[] }>('/patient/documents/');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get<{ doctors?: User[]; data?: { doctors?: User[] } }>('/auth/doctors/list/');
      const doctorList = res.doctors || res.data?.doctors || res;
      setDoctors(Array.isArray(doctorList) ? doctorList : []);
    } catch (err: any) {
      try {
        const fallback = await api.get<User[]>('/auth/doctors/');
        setDoctors(Array.isArray(fallback) ? fallback : []);
      } catch (e) {
        setDoctors([]);
      }
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchDoctors();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        alert("Format non supporté. Utilisez PDF, JPG ou PNG.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Fichier trop volumineux (max 10 Mo)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedDoctor || !token) return;

    setIsUploading(true);
    setUploadProgress('Envoi en cours...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('doctor_username', selectedDoctor);

    try {
      const res = await fetch(`${API_BASE_URL}/patient/upload-document/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setDocuments(prev => [data.document, ...prev]);
        setIsModalOpen(false);
        alert("Document envoyé avec succès !");
      } else {
        alert(data.error || "Erreur lors de l'envoi");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      setSelectedFile(null);
      setSelectedDoctor('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Sharing Functions ---

  const openShareModal = (doc: MedicalDocument) => {
      setDocumentToShare(doc);
      setShareMode('platform');
      setGeneratedLink('');
      setShareEmail('');
      setShareDoctorId('');
      setIsShareModalOpen(true);
  };

  const handleSharePlatform = async () => {
      if (!documentToShare || !shareDoctorId) return;
      try {
          await api.post(`/patient/document/${documentToShare._id}/share/`, {
              doctor_id: shareDoctorId
          });
          alert("Document partagé avec succès !");
          setIsShareModalOpen(false);
      } catch (e) {
          alert("Erreur lors du partage.");
      }
  };

  const handleShareEmail = async () => {
      if (!shareEmail || !documentToShare) return;
      // Simulating Email API call
      setTimeout(() => {
          alert(`Lien d'accès sécurisé envoyé à ${shareEmail}`);
          setIsShareModalOpen(false);
      }, 1000);
  };

  const handleGenerateLink = () => {
      // Simulating Link Generation
      const randomKey = Math.random().toString(36).substring(2, 10);
      const link = `${window.location.origin}/share/doc/${documentToShare?._id}?key=${randomKey}`;
      setGeneratedLink(link);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // -------------------------

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Supprimer ce document ?")) return;
    try {
      await api.delete(`/patient/document/${docId}/`);
      setDocuments(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      alert("Impossible de supprimer");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Mes Documents Médicaux</h2>
          <p className="text-slate-600 mt-2">Envoyez vos bilans, résultats, ordonnances...</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Upload size={18} className="mr-2" /> Envoyer un document
        </Button>
      </div>

      <div className="space-y-6">
        {documents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
            <FileText size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-xl text-slate-600">Aucun document</p>
            <p className="text-slate-500 mt-2">Envoyez vos résultats pour que votre docteur les valide</p>
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-full ${getStatusColor(doc.status)}`}>
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{doc.title}</h3>
                      <p className="text-slate-600">
                        Envoyé le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        À : <strong>Dr. {doc.doctor_name || doc.doctor_username}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(doc.status)}`}>
                      {doc.status === 'pending' ? 'En attente' : doc.status === 'approved' ? 'Validé' : 'Rejeté'}
                    </span>
                    <button onClick={() => setExpandedId(expandedId === doc._id ? null : doc._id)}>
                      {expandedId === doc._id ? <ChevronUp /> : <ChevronDown />}
                    </button>
                  </div>
                </div>

                {expandedId === doc._id && (
                  <div className="mt-6 pt-6 border-t border-slate-200 grid md:grid-cols-2 gap-6">
                    {/* Analyse IA */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                      <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-3">
                        <BrainCircuit className="text-indigo-600" /> Analyse IA Automatique
                      </h4>
                      <p className="text-indigo-800 text-sm leading-relaxed">
                        {doc.ai_summary || "Aucune donnée extraite automatiquement."}
                      </p>
                      {doc.ai_prediction && (
                        <div className="mt-4 p-3 bg-indigo-100 rounded-lg border border-indigo-300">
                          <p className="text-indigo-900 font-bold text-sm">{doc.ai_prediction}</p>
                        </div>
                      )}
                    </div>

                    {/* Avis du docteur */}
                    <div className={`p-6 rounded-xl border ${doc.status === 'approved' ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                        {doc.status === 'approved' ? <CheckCircle className="text-teal-600" /> : <Clock className="text-amber-600" />}
                        Avis du Docteur
                      </h4>
                      <p className="text-slate-700 text-sm">
                        {doc.ai_tips || (doc.status === 'pending' ? "En attente de validation..." : "Aucun commentaire")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => openShareModal(doc)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center gap-2 font-medium transition-colors"
                  >
                      <Share2 size={16} /> Partager
                  </button>
                  <a
                    href={doc.file_url}
                    download={doc.title}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download size={16} /> Télécharger
                  </a>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold mb-2">Envoyer un document</h3>
            <p className="text-slate-600 mb-6">Votre docteur recevra et validera votre bilan</p>

            {!isUploading ? (
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block font-medium mb-2">Document (PDF, JPG, PNG)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-400 cursor-pointer transition"
                  >
                    <Upload className="mx-auto text-slate-400 mb-3" size={48} />
                    <p className="text-slate-600">
                      {selectedFile ? selectedFile.name : "Cliquez pour sélectionner"}
                    </p>
                    <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} required />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">Envoyer à</label>
                  <select
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    value={selectedDoctor}
                    onChange={e => setSelectedDoctor(e.target.value)}
                    required
                  >
                    <option value="">Choisir un docteur</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d.username}>
                        Dr. {d.first_name} {d.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={!selectedFile || !selectedDoctor}>
                    Envoyer & Analyser
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-teal-500 border-t-transparent mb-6"></div>
                <p className="text-xl font-bold text-teal-600">{uploadProgress}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Share Modal */}
      {isShareModalOpen && documentToShare && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-0 w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in-up">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Share2 size={18} className="text-indigo-600"/> Partager
                        </h3>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">{documentToShare.title}</p>
                      </div>
                      <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm hover:shadow">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6">
                      {/* Tabs */}
                      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
                          <button 
                              onClick={() => setShareMode('platform')}
                              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${shareMode === 'platform' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <UserIcon size={16} /> Docteur
                          </button>
                          <button 
                              onClick={() => setShareMode('email')}
                              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${shareMode === 'email' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <Mail size={16} /> Email
                          </button>
                          <button 
                              onClick={() => setShareMode('link')}
                              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${shareMode === 'link' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              <LinkIcon size={16} /> Lien
                          </button>
                      </div>

                      {/* Content based on Tab */}
                      {shareMode === 'platform' && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
                                  Donnez un accès sécurisé à un médecin inscrit sur la plateforme.
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-2 text-slate-700">Médecin destinataire</label>
                                  <select 
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    value={shareDoctorId}
                                    onChange={(e) => setShareDoctorId(e.target.value)}
                                  >
                                      <option value="">-- Sélectionner un médecin --</option>
                                      {doctors.map(d => (
                                          <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                                      ))}
                                  </select>
                              </div>
                              <Button onClick={handleSharePlatform} disabled={!shareDoctorId} className="w-full">
                                  Partager maintenant
                              </Button>
                          </div>
                      )}

                      {shareMode === 'email' && (
                          <div className="space-y-4 animate-fade-in">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-700">
                                  Envoyez une invitation sécurisée à une adresse email externe.
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-2 text-slate-700">Adresse Email</label>
                                  <div className="relative">
                                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                      <input 
                                          type="email" 
                                          placeholder="docteur@exemple.com"
                                          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                          value={shareEmail}
                                          onChange={(e) => setShareEmail(e.target.value)}
                                      />
                                  </div>
                              </div>
                              <Button onClick={handleShareEmail} disabled={!shareEmail} className="w-full">
                                  Envoyer l'invitation
                              </Button>
                          </div>
                      )}

                      {shareMode === 'link' && (
                          <div className="space-y-5 animate-fade-in">
                              <div className="text-center">
                                  <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <LinkIcon size={28} className="text-indigo-600" />
                                  </div>
                                  <h4 className="font-bold text-slate-800">Lien d'accès temporaire</h4>
                                  <p className="text-sm text-slate-500 mt-1">Ce lien expirera automatiquement dans 24 heures.</p>
                              </div>

                              {!generatedLink ? (
                                  <Button onClick={handleGenerateLink} variant="secondary" className="w-full border-dashed border-2 border-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all">
                                      Générer un lien sécurisé
                                  </Button>
                              ) : (
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                                      <code className="text-sm text-slate-600 flex-1 truncate font-mono bg-white px-2 py-1 rounded border border-slate-100">
                                          {generatedLink}
                                      </code>
                                      <button 
                                          onClick={copyToClipboard}
                                          className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-white shadow-sm hover:bg-slate-100 text-slate-600'}`}
                                          title="Copier"
                                      >
                                          {copied ? <Check size={18} /> : <Copy size={18} />}
                                      </button>
                                  </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                  <Shield size={14} className="shrink-0" />
                                  Le destinataire devra entrer un code de sécurité envoyé séparément.
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
