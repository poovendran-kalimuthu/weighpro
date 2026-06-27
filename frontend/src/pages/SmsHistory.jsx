import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw, MessageSquare, AlertCircle, Eye, RefreshCcw, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

export default function SmsHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSms, setSelectedSms] = useState(null);
  const [retryMobileNumber, setRetryMobileNumber] = useState('');
  const [retryLoading, setRetryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/sms/history', { status: statusFilter, limit: 100 });
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenDetails = (sms) => {
    setSelectedSms(sms);
    setRetryMobileNumber(sms.mobileNumber || '');
  };

  const handleRetry = async (id) => {
    setRetryLoading(true);
    try {
      await api.post(`/sms/retry/${id}`, { mobileNumber: retryMobileNumber });
      fetchHistory(); // Refresh
      setSelectedSms(null);
    } catch (e) {
      alert("Failed to retry SMS: " + e.message);
    } finally {
      setRetryLoading(false);
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'SENT': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'PROCESSING': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'FAILED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SMS Queue & History</h2>
          <p className="text-slate-500 mt-1">View outgoing SMS messages and their delivery status.</p>
        </div>
        <button onClick={fetchHistory} className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh Log
        </button>
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-80">
            {/* Search not implemented on backend for SMS yet, just filter by status for now */}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-600 cursor-pointer">
            <option>All</option>
            <option>PENDING</option>
            <option>PROCESSING</option>
            <option>SENT</option>
            <option>FAILED</option>
          </select>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Retry</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">No SMS records found.</td></tr>
                ) : history.map((sms, idx) => (
                  <motion.tr key={sms._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }} className="hover:bg-primary-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800 font-mono text-xs">{sms.ticketNo}</td>
                    <td className="px-6 py-4 text-slate-600">{sms.customerName || '—'}</td>
                    <td className="px-6 py-4 text-slate-700 font-mono text-xs">{sms.mobileNumber}</td>
                    <td className="px-6 py-4">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-bold border', statusColor(sms.status))}>{sms.status}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs text-center">{sms.retryCount}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenDetails(sms)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedSms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800">SMS Details</h3>
                <button onClick={() => setSelectedSms(null)} className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100"><XCircle className="w-5 h-5"/></button>
              </div>
                            <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Message Content</p>
                  <div className="mt-1 p-4 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-wrap font-mono text-sm text-slate-700">
                    {selectedSms.message}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Recipient Mobile Number</p>
                  <input 
                    type="text" 
                    value={retryMobileNumber} 
                    onChange={e => setRetryMobileNumber(e.target.value)} 
                    placeholder="e.g. +919976017475"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Change this number to send/retry the SMS to a different recipient.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                     <span className={cn('mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold border', statusColor(selectedSms.status))}>{selectedSms.status}</span>
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-slate-500 uppercase">Created At</p>
                     <p className="mt-1 text-sm text-slate-800 font-medium">{new Date(selectedSms.createdAt).toLocaleString()}</p>
                   </div>
                   {selectedSms.status === 'SENT' && (
                     <div>
                       <p className="text-xs font-semibold text-slate-500 uppercase">Sent At</p>
                       <p className="mt-1 text-sm text-slate-800 font-medium">{new Date(selectedSms.sentAt).toLocaleString()}</p>
                     </div>
                   )}
                   {selectedSms.status === 'FAILED' && (
                     <div className="col-span-2">
                       <p className="text-xs font-semibold text-slate-500 uppercase">Failure Reason</p>
                       <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{selectedSms.failureReason || 'Unknown error'}</p>
                     </div>
                   )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => handleRetry(selectedSms._id)} 
                    disabled={retryLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {retryLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="w-4 h-4" />
                    )}
                    {selectedSms.status === 'SENT' ? 'Resend SMS' : 'Send / Retry Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
