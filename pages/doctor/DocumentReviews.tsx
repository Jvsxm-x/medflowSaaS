// src/pages/doctor/DocumentReviews.tsx

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FileText, BrainCircuit, CheckCircle, XCircle, Edit, Save, ExternalLink, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';
import { Button } from '../../components/Button';

interface MedicalDocument {
  _id: string;
  title: string;
  file_url?: string;
  patient_name: string;
  patient_username: string;
  ai_summary?: string;
  ai_tips?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string;
}

export const DocumentReviews = () => {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ai_summary: '', ai_tips: '' });

  const fetchDocuments = async () => {
    try {
      const res = await api.get<{ documents: MedicalDocument[] }>('/doctor/documents/');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleEdit = (doc: MedicalDocument) => {
    setEditingId(doc._id);
    setEditForm({
      ai_summary: doc.ai_summary || '',
      ai_tips: doc.ai_tips || ''
    });
  };

  const handleSave = async (docId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/doctor/document/${docId}/review/`, {
        ai_summary: editForm.ai_summary,
        ai_tips: editForm.ai_tips,
        status
      });

      setDocuments(prev => prev.map(d =>
        d._id === docId
          ? { ...d, ai_summary: editForm.ai_summary, ai_tips: editForm.ai_tips, status }
          : d
      ));

      setEditingId(null);
      alert(`Document ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès`);
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement des documents...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Revue des Documents Patients</h2>
        <p className="text-slate-500 mt-2">Validez l'analyse IA et donnez votre avis médical</p>
      </div>

      <div className="space-y-6">
        {documents.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
            <FileText size={56} className="mx-auto text-slate-400 mb-4" />
            <p className="text-xl text-slate-600">Aucun document en attente de revue</p>
            <p className="text-slate-500 mt-2">Les patients n'ont pas encore uploadé de résultats</p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc._id}
              className={`bg-white rounded-2xl shadow-lg border-2 ${getStatusColor(doc.status)} transition-all hover:shadow-xl`}
            >
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <FileText size={28} className="text-slate-600" />
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{doc.title}</h3>
                      <p className="text-sm text-slate-600">
                        Patient : <strong>{doc.patient_name}</strong> • 
                        Reçu le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-full font-bold text-xs uppercase ${getStatusColor(doc.status)}`}>
                      {doc.status === 'pending' ? 'En attente' : doc.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                    </span>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <ExternalLink size={18} /> Voir le fichier
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600" /> Analyse IA
                  </h4>
                  {editingId === doc._id ? (
                    <textarea
                      className="w-full h-40 p-4 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none"
                      value={editForm.ai_summary}
                      onChange={e => setEditForm({ ...editForm, ai_summary: e.target.value })}
                    />
                  ) : (
                    <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900">
                      {doc.ai_summary || "Aucune analyse générée"}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="text-teal-600" /> Votre Avis Médical
                  </h4>
                  {editingId === doc._id ? (
                    <textarea
                      className="w-full h-40 p-4 border-2 border-teal-200 rounded-xl focus:ring-4 focus:ring-teal-100 outline-none"
                      value={editForm.ai_tips}
                      onChange={e => setEditForm({ ...editForm, ai_tips: e.target.value })}
                      placeholder="Donnez vos conseils au patient..."
                    />
                  ) : (
                    <div className="p-5 bg-teal-50 rounded-xl border border-teal-200 text-teal-900">
                      {doc.ai_tips || "Aucun conseil ajouté"}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                {editingId === doc._id ? (
                  <>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>
                      Annuler
                    </Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => handleSave(doc._id, 'rejected')}
                    >
                      <ThumbsDown className="mr-2" /> Rejeter
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleSave(doc._id, 'approved')}
                    >
                      <Save className="mr-2" /> Approuver & Envoyer
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => handleEdit(doc)}>
                    <Edit className="mr-2" /> Modifier l'analyse
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};