import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, XCircle, Clock, Smartphone, RefreshCw, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function SmsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get('/sms/dashboard');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const statCards = stats ? [
    { label: 'Pending SMS', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Sent Today', value: stats.sentToday, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Failed Today', value: stats.failedToday, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ] : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SMS Gateway Dashboard</h2>
          <p className="text-slate-500 mt-1">Monitor automated SMS communications and mobile sync status.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStats} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
          </button>
          <button onClick={() => navigate('/sms/settings')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
          <button onClick={() => navigate('/sms/history')} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> View Queue
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, idx) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col">
               <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                 <Smartphone className="w-5 h-5 text-primary-600" /> Android Device Sync
               </h3>
               <div className="space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-semibold text-slate-800">Last Sync Time</p>
                     <p className="text-xs text-slate-500">{stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : 'Never'}</p>
                   </div>
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                     <Clock className="w-5 h-5 text-slate-400" />
                   </div>
                 </div>
                 
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                   <div>
                     <p className="text-sm font-semibold text-emerald-800">Gateway Status</p>
                     <p className="text-xs text-emerald-600">Active - Listening for Pending SMS</p>
                   </div>
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
