
import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, RefreshCw, Globe, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PaymentDashboard = () => {
  const [loading, setLoading] = useState(false);

  // Mock Data for Payments
  const payments = [
    { id: 'pi_3Nxj...', user: 'Dr. Sarah Smith', amount: 49.00, currency: 'USD', status: 'succeeded', date: '2023-10-24 10:30', plan: 'Professional Monthly', method: 'Visa •• 4242' },
    { id: 'pi_3Nxi...', user: 'Clinic Care Center', amount: 199.00, currency: 'USD', status: 'succeeded', date: '2023-10-24 09:15', plan: 'Enterprise Yearly', method: 'Mastercard •• 8844' },
    { id: 'pi_3Nxh...', user: 'John Doe', amount: 0.00, currency: 'USD', status: 'succeeded', date: '2023-10-23 14:20', plan: 'Patient Basic', method: '-' },
    { id: 'pi_3Nxg...', user: 'Dr. James Wilson', amount: 49.00, currency: 'USD', status: 'failed', date: '2023-10-23 11:05', plan: 'Professional Monthly', method: 'Visa •• 1111' },
    { id: 'pi_3Nxf...', user: 'City Hospital', amount: 249.00, currency: 'USD', status: 'refunded', date: '2023-10-22 16:45', plan: 'Enterprise Monthly', method: 'Amex •• 0005' },
  ];

  // Mock Webhook Logs
  const webhooks = [
    { id: 'evt_1...', type: 'invoice.payment_succeeded', status: 200, time: '10:30:05 AM' },
    { id: 'evt_2...', type: 'customer.subscription.created', status: 200, time: '10:30:01 AM' },
    { id: 'evt_3...', type: 'payment_intent.succeeded', status: 200, time: '09:15:22 AM' },
    { id: 'evt_4...', type: 'invoice.payment_failed', status: 200, time: 'Yesterday' },
  ];

  const revenueData = [
      { name: 'Mon', amount: 1200 },
      { name: 'Tue', amount: 1800 },
      { name: 'Wed', amount: 1400 },
      { name: 'Thu', amount: 2200 },
      { name: 'Fri', amount: 2800 },
      { name: 'Sat', amount: 3200 },
      { name: 'Sun', amount: 3800 },
  ];

  const handleRefresh = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Payments & Billing</h2>
            <p className="text-slate-500">Monitor revenue, subscriptions, and Stripe webhooks</p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.open('https://dashboard.stripe.com', '_blank')}>
                <ExternalLinkIcon /> Open Stripe Dashboard
            </Button>
            <Button onClick={handleRefresh} isLoading={loading}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Revenue (Oct)" value="$12,450" icon={DollarSign} color="bg-green-500" />
          <StatCard title="Active Subscriptions" value="142" icon={CheckCircle} color="bg-blue-500" />
          <StatCard title="Failed Payments" value="3" icon={XCircle} color="bg-red-500" />
          <StatCard title="MRR" value="$4,200" icon={Clock} color="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Payments Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Live Data</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Plan / User</th>
                            <th className="px-6 py-3 font-medium">Method</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                        ${p.status === 'succeeded' ? 'bg-green-100 text-green-700' : 
                                          p.status === 'refunded' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                                        {p.status === 'succeeded' && <CheckCircle size={12} />}
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">${p.amount}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{p.plan}</div>
                                    <div className="text-xs text-slate-500">{p.user}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                                    <CreditCard size={14} /> {p.method}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{p.date.split(' ')[0]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>

          {/* Webhook Logs */}
          <div className="bg-slate-900 text-slate-300 rounded-xl shadow-md p-6 flex flex-col h-full">
               <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                   <Globe size={18} className="text-teal-400" /> Webhook Events
               </h3>
               <div className="flex-1 space-y-3 font-mono text-xs overflow-y-auto max-h-[400px] custom-scrollbar">
                   {webhooks.map(w => (
                       <div key={w.id} className="border-b border-slate-800 pb-2 mb-2 last:mb-0 last:border-0 hover:bg-white/5 p-2 rounded transition-colors">
                           <div className="flex justify-between mb-1">
                               <span className="text-teal-400">{w.type}</span>
                               <span className="text-slate-500">{w.time}</span>
                           </div>
                           <div className="flex justify-between">
                               <span className="text-slate-500">{w.id}</span>
                               <span className="bg-green-900 text-green-300 px-1.5 rounded">{w.status} OK</span>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6">Revenue Growth (Weekly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
            <Icon size={24} className="text-white fill-current" /> 
            {/* Note: In real implementation, handle color classes properly or use inline styles for the icon color logic */}
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
    </div>
);

const ExternalLinkIcon = () => (
    <ArrowUpRight size={16} className="mr-2" />
);
