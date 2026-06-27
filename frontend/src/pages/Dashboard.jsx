import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Truck, Scale, Users, Clock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [weighments, setWeighments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, w] = await Promise.all([
          api.get('/weighments/stats'),
          api.get('/weighments', { limit: 8 }),
        ]);
        setStats(s);
        setWeighments(Array.isArray(w) ? w : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = stats ? [
    { label: "Today's Weighments", value: stats.todayWeighments, icon: Scale, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Vehicles Inside', value: stats.activeVehicles, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Net Material Today (T)', value: stats.totalNetTodayTons, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Customers', value: stats.totalCustomers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ] : [];

  const statusColor = s => s === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : s === 'First Weight' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening at the weighbridge today.</p>
        </div>
        <button onClick={() => navigate('/weighment')} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-2">
          <Scale className="w-4 h-4" /> New Weighment
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, idx) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500">
                  <stat.icon className="w-24 h-24 text-slate-800" />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center shadow-inner`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Weighments</h3>
                <button onClick={() => navigate('/weighment')} className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</button>
              </div>
              <div className="overflow-x-auto">
                {weighments.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No weighments recorded yet.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                      <tr><th className="px-6 py-4">Ticket No</th><th className="px-6 py-4">Vehicle</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Net (kg)</th><th className="px-6 py-4">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {weighments.map(tx => (
                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-700 font-mono text-xs">{tx.ticketNo}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-700">{tx.vehicleNumber}</td>
                          <td className="px-6 py-4 text-slate-500">{tx.customerName}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{tx.netWeight > 0 ? tx.netWeight?.toLocaleString() : '—'}</td>
                          <td className="px-6 py-4"><span className={cn('px-3 py-1 rounded-full text-xs font-bold border', statusColor(tx.status))}>{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl shadow-xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="p-8 relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-primary-400" />
                  <h3 className="font-semibold text-primary-100">System Status</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold tracking-tight mb-2">MongoDB Connected</h4>
                  <p className="text-slate-400 text-sm">All data persisted to database</p>
                </div>
                <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Weighments Today</span><span className="font-mono text-emerald-400">{stats?.todayWeighments ?? 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Vehicles Inside</span><span className="font-mono text-amber-400">{stats?.activeVehicles ?? 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Active Customers</span><span className="font-mono text-primary-400">{stats?.totalCustomers ?? 0}</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
