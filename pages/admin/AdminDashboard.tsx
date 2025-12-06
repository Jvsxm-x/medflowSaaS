
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Server, Users, AlertCircle, RefreshCw, Activity, Database, BrainCircuit } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface LogEntry {
  id: number;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  message: string;
}

export const AdminDashboard = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRetraining, setIsRetraining] = useState(false);
  const [health, setHealth] = useState({ db: 'connected', ai: 'connected' });

  useEffect(() => {
    // Load logs from session storage (simulating dynamic system logs)
    const loadLogs = () => {
        const stored = sessionStorage.getItem('system_logs');
        if (stored) {
            setLogs(JSON.parse(stored));
        }
    };
    loadLogs();
    
    // Poll for new logs every 2 seconds
    const interval = setInterval(loadLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      // Simulate dynamic health checks
      const healthInterval = setInterval(() => {
          const statuses = ['connected', 'connected', 'connected', 'warning', 'connected'];
          setHealth({
              db: statuses[Math.floor(Math.random() * statuses.length)],
              ai: statuses[Math.floor(Math.random() * statuses.length)]
          });
      }, 5000);
      return () => clearInterval(healthInterval);
  }, []);

  const handleRetrain = async () => {
      setIsRetraining(true);
      try {
          await api.post('/retrain/', {});
          alert("Model retraining started successfully.");
      } catch (e) {
          alert("Failed to start retraining.");
      } finally {
          setIsRetraining(false);
      }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'connected': return 'bg-green-500';
          case 'warning': return 'bg-yellow-500';
          case 'error': return 'bg-red-500';
          default: return 'bg-slate-500';
      }
  };

  const getStatusTextColor = (db: string, ai: string) => {
      if (db === 'error' || ai === 'error') return 'text-red-400';
      if (db === 'warning' || ai === 'warning') return 'text-yellow-400';
      return 'text-green-400';
  };

  // Mock Data for Charts
  const userGrowthData = [
    { name: 'Mon', users: 120 },
    { name: 'Tue', users: 132 },
    { name: 'Wed', users: 145 },
    { name: 'Thu', users: 150 },
    { name: 'Fri', users: 170 },
    { name: 'Sat', users: 190 },
    { name: 'Sun', users: 210 },
  ];

  const roleDistribution = [
    { name: 'Patients', value: 850 },
    { name: 'Doctors', value: 45 },
    { name: 'Admins', value: 5 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">System Administration</h2>
            <p className="text-slate-500">Monitor system health, user activity, and AI models</p>
        </div>
        <Button onClick={handleRetrain} isLoading={isRetraining} variant="secondary">
            <RefreshCw size={18} className={`mr-2 ${isRetraining ? 'animate-spin' : ''}`} />
            Retrain AI Model
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-slate-300">System Health</h3>
                <Server className={getStatusTextColor(health.db, health.ai)} size={20} />
            </div>
            <div className={`text-2xl font-bold ${getStatusTextColor(health.db, health.ai)} mb-4`}>
                {health.db === 'connected' && health.ai === 'connected' ? 'Operational' : 'Issues Detected'}
            </div>
            
            <div className="space-y-3 pt-2 border-t border-slate-700">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><Database size={14}/> Database</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(health.db)} animate-pulse`}></span>
                        <span className="text-slate-300 capitalize text-xs">{health.db}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2"><BrainCircuit size={14}/> AI Engine</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(health.ai)} animate-pulse`}></span>
                        <span className="text-slate-300 capitalize text-xs">{health.ai}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Total Users</h3>
                <Users className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
            </div>
            <div className="text-3xl font-bold text-slate-900">1,240</div>
            <div className="flex gap-2 text-xs mt-2">
                <span className="text-green-600 font-medium">+12 this week</span>
            </div>
        </div>
        
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-slate-500 group-hover:text-purple-600 transition-colors">AI Predictions</h3>
                <Activity className="text-purple-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-slate-900">892</div>
             <p className="text-xs text-slate-400 mt-2">Last 24 hours</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-slate-500 group-hover:text-orange-600 transition-colors">System Alerts</h3>
                <AlertCircle className="text-orange-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-slate-900">3</div>
            <p className="text-xs text-slate-400 mt-2">Requires attention</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
              <h3 className="font-bold text-slate-900 mb-6">User Growth (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300">
              <h3 className="font-bold text-slate-900 mb-6">User Role Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={roleDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {roleDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                    {roleDistribution.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                            {entry.name}
                        </div>
                    ))}
                </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300">
              <h3 className="font-bold text-slate-900 mb-4">Live System Logs</h3>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs h-80 overflow-y-auto space-y-2 custom-scrollbar">
                  {logs.length === 0 && <p className="text-slate-500 italic">No activity recorded yet.</p>}
                  {logs.map((log) => (
                      <div key={log.id} className="border-b border-slate-800 pb-1 last:border-0 hover:bg-slate-800/50 transition-colors">
                          <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`ml-2 font-bold ${log.method === 'GET' ? 'text-blue-400' : log.method === 'POST' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {log.method}
                          </span>
                          <span className="ml-2 text-slate-300">{log.endpoint}</span>
                          <span className={`ml-2 ${log.status >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                              {log.status}
                          </span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
