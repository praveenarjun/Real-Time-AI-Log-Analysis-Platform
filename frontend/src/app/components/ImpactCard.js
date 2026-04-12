"use client";

import React from "react";
import { 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Zap,
  Clock,
  User,
  Activity,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function ImpactCard({ report, anomaly }) {
  if (!report && !anomaly) return null;

  const severity = report?.severity || anomaly?.severity || "MEDIUM";
  const severityColor = 
    severity === "CRITICAL" ? "rose" : 
    severity === "HIGH" ? "fuchsia" : 
    severity === "MEDIUM" ? "amber" : "emerald";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden group rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-bg-secondary to-transparent backdrop-blur-3xl p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]`}
    >
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent-cyan) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      
      {/* Subtle Glow */}
      <div className={`absolute -right-32 -top-32 w-80 h-80 bg-accent-${severityColor}/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-accent-${severityColor}/20 transition-all duration-1000`} />
      
      <div className="relative z-10 flex flex-col gap-10">
        {/* Header: Title & Identity */}
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className={`px-2.5 py-1 rounded-md bg-accent-${severityColor}/10 border border-accent-${severityColor}/20 text-[10px] font-black text-accent-${severityColor} uppercase tracking-[0.3em]`}>
                    FORENSIC_SIG_INT
                </div>
                <div className="mono-data text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">
                    V: 2.1-ENGINE
                </div>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none max-w-2xl">
              {report?.title || anomaly?.type || "Anomaly Signal Detected"}
            </h2>
            <div className="flex items-center gap-4 mt-6">
                <span className="mono-data text-[10px] bg-white/5 px-3 py-1 rounded-full border border-white/10 text-white/60 font-black uppercase tracking-widest">INCIDENT_HASH: {report?.id?.substring(0,8) || anomaly?.id?.substring(0,8) || "0xDEADBEEF"}</span>
                <span className={`flex items-center gap-2 mono-data text-[10px] font-black uppercase tracking-[0.15em] text-accent-${severityColor}`}>
                    <Activity className="w-4 h-4" />
                    Verdict: {severity}
                </span>
            </div>
          </div>
          <div className={`w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-5 shadow-2xl relative overflow-hidden group-hover:border-accent-${severityColor}/40 transition-all duration-500`}>
             <div className={`absolute inset-0 bg-gradient-to-br from-accent-${severityColor}/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
             {severity === "CRITICAL" ? <Flame className="w-10 h-10 text-status-error animate-pulse" /> : 
              severity === "HIGH" ? <ShieldAlert className="w-10 h-10 text-accent-fuchsia" /> : 
              <Zap className="w-10 h-10 text-accent-cyan" />}
          </div>
        </div>

        {/* Executive Summary with Technical Flair */}
        <div className="relative">
           <div className="absolute -left-4 top-0 bottom-0 w-1 bg-accent-cyan/20 rounded-full" />
           <p className="text-lg font-medium text-white/90 leading-relaxed pl-6 italic max-w-3xl">
             "{report?.executive_summary || anomaly?.description || "Processing distributed telemetry streams for pattern correlation and executive verdict..."}"
           </p>
        </div>

        {/* Forensic Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {/* RCA Section */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                 <AlertTriangle className="w-4 h-4 text-status-warn" />
                 Forensic Root Cause
              </div>
              <div className="rounded-[2rem] bg-black/40 p-8 border border-white/5 hover:border-white/10 transition-all font-medium text-sm leading-relaxed text-text-secondary shadow-inner">
                {report?.root_cause_analysis || anomaly?.root_cause || "Analyzing microservice dependency tree and historical baselines to localize failure origin..."}
              </div>
           </div>

           {/* Mitigation Strategy */}
           <div className="space-y-6">
              <div className="flex items-center gap-3 text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                 <CheckCircle2 className="w-4 h-4 text-status-success" />
                 Mitigation Directives
              </div>
              <div className="space-y-4">
                 {(report?.action_items || [
                   { task: "Execute failover to secondary node", priority: "HIGH" },
                   { task: "Initialize stack trace audit", priority: "MEDIUM" }
                 ]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/item cursor-pointer hover:bg-white/10 transition-all">
                       <div className={`w-2 h-2 rounded-full ${item.priority === 'CRITICAL' || item.priority === 'HIGH' ? 'bg-status-error shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-status-success shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                       <div className="flex-1 text-xs font-black text-white group-hover/item:translate-x-1 transition-transform uppercase tracking-tight">{item.task}</div>
                       <ArrowRight className="w-4 h-4 text-white/10 group-hover/item:text-white/40 group-hover/item:translate-x-1 transition-all" />
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Technical Prognosis Bar */}
        <div className="rounded-[2rem] border border-white/5 bg-black/40 overflow-hidden shadow-inner flex flex-col lg:flex-row">
           <div className="p-8 lg:p-10 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                 <Clock className="w-5 h-5 text-accent-cyan" />
                 <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Forensic Signal</span>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{report?.risk_score || 78}%</span>
                 <span className="text-[10px] font-bold text-accent-fuchsia uppercase tracking-widest">Risk_Index</span>
              </div>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-3 flex-1">
              {[
                { label: "Confidence", value: `${(anomaly?.confidence_score * 100).toFixed(0) || 94}%`, color: "cyan" },
                { label: "Impact Radius", value: report?.affected_services?.length || 2, color: "blue", suffix: "Nodes" },
                { label: "Assignee", value: "Forensic_Lead", color: "fuchsia" },
              ].map((item, idx) => (
                <div key={idx} className="p-8 space-y-2 group cursor-default border-l border-white/5 first:border-l-0">
                  <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] group-hover:text-white/40 transition-all">{item.label}</div>
                  <div className={`text-lg font-black text-accent-${item.color} uppercase tracking-tighter`}>{item.value} {item.suffix && <span className="opacity-40">{item.suffix}</span>}</div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
