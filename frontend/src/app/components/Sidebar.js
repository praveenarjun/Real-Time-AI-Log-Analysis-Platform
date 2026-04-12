"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Terminal, 
  Bot, 
  Users, 
  Settings, 
  Bell,
  Activity
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/", tech: "fs://cmd/core" },
    { name: "Live Logs", icon: Terminal, href: "/logs", tech: "sh://proc/stdout" },
    { name: "AI Insights", icon: Bot, href: "/ai", tech: "ml://node/brain" },
    { name: "Workforce", icon: Users, href: "/workforce", tech: "db://sql/staff" },
  ];

  return (
    <div className="fixed left-6 top-6 bottom-6 w-24 flex flex-col items-center py-10 glass-panel rounded-[2.5rem] z-50 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Platform Core Identity */}
      <div className="mb-14 relative group cursor-pointer">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-cyan via-accent-blue to-accent-fuchsia flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
            <Activity className="w-7 h-7 text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-bg-primary border-2 border-white/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse shadow-[0_0_8px_var(--status-success)]" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-10">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative group">
              <div className={`p-4 rounded-2xl transition-all duration-500 relative z-10 border
                               ${isActive 
                                 ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                                 : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5 hover:border-white/10'}`}>
                <item.icon className="w-6 h-6" />
              </div>
              
              {/* Technical Command Tooltip */}
              <div className="absolute left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none translate-x-4 group-hover:translate-x-0">
                <div className="bg-bg-secondary/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl min-w-[140px]">
                   <div className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-1">{item.name}</div>
                   <div className="mono-data text-[9px] text-accent-cyan opacity-60 tracking-tighter truncate">{item.tech}</div>
                </div>
              </div>

              {/* Forensic Active Indicator */}
              {isActive && (
                <motion.div 
                    layoutId="active-marker"
                    className="absolute -left-3 top-2 bottom-2 w-1.5 bg-accent-cyan rounded-full shadow-[0_0_15px_var(--accent-cyan)]" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-8 mt-auto px-4">
        <button className="relative group flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-all text-text-secondary hover:text-white border border-transparent hover:border-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-fuchsia rounded-full border border-bg-primary animate-ping"></span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-fuchsia rounded-full border border-bg-primary shadow-[0_0_8px_var(--accent-fuchsia)]"></span>
        </button>
        
        <button className="flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-all text-text-secondary hover:text-white border border-transparent hover:border-white/5">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
