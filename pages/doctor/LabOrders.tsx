// src/pages/common/LabOrders.tsx  (ou dans doctor/ ou patient/)

import React, { useState, useEffect } from 'react';
import { TestTube, Clock, CheckCircle, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface LabOrder {
  _id: string;
  test_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  comment: string;
  result?: string;
  ordered_at: string;
  completed_at?: string;
  doctor_username?: string;
  patient_username?: string;
}

export const LabOrders = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<{ count: number; orders: LabOrder[] }>('/lab/my-orders/');
        const fetchedOrders = res.orders || [];

        // Tri par date décroissante
        fetchedOrders.sort((a, b) => new Date(b.ordered_at).getTime() - new Date(a.ordered_at).getTime());

        // Convertir les dates
        fetchedOrders.forEach(order => {
          order.ordered_at = new Date(order.ordered_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          if (order.completed_at) {
            order.completed_at = new Date(order.completed_at).toLocaleDateString('fr-FR');
          }
        });

        setOrders(fetchedOrders);
      } catch (err: any) {
        console.error("Erreur chargement des analyses", err);
        setError("Impossible de charger les demandes d'analyses");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'in_progress':
        return <Clock className="text-blue-600 animate-pulse" size={20} />;
      case 'pending':
        return <AlertCircle className="text-amber-600" size={20} />;
      default:
        return <TestTube className="text-slate-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span className="text-slate-600">Chargement des demandes d'analyses...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Mes Demandes d'Analyses</h2>
        <p className="text-slate-500 mt-2">Suivez l'état de vos analyses médicales prescrites</p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
            <TestTube size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg">Aucune demande d'analyse pour le moment</p>
            <p className="text-sm text-slate-400 mt-2">Votre docteur vous prescrira des examens si nécessaire</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-full">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{order.test_name}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Demandé le <span className="font-medium">{order.ordered_at}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status === 'pending' && 'En attente'}
                    {order.status === 'in_progress' && 'En cours'}
                    {order.status === 'completed' && 'Terminé'}
                    {order.status === 'cancelled' && 'Annulé'}
                  </span>
                </div>

                {/* Commentaire / Résultat du docteur */}
                {(order.comment || order.result) && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="text-indigo-600 mt-0.5" size={18} />
                      <div>
                        <p className="font-semibold text-indigo-900 text-sm">Note du docteur</p>
                        <p className="text-indigo-800 text-sm mt-1 whitespace-pre-wrap">
                          {order.result || order.comment || "Aucun commentaire"}
                        </p>
                        {order.completed_at && (
                          <p className="text-xs text-indigo-600 mt-2">
                            Résultat ajouté le {order.completed_at}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message si en attente */}
                {order.status === 'pending' && !order.comment && (
                  <p className="text-sm text-slate-500 italic mt-4">
                    En attente du laboratoire ou du résultat du docteur...
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};