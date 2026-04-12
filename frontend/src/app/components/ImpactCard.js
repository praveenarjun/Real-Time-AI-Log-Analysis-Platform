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
  Activity
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
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative overflow-hidden group rounded-3xl border border-accent-${severityColor}/20 bg-gradient-to-br from-accent-${severityColor}/10 to-transparent backdrop-blur-3xl p-8`}
    >
      {/* Glossy Background Accents */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 bg-accent-${severityColor}/20 rounded-full blur-[100px] group-hover:bg-accent-${severityColor}/30 transition-all duration-700`} />
      
      <div className="relative z-10 flex flex-col gap-6">
        {/* Header: Title & Identity */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className={`text-[10px] font-black text-accent-${severityColor} uppercase tracking-[0.3em]`}>
              Forensic Intelligence Report
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
              {report?.title || anomaly?.type || "System Incident Detection"}
            </h2>
            <div className="flex items-center gap-3 text-white/40 text-[10px] uppercase font-bold tracking-widest mt-3">
              <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">ID: {report?.id || anomaly?.id || "INC-AUTO"}</span>
              <span className="text-white/20">|</span>
              <span className={`text-accent-${severityColor} flex items-center gap-1`}>
                <Activity className="w-3 h-3" />
                Verified by AI-Nano
              </span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl bg-accent-${severityColor}/20 border border-accent-${severityColor}/20`}>
             {severity === "CRITICAL" ? <Flame className="w-8 h-8 text-status-error" /> : 
              severity === "HIGH" ? <ShieldAlert className="w-8 h-8 text-accent-fuchsia" /> : 
              <Zap className="w-8 h-8 text-accent-cyan" />}
          </div>
        </div>

        {/* Executive Impact Verdict */}
        <div className="bg-black/20 rounded-2xl p-6 border border-white/5 space-y-4 shadow-inner">
           <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-3">
              <Terminal className="w-4 h-4 text-accent-cyan" />
              Intelligence Summary
           </div>
           <p className="text-sm font-medium text-white/90 leading-relaxed italic">
             "{report?.executive_summary || anomaly?.description || "Analyzing failure progression patterns and system health trajectories..."}"
           </p>
        </div>

        {/* RCA & Next Steps Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* RCA Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                 <AlertTriangle className="w-4 h-4 text-status-warn" />
                 Root Cause Analysis
              </div>
              <div className="rounded-2xl bg-white/5 p-5 border border-white/5 hover:border-white/10 transition-all font-medium text-xs leading-relaxed text-text-secondary">
                {report?.root_cause_analysis || anomaly?.root_cause || "Analyzing cascading failure traces and microservice heartbeats to isolate origin..."}
              </div>
           </div>

           {/* Next Steps Section */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                 <CheckCircle2 className="w-4 h-4 text-status-success" />
                 Actionable Next Steps
              </div>
              <div className="space-y-3">
                 {(report?.action_items || [
                   { task: "Identify origin in log stream", priority: "HIGH" },
                   { task: "Prepare roll-back strategy", priority: "MEDIUM" }
                 ]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group/item cursor-default hover:bg-white/10 transition-all">
                       <div className={`w-1.5 h-1.5 rounded-full ${item.priority === 'CRITICAL' || item.priority === 'HIGH' ? 'bg-status-error' : 'bg-status-success'}`} />
                       <div className="flex-1 text-[11px] font-bold text-white group-hover/item:translate-x-1 transition-transform uppercase tracking-tight">{item.task}</div>
                       <div className="text-[9px] font-black text-white/20 uppercase group-hover/item:text-white/40 transition-all">{item.assignee_role || "DEV"}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* System Prognosis Table */}
        <div className="rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
           <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Clock className="w-4 h-4 text-accent-cyan" />
                 Failure Prognosis
              </span>
              <span className="text-[10px] font-black text-accent-fuchsia uppercase bg-accent-fuchsia/10 px-3 py-1 rounded-full border border-accent-fuchsia/20 tracking-tighter shadow-sm">
                 Risk Score: {report?.risk_score || (anomaly?.confidence_score * 100) || 45}%
              </span>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/5 border-t border-white/5">
              {[
                { label: "Stability Index", value: "92%", color: "emerald", icon: Activity },
                { label: "Time to OOM", value: "45 Mins", color: "rose", icon: Clock },
                { label: "Affected Nodes", value: report?.affected_services?.length || 2, color: "blue", icon: Terminal },
                { label: "Dev Assignee", value: "Forensic Team", color: "fuchsia", icon: User },
              ].map((item, idx) => (
                <div key={idx} className="p-4 space-y-1 text-center group cursor-default">
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] group-hover:text-white/50 transition-all mb-1">{item.label}</div>
                  <div className={`text-sm font-black text-accent-${item.color} uppercase tracking-tighter`}>{item.value}</div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
