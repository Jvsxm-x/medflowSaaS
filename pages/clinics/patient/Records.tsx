import React, { useEffect, useState } from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { api } from '../../../services/api';
import { Activity, FileText, Calendar, Download } from 'lucide-react';
import { MedicalRecord, MedicalDocument } from '../../../types';

export const ClinicPatientRecords = () => {
  const { currentClinic } = useClinic();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
          if (!currentClinic) return;
          try {
              // Fetch vitals recorded in this clinic context (mock endpoint filter)
              const recs = await api.get<MedicalRecord[]>(`/records/?clinic_id=${currentClinic.id || currentClinic._id}`);
              setRecords(recs || []);

              // Fetch docs
              const docs = await api.get<{documents: MedicalDocument[]}>(`/patient/documents/?clinic_id=${currentClinic.id || currentClinic._id}`);
              setDocuments(docs.documents || []);
          } catch (e) {
              console.error(e);
          } finally {
              setLoading(false);
          }
      };
      fetchData();
  }, [currentClinic]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Dossier Médical</h1>
      <p className="text-slate-500 mb-8">Vos données partagées avec {currentClinic?.name}</p>
      
      {/* Vitals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Activity size={24} />
              </div>
              <div>
                  <p className="text-sm text-slate-500">Dernière Tension</p>
                  <p className="text-2xl font-bold text-slate-900">
                      {records[0] ? `${records[0].systolic}/${records[0].diastolic}` : '--/--'}
                  </p>
              </div>
          </div>
          <p className="text-xs text-slate-400">
             {records[0] ? new Date(records[0].recorded_at).toLocaleDateString() : 'Aucune donnée'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Consultations/Records */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity size={20} className="text-teal-600" /> Historique des constantes
            </h2>
            <div className="space-y-4">
                {records.length === 0 ? (
                    <p className="text-slate-500 italic">Aucune mesure enregistrée dans cette clinique.</p>
                ) : (
                    records.slice(0, 5).map((rec, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-800">Consultation</p>
                                <p className="text-xs text-slate-500">{new Date(rec.recorded_at).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-sm">TA: {rec.systolic}/{rec.diastolic}</p>
                                <p className="font-mono text-sm">HR: {rec.heart_rate} bpm</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Documents & Ordonnances
            </h2>
             <div className="space-y-4">
                {documents.length === 0 ? (
                    <p className="text-slate-500 italic">Aucun document partagé.</p>
                ) : (
                    documents.map((doc) => (
                        <div key={doc._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{doc.title}</p>
                                    <p className="text-xs text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {doc.file_url && (
                                <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                                    <Download size={20} />
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>
          </div>
      </div>
    </div>
  );
};