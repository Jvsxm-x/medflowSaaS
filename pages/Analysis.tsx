import React, { useState } from 'react';
import { api } from '../services/api';
import { PredictionResult } from '../types';
import { Button } from '../components/Button';
import { BrainCircuit, AlertTriangle, CheckCircle } from 'lucide-react';

export const Analysis = () => {
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    glucose: '',
    heart_rate: ''
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<PredictionResult>('/predict/', {
        systolic: Number(formData.systolic),
        diastolic: Number(formData.diastolic),
        glucose: Number(formData.glucose),
        heart_rate: Number(formData.heart_rate)
      });
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">AI Health Analysis</h2>
        <p className="text-slate-500">Predict potential health risks using our machine learning model</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <BrainCircuit className="text-teal-600" />
            Enter Vitals
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Systolic BP</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.systolic}
                  onChange={e => setFormData({...formData, systolic: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diastolic BP</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.diastolic}
                  onChange={e => setFormData({...formData, diastolic: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Glucose</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.glucose}
                  onChange={e => setFormData({...formData, glucose: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate</label>
                <input 
                  type="number" 
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.heart_rate}
                  onChange={e => setFormData({...formData, heart_rate: e.target.value})}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" isLoading={loading}>
              Analyze Data
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-6">
            {result ? (
                 <div className={`bg-white p-8 rounded-xl shadow-sm border-l-4 ${result.prediction === 1 || result.prediction === '1' || result.prediction === 'Risk' ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        {result.prediction === 1 || result.prediction === '1' || result.prediction === 'Risk' ? (
                            <div className="p-3 bg-red-100 text-red-600 rounded-full">
                                <AlertTriangle size={32} />
                            </div>
                        ) : (
                            <div className="p-3 bg-green-100 text-green-600 rounded-full">
                                <CheckCircle size={32} />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">Analysis Result</h3>
                            <p className="text-slate-500">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="prose text-slate-600">
                        {result.prediction === 1 || result.prediction === '1' || result.prediction === 'Risk' ? (
                            <p>The model has detected potential health risks based on the provided vitals. It is recommended to consult with a healthcare professional.</p>
                        ) : (
                            <p>The analysis suggests your vitals are within a normal range. Keep up the healthy lifestyle!</p>
                        )}
                    </div>
                 </div>
            ) : (
                <div className="bg-slate-100 h-full rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200">
                    <BrainCircuit size={48} className="mb-4 opacity-50" />
                    <p>Enter your vitals and run the analysis to see predictions here.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
