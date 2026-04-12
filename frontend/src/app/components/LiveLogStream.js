"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, ShieldCheck, ShieldAlert, Info, AlertTriangle, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getSeverityIcon = (level) => {
  switch (level?.toUpperCase()) {
    case 'ERROR': return <ShieldAlert className="w-3 h-3 text-status-error" />;
    case 'WARN': return <AlertTriangle className="w-3 h-3 text-status-warn" />;
    case 'INFO': return <Info className="w-3 h-3 text-status-info" />;
    default: return <ShieldCheck className="w-3 h-3 text-status-success" />;
  }
};

const getSeverityClass = (level) => {
  switch (level?.toUpperCase()) {
    case 'ERROR': return 'text-status-error bg-status-error/10';
    case 'WARN': return 'text-status-warn bg-status-warn/10';
    case 'INFO': return 'text-status-info bg-status-info/10';
    default: return 'text-status-success bg-status-success/10';
  }
};

export default function LiveLogStream({ logs = [], status = "connecting" }) {
  const scrollRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current && mounted) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, mounted]);

  const statusMap = {
    connected: { color: 'bg-status-success', text: 'NODE_ACTIVE_LINKED', icon: Radio },
    connecting: { color: 'bg-status-warn', text: 'ESTABLISHING_TUNNEL...', icon: Radio },
    disconnected: { color: 'bg-status-error', text: 'LINK_SEVERED_RETRYING', icon: Radio }
  };

  const currentStatus = statusMap[status] || statusMap.connecting;

  return (
    <div className="flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-6 px-4 py-2 border-b border-white/5 bg-white/5 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-accent-cyan" />
          <span className="mono-data text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-60">Ingestion_Stream_v2.rc</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-bg-primary border border-white/10 shadow-inner">
          <div className={`w-2 h-2 rounded-full ${currentStatus.color} ${status === 'connected' ? 'animate-pulse shadow-[0_0_8px_var(--status-success)]' : 'animate-ping'}`} />
          <span className={`mono-data text-[9px] font-black uppercase tracking-widest ${status === 'connected' ? 'text-status-success' : 'text-text-secondary'}`}>
            {currentStatus.text}
          </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-black/20 rounded-b-3xl border-x border-b border-white/5 p-6 overflow-y-auto space-y-4 mono-data custom-scrollbar shadow-inner"
      >
        <AnimatePresence initial={false}>
          {!mounted ? (
             <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-cyan/10 border-t-accent-cyan rounded-full animate-spin" />
             </div>
          ) : logs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20"
            >
               <div className="w-10 h-10 border-2 border-dashed border-accent-cyan rounded-xl animate-spin mb-4" />
               <p className="mono-data text-[10px] font-black tracking-[0.3em] uppercase italic text-accent-cyan">Negotiating_Secure_Link_Layer...</p>
            </motion.div>
          ) : (
            logs.map((log, idx) => (
              <motion.div 
                key={`${log.timestamp}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-6 text-[11px] group py-1.5 hover:bg-white/5 rounded-xl px-3 transition-all border border-transparent hover:border-white/5"
              >
                <span className="text-text-secondary whitespace-nowrap opacity-40 group-hover:opacity-100 transition-opacity tabular-nums border-r border-white/5 pr-4">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}ms
                </span>
                <div className="flex items-center gap-2 min-w-[70px]">
                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-current opacity-70 ${getSeverityClass(log.level)}`}>
                     {log.level || 'INFO'}
                   </span>
                </div>
                <span className="text-white/70 font-medium tracking-tight break-all group-hover:text-white transition-colors">
                   {log.message}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
