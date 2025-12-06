
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ROUTES } from '../constants';
import { AlertTriangle } from 'lucide-react';

export const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData);
      
      // Maintenance Mode Check
      const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
      const userRole = localStorage.getItem('user_role');
      
      if (settings.maintenanceMode && userRole !== 'admin') {
           throw new Error("MAINTENANCE_MODE");
      }

      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      if (err.message === "MAINTENANCE_MODE") {
          logout(); // Force logout/cleanup
          setError("System is currently in maintenance mode. Only admins can log in.");
      } else {
          setError(err.message || 'Authentication failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Access your digital health dashboard</p>
        </div>

        {error && (
          <div className={`p-3 rounded-lg text-sm mb-6 border flex items-center gap-2 ${error.includes('maintenance') ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {error.includes('maintenance') && <AlertTriangle size={18} />}
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              name="username"
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" className="w-full py-3 mt-4" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="text-teal-600 font-medium hover:text-teal-700">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
