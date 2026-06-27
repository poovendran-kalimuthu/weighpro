import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, X, Loader2, Package } from 'lucide-react';
import { api } from '../lib/api';

const EMPTY = { name: '', category: '', rate: '', unit: 'Ton', status: 'Active' };
const UNITS = ['Ton', 'Kg', 'Bag', 'Litre', 'Cubic Meter', 'Pieces'];

function Modal({ material, onClose, onSaved }) {
  const [form, setForm] = useState(material ? { ...material } : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, rate: parseFloat(form.rate) || 0 };
      const result = material ? await api.put(`/materials/${material._id}`, payload) : await api.post('/materials', payload);
      if (result.message && !result._id) throw new Error(result.message);
      onSaved(result);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Package className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold text-slate-800">{material ? 'Edit Material' : 'Add New Material'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Material Name *</label>
              <input name="name" value={form.name} onChange={handle} required placeholder="e.g. Crushed Stone (20mm)" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category</label>
              <input name="category" value={form.category} onChange={handle} placeholder="e.g. Aggregates, Sand" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Billing Unit</label>
              <select name="unit" value={form.unit} onChange={handle} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white cursor-pointer">
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rate per Unit (₹)</label>
              <input name="rate" type="number" value={form.rate} onChange={handle} placeholder="550" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</label>
              <select name="status" value={form.status} onChange={handle} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white cursor-pointer">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}{material ? 'Save Changes' : 'Add Material'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try { const data = await api.get('/materials', { search, status: statusFilter }); setMaterials(Array.isArray(data) ? data : []); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleSaved = saved => {
    setMaterials(prev => { const idx = prev.findIndex(m => m._id === saved._id); if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; } return [saved, ...prev]; });
    setModal(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await api.delete(`/materials/${deleteId}`);
    setMaterials(prev => prev.filter(m => m._id !== deleteId));
    setDeleteId(null); setDeleting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-slate-800 tracking-tight">Material Inventory</h2><p className="text-slate-500 mt-1">Manage weighable products and standard rates.</p></div>
        <button onClick={() => setModal('add')} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-2"><Plus className="w-5 h-5" /> Add Material</button>
      </div>
      <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-600 cursor-pointer"><option>All</option><option>Active</option><option>Inactive</option></select>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div> : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10 backdrop-blur-sm">
                <tr><th className="px-6 py-4">Material Name</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Rate (₹)</th><th className="px-6 py-4">Unit</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">No materials found. Click "Add Material" to get started.</td></tr>
                  : materials.map((m, idx) => (
                    <motion.tr key={m._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="hover:bg-primary-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-800">{m.name}</td>
                      <td className="px-6 py-4 text-slate-600">{m.category || '—'}</td>
                      <td className="px-6 py-4 text-slate-800 font-bold">₹{m.rate?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-slate-500">{m.unit}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{m.status}</span></td>
                      <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setModal(m)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => setDeleteId(m._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <AnimatePresence>
        {(modal === 'add' || (modal && modal._id)) && <Modal material={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSaved={handleSaved} />}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-7 h-7 text-red-500" /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Material?</h3>
              <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60">{deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
