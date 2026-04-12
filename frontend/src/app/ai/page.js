"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import GlassCard from "../components/GlassCard";
import { 
  Bot, 
  BrainCircuit, 
  Zap, 
  Search, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MessageSquareShare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState(null);

  const triggerAnalysis = () => {
    setAnalyzing(true);
    // Simulate AI Processing
    setTimeout(() => {
      setInsight({
        id: "INS-042",
        title: "Cluster Stability Anomaly",
        summary: "The AI agent has detected a slight increase in latency across the Auth microservices. This pattern historically correlates with database connection pool exhaustion.",
        recommendation: "Increase the max_connections parameter on the DB cluster or investigate the auth-service connection cleanup logic.",
        confidence: 94
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-10 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-accent-fuchsia/10 border border-accent-fuchsia/20">
                <Bot className="w-6 h-6 text-accent-fuchsia" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase">AI Intelligence Hub</h1>
          </div>
          <p className="text-text-secondary text-sm font-medium tracking-wide">
             Automated anomaly detection and predictive system maintenance.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-accent-fuchsia/10 rounded-2xl border border-accent-fuchsia/20 shadow-[0_0_20px_rgba(217,70,239,0.1)]">
           <Zap className="w-4 h-4 text-accent-fuchsia animate-pulse" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">Model: GPT-4-Forensic-v2.1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis Column */}
        <div className="lg:col-span-2 space-y-8">
           <GlassCard title="Request Manual Deep-Dive" subtitle="Ask the AI agent to perform a specific system audit">
              <div className="flex gap-4">
                 <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                      type="text" 
                      placeholder="e.g. 'Analyze the last 2 hours of auth failures'..." 
                      className="w-full bg-black/20 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-accent-fuchsia/50 transition-all"
                    />
                 </div>
                 <button 
                  onClick={triggerAnalysis}
                  disabled={analyzing}
                  className="px-8 py-4 bg-accent-fuchsia rounded-2xl text-xs font-black text-white uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all flex items-center gap-2 group disabled:opacity-50"
                 >
                    {analyzing ? (
                       <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                    ) : (
                       <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    )}
                    {analyzing ? "ANALYZING..." : "ANALYZE"}
                 </button>
              </div>
           </GlassCard>

           <AnimatePresence>
             {insight && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.4 }}
               >
                 <GlassCard className="bg-gradient-to-br from-accent-fuchsia/10 to-transparent border-accent-fuchsia/30">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent-fuchsia/20 flex items-center justify-center">
                             <TrendingUp className="w-6 h-6 text-accent-fuchsia" />
                          </div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">{insight.title}</h2>
                       </div>
                       <span className="text-[10px] font-black text-accent-fuchsia bg-white/5 px-4 py-1.5 rounded-full border border-accent-fuchsia/20 tracking-widest uppercase">
                          {insight.confidence}% CONFIDENCE
                       </span>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-black/40 rounded-3xl border border-white/5 leading-relaxed text-sm text-text-primary font-medium">
                          {insight.summary}
                       </div>

                       <div className="flex items-start gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                          <div className="p-2 rounded-lg bg-status-success/10 mt-1">
                             <ShieldCheck className="w-5 h-5 text-status-success" />
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Recommended Action</h4>
                             <p className="text-xs text-text-secondary leading-relaxed font-medium">{insight.recommendation}</p>
                          </div>
                       </div>
                    </div>
                 </GlassCard>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
           <GlassCard title="Active Agents" subtitle="Tracking agent availability">
              <div className="space-y-4">
                 {[
                   { name: "DETECTOR-01", status: "Active", icon: Cpu, color: "fuchsia" },
                   { name: "PREDICTOR-V2", status: "Active", icon: TrendingUp, color: "blue" },
                   { name: "SUPERVISOR", status: "Idle", icon: MessageSquareShare, color: "cyan" },
                 ].map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="flex items-center gap-3">
                          <agent.icon className={`w-4 h-4 text-accent-${agent.color}`} />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">{agent.name}</span>
                       </div>
                       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{agent.status}</span>
                    </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard title="Model Health" className="bg-gradient-to-br from-accent-cyan/10 to-transparent">
              <div className="space-y-6">
                 <div className="text-center py-6">
                    <div className="text-4xl font-black text-white mb-2 tabular-nums tracking-tighter">0.12<span className="text-sm">s</span></div>
                    <div className="text-[10px] text-text-secondary font-bold tracking-[0.22em] uppercase">Average Inference Latency</div>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[88%] h-full bg-accent-cyan rounded-full" />
                 </div>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
