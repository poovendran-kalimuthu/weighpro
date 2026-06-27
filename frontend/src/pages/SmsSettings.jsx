import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Key, Settings as SettingsIcon, MessageSquare, AlertCircle, Globe, Smartphone } from 'lucide-react';
import { api } from '../lib/api';

export default function SmsSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.get('/settings');
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handle = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings(prev => ({ ...prev, [e.target.name]: value }));
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setMessage('Failed to save settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto h-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">SMS Configuration</h2>
        <p className="text-slate-500 mt-1">Manage global SMS rules, templates, and mobile app security.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">General Rules</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
              <div>
                <p className="font-semibold text-slate-800">Enable SMS System</p>
                <p className="text-xs text-slate-500 mt-1">Master switch to turn on/off SMS features.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="isSmsEnabled" checked={settings.isSmsEnabled} onChange={handle} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
              <div>
                <p className="font-semibold text-slate-800">Auto Send on Completion</p>
                <p className="text-xs text-slate-500 mt-1">Automatically queue SMS when 2nd weight is saved.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="autoSend" checked={settings.autoSend} onChange={handle} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Default Country Code</label>
              <input name="defaultCountryCode" value={settings.defaultCountryCode} onChange={handle} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Max Retry Count</label>
              <input type="number" name="maxRetryCount" value={settings.maxRetryCount} onChange={handle} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
        </div>

        {/* SMS Gateway Provider Selection */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Gateway Provider</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label 
                className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                  settings.smsProvider === 'android' 
                    ? 'border-primary-500 bg-primary-50/10 shadow-[0_0_15px_rgba(255,196,84,0.05)]' 
                    : 'border-slate-100 hover:border-slate-200 bg-transparent'
                }`}
              >
                <input 
                  type="radio" 
                  name="smsProvider" 
                  value="android" 
                  checked={settings.smsProvider === 'android'} 
                  onChange={handle} 
                  className="mt-1 accent-primary-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-slate-500" /> Android App Gateway
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Route SMS through your local Android device via native Sim Card.</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${
                  settings.smsProvider === 'twilio' 
                    ? 'border-primary-500 bg-primary-50/10 shadow-[0_0_15px_rgba(255,196,84,0.05)]' 
                    : 'border-slate-100 hover:border-slate-200 bg-transparent'
                }`}
              >
                <input 
                  type="radio" 
                  name="smsProvider" 
                  value="twilio" 
                  checked={settings.smsProvider === 'twilio'} 
                  onChange={handle} 
                  className="mt-1 accent-primary-600"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-500" /> Twilio Cloud SMS
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Deliver messages instantly via Twilio global SMS API.</span>
                </div>
              </label>
            </div>

            {settings.smsProvider === 'twilio' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-200/50"
              >
                <div className="space-y-1.5 col-span-1 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Twilio Account SID</label>
                  <input 
                    name="twilioSid" 
                    value={settings.twilioSid || ''} 
                    onChange={handle} 
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary-500/20" 
                  />
                </div>
                <div className="space-y-1.5 col-span-1 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Twilio Auth Token</label>
                  <input 
                    type="password"
                    name="twilioAuthToken" 
                    value={settings.twilioAuthToken || ''} 
                    onChange={handle} 
                    placeholder="Auth Token"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary-500/20" 
                  />
                </div>
                <div className="space-y-1.5 col-span-1 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase">Twilio Phone Number</label>
                  <input 
                    name="twilioPhoneNumber" 
                    value={settings.twilioPhoneNumber || ''} 
                    onChange={handle} 
                    placeholder="+1234567890"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary-500/20" 
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Message Template</h3>
          </div>
          <div className="p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{`{vehicleNo}`}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{`{grossWeight}`}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{`{tareWeight}`}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{`{netWeight}`}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{`{ticketNo}`}</span>
            </div>
            <textarea 
              name="messageTemplate" 
              value={settings.messageTemplate} 
              onChange={handle} 
              rows={6}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono" 
            />
          </div>
        </div>

        {settings.smsProvider === 'android' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Mobile App Security</h3>
            </div>
            <div className="p-6">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-800">This API Key must be entered into the Android Mobile Application to authenticate and receive SMS requests.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase">Gateway API Key</label>
                <input name="mobileApiKey" value={settings.mobileApiKey} onChange={handle} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-600 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-emerald-600">{message}</div>
          <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
