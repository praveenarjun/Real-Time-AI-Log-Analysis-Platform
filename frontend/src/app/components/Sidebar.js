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
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Live Logs", icon: Terminal, href: "/logs" },
    { name: "AI Insights", icon: Bot, href: "/ai" },
    { name: "Workforce", icon: Users, href: "/workforce" },
  ];

  return (
    <div className="fixed left-6 top-6 bottom-6 w-20 flex flex-col items-center py-8 glass-panel rounded-3xl z-50">
      <div className="mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-8">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="relative group">
              <div className={`p-3 rounded-2xl transition-all duration-300 relative z-10 
                               ${isActive ? 'bg-white/10 text-accent-cyan' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-6 h-6" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <div className="bg-bg-secondary border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                  {item.name}
                </div>
              </div>

              {isActive && (
                <motion.div 
                    layoutId="active-pill"
                    className="absolute -left-2 top-0 bottom-0 w-1 bg-accent-cyan rounded-full" 
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-6 mt-auto">
        <button className="text-text-secondary hover:text-white transition-colors relative group">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent-fuchsia rounded-full border-2 border-bg-primary"></span>
        </button>
        <button className="text-text-secondary hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
