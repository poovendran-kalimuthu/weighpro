import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Package, UserCircle, Scale, LogOut, ChevronRight, MessageSquare, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Scale, label: 'Weighment Console', path: '/weighment' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Truck, label: 'Vehicles', path: '/vehicles' },
  { icon: Package, label: 'Materials', path: '/materials' },
  { icon: UserCircle, label: 'Drivers', path: '/drivers' },
  { icon: MessageSquare, label: 'SMS Gateway', path: '/sms' },
  { icon: Cpu, label: 'Serial Settings', path: '/serial/settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="bg-gradient-to-b from-dark-800 to-dark-900 border-r border-slate-200/50 h-screen flex flex-col relative z-20 transition-all duration-300 shadow-xl"
    >
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3.5 border-b border-slate-200/50">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-bright to-amber-dim flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
          <Scale className="w-5 h-5" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden whitespace-nowrap">
            <h1 className="font-display font-bold text-lg tracking-wider text-slate-700 uppercase">
              Antigravity <span className="text-primary-500">ERP</span>
            </h1>
            <p className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">Operator Panel</p>
          </motion.div>
        )}
      </div>

      {/* Collapse button */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 bg-slate-900 border border-slate-200 rounded-full p-1 shadow-md hover:border-amber transition-colors z-50 cursor-pointer"
      >
        <ChevronRight className={cn("w-3.5 h-3.5 text-amber transition-transform duration-300", collapsed ? "" : "rotate-180")} />
      </button>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative border border-transparent font-medium",
              isActive 
                ? "text-amber-bright font-semibold" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/30"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav" 
                    className="absolute inset-0 bg-primary-50 border border-amber/30 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon className={cn("w-4.5 h-4.5 shrink-0 relative z-10 transition-colors", isActive ? "text-amber" : "text-slate-400 group-hover:text-slate-700")} />
                {!collapsed && (
                  <span className="text-sm relative z-10 tracking-wide font-sans">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-200/50">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50/20 hover:text-red-500 transition-colors w-full group cursor-pointer border border-transparent hover:border-red-500/20">
          <LogOut className="w-4.5 h-4.5 shrink-0 text-slate-400 group-hover:text-red-500" />
          {!collapsed && <span className="text-sm tracking-wide">Exit Console</span>}
        </button>
      </div>
    </motion.aside>
  );
}
