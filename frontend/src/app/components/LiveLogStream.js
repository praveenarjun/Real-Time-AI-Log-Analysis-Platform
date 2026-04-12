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
    <div className="flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-cyan" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-80">INGESTION_STREAM_V1</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
          <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.color} ${status === 'connected' ? 'animate-pulse' : 'animate-ping'}`} />
          <span className={`text-[9px] font-black uppercase tracking-tighter ${status === 'connected' ? 'text-status-success' : 'text-text-secondary'}`}>
            {currentStatus.text}
          </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 overflow-y-auto space-y-2 terminal-font custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {!mounted ? (
             <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent-cyan/20 border-t-accent-cyan rounded-full animate-spin" />
             </div>
          ) : logs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="h-full flex flex-col items-center justify-center text-center py-10"
            >
               <div className="w-8 h-8 border-2 border-dashed border-accent-cyan rounded-full animate-spin mb-3" />
               <p className="text-[10px] font-bold tracking-widest uppercase italic text-accent-cyan">Negotiating Secure Cloud Handshake...</p>
            </motion.div>
          ) : (
            logs.map((log, idx) => (
              <motion.div 
                key={`${log.timestamp}-${idx}`}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-4 text-[11px] group py-0.5 hover:bg-white/5 rounded px-1 transition-all"
              >
                <span className="text-[#64748b] whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity tabular-nums">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter min-w-[50px] text-center ${getSeverityClass(log.level)}`}>
                  {log.level || 'INFO'}
                </span>
                <span className="text-white/80 font-medium tracking-tight break-all border-l border-white/10 pl-4 group-hover:text-white transition-colors">
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
