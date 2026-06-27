import { useState, useEffect } from 'react';
import { Bell, Search, Scale } from 'lucide-react';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d) => {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <header className="h-20 bg-gradient-to-b from-dark-700 to-dark-800 border-b border-slate-200/50 flex items-center justify-between px-8 z-10 sticky top-0 shadow-lg">
      {/* Left: Search Bar & Pulse Dot */}
      <div className="flex items-center gap-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search vehicles, tickets... [Enter]" 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                  window.dispatchEvent(new CustomEvent('antigravity-global-search', { detail: query }));
                  e.target.value = '';
                }
              }
            }}
            className="w-full bg-slate-900 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono tracking-wider text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute inline-block"></span>
          <span className="ml-1.5 text-emerald-400">SCALE LINK ONLINE</span>
        </div>
      </div>

      {/* Right: Clock Readout, Notifications, Profile */}
      <div className="flex items-center gap-6">
        {/* Clock readout */}
        <div className="bg-black border border-slate-200/80 rounded px-4 py-1.5 text-right font-mono min-w-[140px] shadow-inner">
          <span className="block text-[9px] tracking-widest text-slate-500 uppercase leading-none mb-1">Console Time</span>
          <span className="text-[15px] font-bold text-amber-bright drop-shadow-[0_0_5px_rgba(255,196,84,0.4)]">{formatTime(time)}</span>
          <span className="block text-[9.5px] text-slate-400 mt-0.5">{formatDate(time)}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-500 cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </button>

        <div className="h-8 w-px bg-slate-200/40"></div>

        {/* User profile */}
        <div className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-slate-200/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-dim flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <span>AD</span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-700 leading-none">Admin User</span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
