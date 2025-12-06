
import React, { useState, useEffect } from 'react';
import { Save, Shield, Server, Bell, Lock, Smartphone, RefreshCw, Trash2, Cpu, Database } from 'lucide-react';
import { Button } from '../../components/Button';

export const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    systemName: 'Dawini SaaS',
    supportEmail: 'support@dawini.health',
    maintenanceMode: false,
    allowRegistration: true,
    enforce2FA: false,
    sessionTimeout: 30,
    aiConfidenceThreshold: 0.85,
    enableBetaFeatures: false
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem('admin_settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    setLoading(false);
    alert("System configuration saved.");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">System Configuration</h2>
        <p className="text-slate-500">Global settings, security, and AI parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* General */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Server size={20} className="text-slate-500" /> General
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System Name</label>
                <input type="text" name="systemName" className="w-full p-2 border rounded-lg" value={settings.systemName} onChange={handleChange} />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-700">Maintenance Mode</span>
                <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </section>

          {/* AI Params */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Cpu size={20} className="text-slate-500" /> AI Parameters
            </h3>
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">Risk Threshold</label>
                    <span className="text-sm font-bold text-blue-600">{settings.aiConfidenceThreshold}</span>
                  </div>
                  <input type="range" name="aiConfidenceThreshold" min="0.5" max="0.99" step="0.01" className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer" value={settings.aiConfidenceThreshold} onChange={handleChange} />
                  <p className="text-xs text-slate-500 mt-1">Predictions below this score flagged for review.</p>
               </div>
               <div className="flex items-center justify-between py-2">
                <div>
                  <label className="font-medium text-slate-700">Enable Beta Features</label>
                  <p className="text-xs text-slate-500">Experimental diagnostic models</p>
                </div>
                <input type="checkbox" name="enableBetaFeatures" checked={settings.enableBetaFeatures} onChange={handleChange} className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
               <Shield size={20} className="text-slate-500" /> Security
             </h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-700">Allow Registration</span>
                    <input type="checkbox" name="allowRegistration" checked={settings.allowRegistration} onChange={handleChange} className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <span className="font-medium text-slate-700">Enforce 2FA for Staff</span>
                        <p className="text-xs text-slate-500">Doctors & Admins must use OTP</p>
                    </div>
                    <input type="checkbox" name="enforce2FA" checked={settings.enforce2FA} onChange={handleChange} className="w-5 h-5 text-teal-600" />
                </div>
             </div>
          </section>

          <div className="col-span-full flex justify-end">
             <Button onClick={handleSave} isLoading={loading}>
                <Save size={18} className="mr-2" /> Save Configuration
             </Button>
          </div>
      </div>
    </div>
  );
};
