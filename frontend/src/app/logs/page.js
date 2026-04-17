"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";
import LiveLogStream from "../components/LiveLogStream";
import { useForensic } from "../context/ForensicContext";
import { 
  Terminal, 
  Search, 
  Filter, 
  Download, 
  Trash2,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

export default function LogsPage() {
  const { logs: realtimeLogs, wsStatus, activeAnomaly, activeReport } = useForensic();
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");

  // Fetch historical logs from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
        const res = await fetch(`${baseUrl}/api/v1/logs?limit=100`);
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setHistoricalLogs(data.logs);
          }
        }
      } catch (err) {
        console.warn("Backend unavailable for historical logs", err);
      }
    };

    fetchLogs();
  }, []);

  // Merge real-time WebSocket logs with historical ones
  const allLogs = [...realtimeLogs, ...historicalLogs].slice(0, 1000);

  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = (log.message || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });


  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Forensic Logs</h1>
            <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5 transition-all
              ${wsStatus === 'connected' ? 'bg-status-success/10 border-status-success/40 text-status-success shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-status-warn/10 border-status-warn/40 text-status-warn'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-status-success animate-pulse' : 'bg-status-warn'}`} />
               {wsStatus === 'connected' ? 'Live_Stream' : 'Connecting...'}
            </div>
          </div>
          <p className="text-text-secondary text-sm font-medium tracking-wide">
            Real-time telemetry and distributed system trace events.
          </p>
        </div>

        <div className="flex gap-4">
           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-text-secondary hover:text-white transition-all">
              <Download className="w-4 h-4" /> EXPORT
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-status-error/10 border border-status-error/20 rounded-xl text-xs font-bold text-status-error hover:bg-status-error/20 transition-all">
              <Trash2 className="w-4 h-4" /> CLEAR
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
           <GlassCard title="Search & Filter">
              <div className="space-y-6">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder="Search messages..." 
                      className="w-full bg-black/20 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-text-secondary focus:outline-none focus:border-accent-cyan/50 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-1">Severity Level</label>
                    <div className="flex flex-wrap gap-2">
                       {['ALL', 'INFO', 'WARN', 'ERROR'].map(level => (
                         <button 
                            key={level}
                            onClick={() => setFilterLevel(level)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all
                                       ${filterLevel === level ? 'bg-accent-cyan text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
                         >
                           {level}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-text-secondary mb-4">
                       <Calendar className="w-4 h-4" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Date Range</span>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-[10px] text-white/40 font-bold text-center">
                       LAST 24 HOURS (Default)
                    </div>
                 </div>
              </div>
           </GlassCard>

           <GlassCard className="bg-accent-cyan/5 border-accent-cyan/20">
              <div className="flex items-center gap-3 mb-4">
                 <Terminal className="w-4 h-4 text-accent-cyan" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Stream Statistics</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Live Buffer</span>
                    <span className="mono-data text-xs font-black text-accent-cyan">{realtimeLogs.length}</span>
                 </div>
                 <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Filtered Result</span>
                    <span className="mono-data text-xs font-black text-white">{filteredLogs.length}</span>
                 </div>
                 <p className="text-[9px] text-text-secondary font-medium italic leading-relaxed pt-2">
                   Direct connection to the Kafka Mesh established via API Gateway WebSocket Bridge.
                 </p>
              </div>
           </GlassCard>

           {/* --- NEW: AI Context Panel --- */}
           {(activeAnomaly || activeReport) && (
              <GlassCard className="bg-gradient-to-br from-status-error/10 to-transparent border-status-error/30 animate-pulse-slow">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-status-error animate-ping" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">AI Context Active</h3>
                 </div>
                 
                 {activeAnomaly && (
                    <div className="space-y-3 mb-4">
                       <span className="px-2 py-1 bg-status-error/20 text-status-error text-[8px] font-black rounded-lg uppercase tracking-widest border border-status-error/40">Anomaly Detected</span>
                       <p className="text-[10px] font-bold text-white/90 leading-relaxed italic">
                         &quot;{activeAnomaly.description || activeAnomaly.message}&quot;
                       </p>
                       <p className="text-[9px] font-medium text-text-secondary mt-1">
                         The AI is currently flagging logs matching this pattern in the stream to the right. 
                       </p>
                    </div>
                 )}

                 {activeReport && (
                    <div className="space-y-3 border-t border-white/10 pt-4">
                       <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Live Root Cause</h4>
                       <p className="text-[11px] font-bold text-status-warn leading-relaxed">
                          {activeReport.root_cause || activeReport.root_cause_analysis}
                       </p>
                    </div>
                 )}
              </GlassCard>
           )}
        </div>


        {/* Main Log View */}
        <div className="lg:col-span-3">
           <GlassCard className="h-full">
              <LiveLogStream logs={filteredLogs} />
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
