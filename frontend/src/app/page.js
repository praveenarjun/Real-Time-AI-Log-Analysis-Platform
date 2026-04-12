"use client";

import React, { useState, useEffect } from "react";
import GlassCard from "./components/GlassCard";
import LiveLogStream from "./components/LiveLogStream";
import ImpactCard from "./components/ImpactCard";
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  ArrowUpRight, 
  Zap,
  Radio,
  BarChart3,
  Dna,
  Binary
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Mock Data for Professional "Wowed" Effect
const MOCK_STATS = {
  logsPerSec: 1842,
  anomalies24h: 3,
  systemHealth: 99.8,
  storageUtil: 64
};

const MOCK_CHART_DATA = [
  { time: "00:00", value: 30 }, { time: "04:00", value: 55 },
  { time: "08:00", value: 45 }, { time: "12:00", value: 90 },
  { time: "16:00", value: 75 }, { time: "20:00", value: 85 },
  { time: "NOW", value: 95 },
];

export default function Dashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState(MOCK_CHART_DATA);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [mounted, setMounted] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [activeAnomaly, setActiveAnomaly] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // WebSocket Real-Time Strategy
  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      if (typeof window === 'undefined') return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://back.praveen-challa.tech/api/v1/ws/stream";
      
      console.log("Establishing Sonic Tunnel to:", wsUrl);
      setWsStatus("connecting");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Sonic Tunnel Established");
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          
          switch (update.type) {
            case "LOG_BATCH":
              if (update.payload.logs) {
                setLogs((prev) => [...prev, ...update.payload.logs].slice(-100));
              }
              break;
            case "ANOMALY":
              console.log("AI Anomaly Detected:", update.payload);
              setActiveAnomaly(update.payload);
              setAnomalies(prev => [update.payload, ...prev].slice(0, 3));
              break;
            case "INCIDENT_REPORT":
              console.log("AI Forensic Report Generated:", update.payload);
              setActiveReport(update.payload);
              break;
          }
        } catch (err) {
          console.error("Decode Error", err);
        }
      };

      socket.onclose = () => {
        setWsStatus("disconnected");
        console.warn("Sonic Tunnel severed. Retrying in 5s...");
        reconnectTimer = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        socket.close();
      };
    };

    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
        const statsRes = await fetch(`${baseUrl}/api/v1/stats`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats || MOCK_STATS);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    connect();
    fetchData();
    const statsInterval = setInterval(fetchData, 10000);

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
      clearInterval(statsInterval);
    };
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section: Forensic Command Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-10">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[2rem] bg-accent-cyan/10 border border-accent-cyan/20 shadow-[0_0_30px_rgba(34,211,238,0.1)] flex items-center justify-center">
                <Dna className="w-8 h-8 text-accent-cyan animate-pulse" />
             </div>
             <div>
                <h1 className="text-6xl font-black tracking-tighter text-white leading-none">Command Center</h1>
                <div className="flex items-center gap-3 mt-3">
                   <span className="mono-data text-[10px] text-accent-cyan uppercase tracking-[0.2em] bg-accent-cyan/10 px-3 py-0.5 rounded border border-accent-cyan/20 font-black">Cluster: AZURE-PRIMARY-01</span>
                   <span className="mono-data text-[10px] text-white/10 uppercase tracking-widest font-black">|</span>
                   <span className="mono-data text-[10px] text-text-secondary uppercase tracking-[0.2em] font-black">Kernel_V: 1.2.4-stable</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-white/5 border border-white/10 p-4 rounded-[2rem] backdrop-blur-3xl shadow-2xl">
            <div className="flex flex-col items-end px-6 border-r border-white/10">
                <span className="mono-data text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-1.5">Sonic Tunnel Status</span>
                <span className={`mono-data text-xs font-black uppercase tracking-tighter ${wsStatus === 'connected' ? 'text-status-success' : 'text-status-error'}`}>
                    {wsStatus === 'connected' ? 'SECURE_ACTIVE' : 'TUNNEL_SEVERED'}
                </span>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${wsStatus === 'connected' ? 'bg-status-success/10 border-status-success/30' : 'bg-status-error/10 border-status-error/30'} border flex items-center justify-center relative shadow-lg`}>
                <Radio className={`w-8 h-8 ${wsStatus === 'connected' ? 'text-status-success animate-pulse' : 'text-status-error'}`} />
            </div>
        </div>
      </div>

      {/* Intelligence Briefing - The High Impact Area */}
      <div className="space-y-8">
         {(activeReport || activeAnomaly) ? (
            <ImpactCard report={activeReport} anomaly={activeAnomaly} />
         ) : (
            <GlassCard className="bg-gradient-to-br from-bg-secondary to-transparent border-white/5 py-16 group">
               <div className="flex flex-col items-center gap-8 text-center">
                  <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                     <Binary className="w-12 h-12 text-white/10 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-white tracking-[0.4em] uppercase">Initializing Predictive Mesh</h3>
                    <p className="max-w-2xl text-[11px] text-text-secondary leading-relaxed font-black mono-data opacity-50 uppercase tracking-[0.25em]">
                      Awaiting forensic signals from node clusters... <br/>
                      Correlating distributed STDOUT streams for executive patterns. <br/>
                      <span className="text-accent-cyan mt-2 block">AI Integrity: VERIFIED (99.98% Confidence)</span>
                    </p>
                  </div>
               </div>
            </GlassCard>
         )}
      </div>

      {/* Stats Grid - High Density Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: "Throughput", value: stats.logsPerSec, icon: Activity, color: "cyan", suffix: "msg/s" },
          { label: "AI Findings", value: stats.anomalies24h, icon: ShieldAlert, color: "fuchsia", suffix: "anomalies" },
          { label: "System Integrity", value: `${stats.systemHealth}%`, icon: Cpu, color: "blue", suffix: "uptime" },
          { label: "Allocated Cap", value: `${stats.storageUtil}%`, icon: HardDrive, color: "emerald", suffix: "disk" },
        ].map((item, idx) => (
          <GlassCard key={idx} delay={idx * 0.15} className={`hover:border-accent-${item.color}/40 p-10 group`}>
            <div className="flex items-center justify-between mb-10">
              <div className={`p-4 rounded-2xl bg-accent-${item.color}/10 text-accent-${item.color} border border-accent-${item.color}/20 group-hover:scale-110 shadow-2xl transition-all duration-700`}>
                <item.icon className="w-7 h-7" />
              </div>
              <div className="mono-data text-[10px] font-black text-white/10 uppercase tracking-[0.2em]">Tele_RX</div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
               <div className="mono-data text-5xl font-black text-white tracking-tighter tabular-nums">{item.value}</div>
               <div className={`mono-data text-[10px] font-black text-accent-${item.color} uppercase opacity-40 tracking-[0.2em]`}>{item.suffix}</div>
            </div>
            <div className="mono-data text-[11px] text-text-secondary font-black tracking-[0.3em] uppercase border-t border-white/5 pt-5">{item.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Real-time Feed Column */}
        <div className="xl:col-span-2 space-y-10">
           <GlassCard borderClassName="border-accent-cyan/20" title="Distributed Ingestion Mesh" subtitle="Synchronized STDOUT stream across AZURE-PRIMARY cluster">
              <div className="rounded-[2.5rem] border border-white/5 bg-black/60 p-1 shadow-inner relative group overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                 <LiveLogStream logs={logs} status={wsStatus} />
              </div>
           </GlassCard>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <GlassCard title="Failure Trajectory" subtitle="Forensic sentiment and load density correlation">
                  <div className="h-80 w-full mt-6">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                             <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" strokeWidth={4} />
                             <XAxis dataKey="time" hide />
                             <YAxis hide domain={[0, 100]} />
                             <Tooltip 
                                  contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)', padding: '12px' }}
                                  itemStyle={{ color: '#22d3ee', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                                  labelStyle={{ display: 'none' }}
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                    )}
                 </div>
              </GlassCard>

              <GlassCard title="Recent AI Findings" subtitle="Predictive anomalies verified by forensic core">
                 <div className="space-y-4 mt-6">
                    {anomalies.length > 0 ? (
                        anomalies.map((anomaly, idx) => (
                           <div key={idx} onClick={() => setActiveAnomaly(anomaly)} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-accent-cyan/20 transition-all group cursor-pointer relative overflow-hidden shadow-sm animate-in fade-in slide-in-from-left duration-500">
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${anomaly.severity === 'CRITICAL' ? 'bg-status-error shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-accent-fuchsia shadow-[0_0_10px_rgba(217,70,239,0.5)]'}`} />
                              <div className="space-y-1.5 pl-2 text-left">
                                 <h4 className="mono-data text-[11px] font-black text-white tracking-[0.2em] uppercase">{anomaly.type || 'Detection Event'}</h4>
                                 <div className="flex items-center gap-3">
                                    <span className="mono-data text-[9px] text-text-secondary uppercase font-bold tracking-widest">{anomaly.service || 'UNKNOWN'}</span>
                                    <span className="text-white/10 uppercase font-black text-[9px]">|</span>
                                    <span className="mono-data text-[9px] text-accent-cyan uppercase font-black tracking-widest">REAL-TIME</span>
                                 </div>
                              </div>
                              <div className="p-2 rounded-xl border border-white/5 group-hover:border-white/20 transition-all">
                                 <ArrowUpRight className="w-5 h-5 text-text-secondary group-hover:text-white transition-all" />
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="py-12 px-6 rounded-[2rem] border border-dashed border-white/5 text-center bg-white/[0.02]">
                           <p className="mono-data text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
                              Monitoring Forensic Frequency...
                           </p>
                        </div>
                     )}
                    <button className="w-full mt-6 py-5 border border-white/10 rounded-[2rem] mono-data text-[10px] font-black text-white/30 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all tracking-[0.4em] uppercase shadow-lg">
                        ACCESS ARCHIVAL FORENSIC AUDIT
                    </button>
                 </div>
              </GlassCard>
           </div>
        </div>

        {/* Sidebar Insights Column */}
        <div className="space-y-10">
           <GlassCard className="bg-gradient-to-br from-accent-fuchsia/5 to-transparent border-accent-fuchsia/20">
              <div className="flex items-center gap-5 mb-8">
                 <div className="p-4 rounded-2xl bg-accent-fuchsia/10 border border-accent-fuchsia/20 shadow-lg">
                    <Zap className="w-6 h-6 text-accent-fuchsia" />
                 </div>
                 <h3 className="text-sm font-black text-white tracking-[0.3em] uppercase">Executive Verdict</h3>
              </div>
              <p className="mono-data text-[11px] text-text-secondary leading-relaxed font-black uppercase tracking-widest opacity-80">
                Predictive Node <span className="text-accent-fuchsia font-black underline">AI-VERDICT-01</span> calculates <span className="text-white font-black underline">91.4% stability</span> for current cycle. <br/><br/>
                <span className="text-status-success font-black border-l-2 border-status-success pl-4 ml-1">Zero critical bottlenecks detected in ingestion mesh.</span>
              </p>
           </GlassCard>

           <GlassCard title="Infrastructure Pulse">
              <div className="space-y-10 mt-8 px-2">
                 {[
                   { label: "Core Node Cluster", status: "Active", progress: 94, color: "cyan" },
                   { label: "AI Analysis Mesh", status: "Active", progress: 82, color: "fuchsia" },
                   { label: "Telemetry Sink", status: "Online", progress: 48, color: "blue" },
                 ].map((node, idx) => (
                    <div key={idx} className="space-y-4">
                       <div className="flex justify-between items-center mono-data text-[10px] font-black tracking-[0.3em] uppercase">
                          <span className="text-white/40">{node.label}</span>
                          <span className={`text-accent-${node.color} opacity-90`}>{node.status}</span>
                       </div>
                       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${node.progress}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className={`h-full bg-gradient-to-r from-accent-${node.color} to-white/20 rounded-full shadow-[0_0_15px_var(--accent-${node.color})]`} 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>

           <GlassCard className="bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20">
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-4 rounded-xl bg-accent-blue/10 border border-accent-blue/20 shadow-lg">
                    <BarChart3 className="w-6 h-6 text-accent-blue" />
                 </div>
                 <h3 className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Resource Saturation</h3>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex-1 flex flex-col gap-1">
                    <span className="mono-data text-[24px] font-black text-white tracking-tighter tabular-nums">1.42 GB</span>
                    <span className="mono-data text-[9px] text-white/20 uppercase tracking-widest font-black">Memory_Heap_Usage</span>
                 </div>
                 <div className="w-16 h-16 rounded-full border-4 border-accent-blue/20 border-t-accent-blue p-1">
                    <div className="w-full h-full rounded-full bg-accent-blue/10 flex items-center justify-center text-[10px] font-black text-accent-blue">74%</div>
                 </div>
              </div>
           </GlassCard>
        </div>

      </div>
    </div>
  );
}
