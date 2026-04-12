"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, Bell, Trash2, ShieldCheck, ArrowRight } from "lucide-react";

export default function AlertCenter({ isOpen, onClose, anomalies = [], onClear }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Alert Panel */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[400px] bg-bg-primary/95 backdrop-blur-3xl border-r border-white/10 z-[70] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-fuchsia/10 border border-accent-fuchsia/20 flex items-center justify-center">
                   <Bell className="w-5 h-5 text-accent-fuchsia animate-pulse" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase">Forensic Alerts</h2>
                   <div className="mono-data text-[9px] text-text-secondary uppercase tracking-widest opacity-60">
                      Real-time Neural Sentinel
                   </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-xl hover:bg-white/5 text-text-secondary hover:text-white transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alert List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
               {anomalies.length > 0 ? (
                 anomalies.map((anomaly, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={idx}
                      className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                    >
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${anomaly.severity === 'CRITICAL' ? 'bg-status-error' : 'bg-accent-fuchsia'}`} />
                       
                       <div className="flex justify-between items-start mb-3">
                          <span className={`mono-data text-[8px] font-black px-2 py-0.5 rounded border ${anomaly.severity === 'CRITICAL' ? 'text-status-error border-status-error/20 bg-status-error/10' : 'text-accent-fuchsia border-accent-fuchsia/20 bg-accent-fuchsia/10'} uppercase tracking-[0.2em]`}>
                             {anomaly.severity || 'FORENSIC_SIGNAL'}
                          </span>
                          <span className="mono-data text-[8px] text-white/20 uppercase font-black">
                             {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       
                       <h3 className="text-sm font-black text-white tracking-widest uppercase mb-1">{anomaly.type || 'Detection Event'}</h3>
                       <p className="text-[10px] text-text-secondary font-medium leading-relaxed opacity-60 mb-4 line-clamp-2 italic">
                          Behavioral pattern correlated with {anomaly.service || 'UNKNOWN'} service. Executing forensic extraction...
                       </p>

                       <button className="flex items-center gap-2 text-[9px] font-black text-accent-cyan uppercase tracking-widest group-hover:gap-4 transition-all">
                          View Deep Digest <ArrowRight className="w-3 h-3" />
                       </button>
                    </motion.div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-20">
                    <ShieldCheck className="w-16 h-16 text-accent-cyan mb-6" />
                    <p className="mono-data text-[10px] font-black tracking-[0.3em] uppercase max-w-[200px] leading-relaxed">
                       Neural Sentinel Scanning... All Channels Silent.
                    </p>
                 </div>
               )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5">
               <button 
                  onClick={onClear}
                  className="w-full py-4 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-text-secondary hover:text-white transition-all flex items-center justify-center gap-3 mono-data text-[10px] font-black tracking-[0.3em] uppercase group"
               >
                  <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Flush Alert Audit
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
