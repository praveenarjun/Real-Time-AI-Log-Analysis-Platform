"use client";

import React, { useState, useEffect, useRef } from "react";
import GlassCard from "../components/GlassCard";
import { 
  Bot, 
  BrainCircuit, 
  Zap, 
  Search, 
  Cpu, 
  ShieldCheck,
  TrendingUp,
  Terminal,
  Activity,
  ChevronRight,
  Sparkles,
  FileSearch,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIForensicsStudio() {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([
    "Initializing Forensic Reasoning Node [v2.4]...",
    "Connected to Distributed Telemetry Mesh.",
    "Awaiting tactical directives..."
  ]);
  const consoleEndRef = useRef(null);

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [consoleLogs]);

  const addLog = (msg) => {
    setConsoleLogs(prev => [...prev.slice(-15), `> ${msg}`]);
  };

  const handleGenerateReport = () => {
    setAnalyzing(true);
    setReport(null);
    
    addLog("Initiating Deep Forensic Audit...");
    setTimeout(() => addLog("Scanning distributed STDOUT streams across 8 nodes..."), 500);
    setTimeout(() => addLog("Correlating Auth-Service latency with DB connection spikes..."), 1200);
    setTimeout(() => addLog("Neural Pattern Match: SIG-823 (Critical Pattern)"), 2000);
    setTimeout(() => addLog("Synthesizing Executive Briefing..."), 2800);

    // Final Report Generation
    setTimeout(() => {
      setReport({
        id: "RPT-FORENSIC-082",
        title: "Auth Stability Anomaly: Connection Cascade",
        executive_summary: "A memory leak in the auth-v2 microservice cluster is causing a cascading failure in the Redis connection pool. Stability has dropped 12.4% in the last hour.",
        root_cause: "Goroutine leak detected in /pkg/auth/session_manager.go:L142. Non-terminated ticker channels are pinning memory pages.",
        recommendations: [
          { task: "Update auth-service to v2.4.1 (Hotfix-L2)", priority: "CRITICAL" },
          { task: "Flush redis-primary-01 connection table", priority: "HIGH" },
          { task: "Scale auth-v2 group to 6 replicas", priority: "MEDIUM" }
        ],
        confidence: 98.4
      });
      setAnalyzing(false);
      addLog("Report Analysis Complete. Briefing delivered to Intelligence Hub.");
    }, 4000);
  };

  return (
    <div className="space-y-12 max-w-[1400px]">
      {/* Header: Intelligence Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-accent-fuchsia/10 border border-accent-fuchsia/20 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                <BrainCircuit className="w-8 h-8 text-accent-fuchsia" />
             </div>
             <div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">AI Forensics Studio</h1>
                <div className="flex items-center gap-3 mt-3">
                   <div className="w-2 h-2 rounded-full bg-status-success animate-pulse shadow-[0_0_10px_#10b981]" />
                   <span className="mono-data text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Active Reasoning Node [ID: AX-09] online</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/5 shadow-2xl">
           <div className="px-6 border-r border-white/10 text-right">
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Architecture</div>
              <div className="mono-data text-xs font-black text-white tracking-tighter">LANG-GRAPH V1.2</div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                 <Cpu className="w-6 h-6 text-accent-cyan" />
              </div>
              <div>
                 <div className="text-[14px] font-black text-white tracking-tight">92.4%</div>
                 <div className="text-[8px] font-bold text-accent-cyan/60 uppercase tracking-widest">Model_Accuracy</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Left: Logic Console */}
        <div className="xl:col-span-2 space-y-10">
           <GlassCard borderClassName="border-accent-fuchsia/20" className="p-0">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-4">
                    <Terminal className="w-5 h-5 text-accent-fuchsia" />
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">AI Reasoning Core</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all">
                       DEBUG CONSOLE
                    </button>
                    <button 
                      onClick={handleGenerateReport}
                      disabled={analyzing}
                      className="px-6 py-2.5 rounded-full bg-accent-fuchsia text-[9px] font-black text-white uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                       {analyzing ? "SYNTHESIZING..." : "GENERATE FULL REPORT"}
                    </button>
                 </div>
              </div>

              <div className="p-8 bg-black/40 min-h-[400px] flex flex-col justify-between">
                 <div className="space-y-4 font-mono text-sm leading-relaxed">
                    {consoleLogs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i} 
                        className="flex gap-4"
                      >
                         <ChevronRight className="w-4 h-4 text-accent-fuchsia/40 mt-1 shrink-0" />
                         <span className="text-text-secondary">{log}</span>
                      </motion.div>
                    ))}
                    {analyzing && (
                      <div className="flex items-center gap-4">
                         <div className="w-2 h-2 bg-accent-fuchsia rounded-full animate-ping" />
                         <span className="text-accent-fuchsia italic">AI is reasoning through distributed STACK TRACES...</span>
                      </div>
                    )}
                    <div ref={consoleEndRef} />
                 </div>

                 <div className="mt-10 relative">
                    <input 
                      type="text"
                      placeholder="Inquire about an anomaly or request a root cause report..."
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent-fuchsia/50 transition-all font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-accent-fuchsia/20 rounded-lg border border-accent-fuchsia/30">
                       <Sparkles className="w-4 h-4 text-accent-fuchsia" />
                    </div>
                 </div>
              </div>
           </GlassCard>

           <AnimatePresence>
             {report && (
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -30 }}
                 className="space-y-10"
               >
                 <div className="flex items-center gap-3">
                   <FileSearch className="w-6 h-6 text-accent-cyan" />
                   <h2 className="text-xl font-black text-white uppercase tracking-widest">Intelligence Briefing Delivered</h2>
                 </div>

                 <GlassCard className="bg-gradient-to-br from-accent-cyan/10 to-transparent border-accent-cyan/20">
                    <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                       <div className="space-y-3">
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{report.title}</h3>
                          <div className="flex items-center gap-4">
                             <span className="mono-data text-[10px] text-accent-cyan bg-accent-cyan/10 px-3 py-1 rounded border border-accent-cyan/20 font-black">{report.id}</span>
                             <span className="mono-data text-[10px] text-white/20 font-black uppercase">Confidence: {report.confidence}%</span>
                          </div>
                       </div>
                       <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-end justify-center min-w-[160px]">
                          <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Risk Score</div>
                          <div className="text-4xl font-black text-white tabular-nums">94%</div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                             <Activity className="w-4 h-4 text-accent-cyan" />
                             Forensic Verdict
                          </div>
                          <div className="text-sm font-medium text-text-secondary leading-relaxed p-6 rounded-3xl bg-black/40 border border-white/5 italic">
                             "{report.executive_summary}"
                          </div>
                          <div className="space-y-3">
                             <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Root Cause Analysis</div>
                             <div className="text-[12px] font-bold text-status-warn bg-status-warn/5 border border-status-warn/20 p-5 rounded-2xl">
                                {report.root_cause}
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                             <ShieldCheck className="w-4 h-4 text-status-success" />
                             Tactical Remediation
                          </div>
                          <div className="space-y-3">
                             {report.recommendations.map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-1.5 h-1.5 rounded-full ${item.priority === 'CRITICAL' ? 'bg-status-error shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-status-success'}`} />
                                     <span className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform">{item.task}</span>
                                  </div>
                                  <span className={`text-[8px] font-black uppercase tracking-widest py-1 px-3 rounded-md bg-white/5 ${item.priority === 'CRITICAL' ? 'text-status-error' : 'text-text-secondary'}`}>{item.priority}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </GlassCard>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Right: Insight Analytics */}
        <div className="space-y-10">
           <GlassCard title="Insights Hub" className="bg-gradient-to-br from-accent-cyan/10 to-transparent">
              <div className="space-y-8">
                 <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                       <AlertTriangle className="w-5 h-5 text-status-warn" />
                       <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Root Cause Potential</h4>
                    </div>
                    <p className="text-[11px] font-medium text-text-secondary leading-relaxed">
                       Memory leak suspected in pod <span className="text-white font-black underline">auth-v2-4x9z</span>. Usage spike from 256MB to 1.4GB detected.
                    </p>
                 </div>

                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase mb-4">Model Performance</div>
                    {[
                      { label: "Tokens / Sec", value: "124", color: "cyan" },
                      { label: "Context Window", value: "128k", color: "fuchsia" },
                      { label: "Reasoning Time", value: "1.2s", color: "blue" },
                    ].map((stat, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border border-white/5 rounded-2xl bg-white/[0.02]">
                         <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</span>
                         <span className={`mono-data text-xs font-black text-accent-${stat.color}`}>{stat.value}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </GlassCard>

           <GlassCard title="Active Agents">
              <div className="space-y-6">
                 {[
                   { name: "REASONER-NODE", status: "Active", risk: "Low" },
                   { name: "PATTERN-BRAIN", status: "Processing", risk: "Medium" },
                   { name: "TACTICAL-GO", status: "Idle", risk: "Low" },
                 ].map((node, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="space-y-1">
                          <div className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-accent-fuchsia transition-colors">{node.name}</div>
                          <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{node.status}</div>
                       </div>
                       <div className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${node.risk === 'Medium' ? 'border-status-warn/20 text-status-warn bg-status-warn/5' : 'border-white/5 text-white/30'}`}>
                          Risk_{node.risk}
                       </div>
                    </div>
                 ))}
                 <button className="w-full py-4 border border-white/5 hover:border-white/20 bg-white/5 rounded-2xl text-[9px] font-black text-white/30 hover:text-cyan transition-all uppercase tracking-[0.4em] mt-4">
                    SYNC_MESH
                 </button>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
