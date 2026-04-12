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
  Activity,
  Cpu
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
    <div className="fixed left-6 top-6 bottom-6 w-24 flex flex-col items-center py-12 glass-panel rounded-[2.5rem] z-50 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      {/* Platform Core Identity */}
      <div className="mb-16 relative group cursor-pointer">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-cyan/80 to-accent-blue/80 flex items-center justify-center border border-white/20 shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:scale-105 transition-all duration-500">
            <Cpu className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-primary border-2 border-white/5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_10px_var(--status-success)]" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-12">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative group">
              <div className={`p-4 rounded-2xl transition-all duration-500 relative z-10 border
                               ${isActive 
                                 ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan shadow-[0_0_30px_rgba(34,211,238,0.15)]' 
                                 : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5 hover:border-white/10'}`}>
                <item.icon className="w-6 h-6" />
              </div>
              
              {/* Technical Command Tooltip */}
              <div className="absolute left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none translate-x-4 group-hover:translate-x-0">
                <div className="bg-bg-secondary/95 backdrop-blur-3xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[160px]">
                   <div className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-1.5">{item.name}</div>
                   <div className="mono-data text-[9px] text-accent-cyan opacity-50 tracking-tighter truncate">{item.tech}</div>
                </div>
              </div>

              {/* Forensic Active Indicator */}
              {isActive && (
                <motion.div 
                    layoutId="active-marker"
                    className="absolute -left-3 top-2 bottom-2 w-1.5 bg-accent-cyan rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-10 mt-auto px-4 pb-4">
        <button className="relative group flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-all text-text-secondary hover:text-white border border-transparent hover:border-white/10">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-fuchsia rounded-full border border-bg-primary animate-ping"></span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent-fuchsia rounded-full border border-bg-primary shadow-[0_0_10px_var(--accent-fuchsia)]"></span>
        </button>
        
        <button className="flex items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-all text-text-secondary hover:text-white border border-transparent hover:border-white/10">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
