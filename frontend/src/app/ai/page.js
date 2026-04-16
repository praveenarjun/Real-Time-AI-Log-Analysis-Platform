"use client";

export const dynamic = "force-dynamic";

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
import { useForensic } from "../context/ForensicContext";

export default function AIForensicsStudio() {
  const { logs, activeAnomaly, activeReport: wsReport, wsStatus } = useForensic();
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

  // --- NEW: React to Live Streaming Analytics ---
  useEffect(() => {
    if (wsReport) {
      setReport({
        id: wsReport.id || wsReport.forensic_id || `RPT-FORENSIC-${Date.now().toString(36).toUpperCase()}`,
        title: wsReport.title || "Live Anomaly Analyzed",
        executive_summary: wsReport.executive_summary || wsReport.summary || "System anomaly detected and analyzed in real-time.",
        root_cause: wsReport.root_cause_analysis || wsReport.root_cause || "Pending root cause...",
        recommendations: wsReport.action_items || [
           { task: "Awaiting specific action items from AI core", priority: "WATCH" }
        ],
        confidence: wsReport.risk_score ? Math.max(0, 100 - wsReport.risk_score) : 92.4,
        severity: wsReport.severity || "HIGH"
      });
      addLog(`🚨 New Incident Report Synced from AI Mesh: ${wsReport.title || "Anomaly"}`);
    }
  }, [wsReport]);


  const handleGenerateReport = async () => {
    setAnalyzing(true);
    setReport(null);
    
    addLog("Initiating Deep Forensic Audit...");
    addLog("Connecting to AI Reasoning Core via backend...");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
      const res = await fetch(`${baseUrl}/api/v1/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: new Date(Date.now() - 3600000).toISOString(), to: new Date().toISOString() }),
      });

      if (res.ok) {
        const data = await res.json();
        addLog("Neural Pattern Match received from AI cluster.");
        addLog("Synthesizing Executive Briefing...");
        
        // Use real AI response if available, map to our report format
        const analysis = data.analysis || data.result || {};
        setReport({
          id: analysis.id || `RPT-FORENSIC-${Date.now().toString(36).toUpperCase()}`,
          title: analysis.title || analysis.type || "AI Forensic Analysis Complete",
          executive_summary: analysis.executive_summary || analysis.description || analysis.summary || "AI analysis completed. No critical anomalies detected in the current observation window.",
          root_cause: analysis.root_cause || analysis.rootCause || "No critical root cause identified. System operating within normal parameters.",
          recommendations: analysis.recommendations || [
            { task: "Continue monitoring ingestion pipeline", priority: "LOW" },
            { task: "Review Kafka consumer lag metrics", priority: "MEDIUM" },
          ],
          confidence: analysis.confidence || 94.2
        });
        addLog("Report Analysis Complete. Briefing delivered to Intelligence Hub.");
      } else {
        addLog(`AI Service returned status ${res.status}.`);
        setReport({
          id: "RPT-ERROR-" + Date.now().toString(36).toUpperCase(),
          title: "Service Unavailable",
          executive_summary: "The AI reasoning core is currently unreachable or processing other forensic requests. Please ensure the 'ai-service' and 'go-gateway' pods are healthy.",
          root_cause: `Endpoint returned HTTP ${res.status}. This may indicate a temporary outage or configuration mismatch.`,
          recommendations: [
            { task: "Check ai-service logs: kubectl logs -l app=ai-service", priority: "HIGH" },
            { task: "Verify AZURE_OPENAI_API_KEY in K8s secrets", priority: "MEDIUM" },
          ],
          confidence: 0.0
        });
        addLog("Analysis failed. Displaying system diagnostic report.");
      }
    } catch (err) {
      addLog(`Communication error: ${err.message}.`);
      setReport({
        id: "RPT-UNREACHABLE",
        title: "Telemetry Discovery Failed",
        executive_summary: "Unable to establish a secure link with the AI analysis cluster. Forensic audit aborted.",
        root_cause: `The frontend cannot reach the backend API Gateway (${baseUrl}). Verify the service ingress and public IP.`,
        recommendations: [
          { task: "Verify ingress.yml configuration for 'back.praveen-challa.tech'", priority: "HIGH" },
          { task: "Ensure the local .env NEXT_PUBLIC_API_URL matches reality", priority: "MEDIUM" },
        ],
        confidence: 0.0
      });
      addLog("Fallback diagnostic report generated.");
    } finally {
      setAnalyzing(false);
    }
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
                          <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Impact Severity</div>
                          <div className={`text-4xl font-black tabular-nums ${report.severity === 'CRITICAL' ? 'text-status-error animate-pulse' : 'text-status-warn'}`}>
                             {report.severity || "HIGH"}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                             <Activity className="w-4 h-4 text-accent-cyan" />
                             Forensic Verdict
                          </div>
                          <div className="text-sm font-medium text-text-secondary leading-relaxed p-6 rounded-3xl bg-black/40 border border-white/5 italic">
                             &quot;{report.executive_summary}&quot;
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
                             {(Array.isArray(report.recommendations) ? report.recommendations : []).map((item, idx) => (
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
                       <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Active Intelligence Feed</h4>
                    </div>
                    <p className="text-[11px] font-medium text-text-secondary leading-relaxed">
                       {activeAnomaly ? (
                         <>
                           Live Anomaly Detected in <span className="text-white font-black underline">{activeAnomaly.service_name}</span>. 
                           Forensic match: <span className="text-status-warn">{activeAnomaly.message.substring(0, 100)}...</span>
                         </>
                       ) : report ? (
                         <>
                           Analysis result for report <span className="text-white font-black">{report.id}</span> is now active in reasoning core.
                         </>
                       ) : (
                         "Awaiting tactical directives. Monitoring distributed telemetry mesh for anomalies..."
                       )}
                    </p>
                 </div>

                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase mb-4">Live Telemetry</div>
                    {[
                      { label: "Active Logs", value: `${logs.length}`, color: "cyan" },
                      { label: "Context Window", value: "128k", color: "fuchsia" },
                      { label: "Reasoning Time", value: analyzing ? "Running..." : "1.2s", color: "blue" },
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
                   { name: "REASONER-NODE", status: analyzing ? "Analyzing..." : "Idle", risk: logs.length > 50 ? "High" : "Low" },
                   { name: "PATTERN-BRAIN", status: wsStatus === "connected" ? "Live" : "Standby", risk: "Low" },
                   { name: "TACTICAL-GO", status: "Active", risk: "Low" },
                 ].map((node, i) => (
                    <div key={i} className="flex items-center justify-between group">
                       <div className="space-y-1">
                          <div className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-accent-fuchsia transition-colors">{node.name}</div>
                          <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{node.status}</div>
                       </div>
                       <div className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${node.risk === 'High' ? 'border-status-error/20 text-status-error bg-status-error/5' : 'border-white/5 text-white/30'}`}>
                          {node.risk === 'High' ? 'Risk_Critical' : `Risk_${node.risk}`}
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
