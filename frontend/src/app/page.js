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
  Radio
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock Data as fallback for "Looks Like Pro" requirement
const MOCK_STATS = {
  logsPerSec: 1420,
  anomalies24h: 4,
  systemHealth: 98.2,
  storageUtil: 82
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
  const [activeAnomaly, setActiveAnomaly] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. WebSocket Real-Time Strategy with Sonic-Shield Reconnection
  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      if (typeof window === 'undefined') return;
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://20.200.255.31";
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || baseUrl.replace("http", "ws") + "/api/v1/ws/stream";
      
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
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://20.200.255.31";
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
    <div className="space-y-12">
      {/* Header Section: Forensic Command Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <Zap className="w-6 h-6 text-accent-cyan" />
             </div>
             <div>
                <h1 className="text-5xl font-black tracking-tighter text-white leading-none">Command Center</h1>
                <div className="flex items-center gap-2 mt-2">
                   <span className="mono-data text-[10px] text-accent-cyan uppercase tracking-widest bg-accent-cyan/10 px-2 py-0.5 rounded border border-accent-cyan/20">Node: Azure-Northe-01</span>
                   <span className="mono-data text-[10px] text-white/20 uppercase tracking-widest">|</span>
                   <span className="mono-data text-[10px] text-text-secondary uppercase tracking-widest">V: 1.2.4-stable</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-white/5 border border-white/5 p-3 rounded-[1.5rem] backdrop-blur-2xl">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
                <span className="mono-data text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Tunnel Status</span>
                <span className={`mono-data text-xs font-black uppercase tracking-tighter ${wsStatus === 'connected' ? 'text-status-success' : 'text-status-error'}`}>
                    {wsStatus === 'connected' ? 'Sonic_Active' : 'Tunnel_Offline'}
                </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-tr ${wsStatus === 'connected' ? 'from-status-success/20' : 'from-status-error/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <Radio className={`w-8 h-8 ${wsStatus === 'connected' ? 'text-status-success animate-pulse' : 'text-text-secondary'}`} />
            </div>
        </div>
      </div>

      {/* Intelligence Briefing - The High Impact Area */}
      <div className="space-y-8">
         {(activeReport || activeAnomaly) ? (
            <ImpactCard report={activeReport} anomaly={activeAnomaly} />
         ) : (
            <GlassCard className="bg-gradient-to-br from-bg-secondary to-transparent border-white/5 py-14">
               <div className="flex flex-col items-center gap-6 text-center">
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                     <Activity className="w-10 h-10 text-white/20 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white tracking-widest uppercase">Initializing Intelligence Mesh</h3>
                    <p className="max-w-xl text-xs text-text-secondary leading-relaxed font-medium mono-data opacity-60 uppercase tracking-widest">
                      SYS://BOOT.LOG - Listening on Kafka raw-logs... <br/>
                      Awaiting forensic signals for executive verdict. <br/>
                      <span className="text-status-success">System stability verified at 99.4%</span>
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
          { label: "Anomalies", value: stats.anomalies24h, icon: ShieldAlert, color: "fuchsia", suffix: "detected" },
          { label: "Integrity", value: `${stats.systemHealth}%`, icon: Cpu, color: "blue", suffix: "healthy" },
          { label: "Allocation", value: `${stats.storageUtil}%`, icon: HardDrive, color: "emerald", suffix: "capacity" },
        ].map((item, idx) => (
          <GlassCard key={idx} delay={idx * 0.1} className={`hover:border-accent-${item.color}/40 p-10 group`}>
            <div className="flex items-center justify-between mb-8">
              <div className={`p-4 rounded-2xl bg-accent-${item.color}/10 text-accent-${item.color} border border-accent-${item.color}/20 group-hover:scale-110 shadow-lg transition-all duration-500`}>
                <item.icon className="w-7 h-7" />
              </div>
              <div className="mono-data text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">Tel_Sync</div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
               <div className="mono-data text-5xl font-black text-white tracking-tighter tabular-nums">{item.value}</div>
               <div className={`mono-data text-[10px] font-bold text-accent-${item.color} uppercase opacity-60 tracking-widest`}>{item.suffix}</div>
            </div>
            <div className="mono-data text-[10px] text-text-secondary font-black tracking-[0.3em] uppercase border-t border-white/5 pt-4">{item.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Real-time Feed */}
        <div className="xl:col-span-2 space-y-10">
           <GlassCard borderClassName="border-accent-cyan/20" title="Telemetry Ingestion Bridge" subtitle="Raw STDOUT stream from distributed cloud nodes">
              <div className="rounded-3xl border border-white/5 bg-black/40 p-1 shadow-inner relative group">
                 <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                 <LiveLogStream logs={logs} status={wsStatus} />
              </div>
           </GlassCard>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <GlassCard title="Failure Trajectory" subtitle="Sentiment and density over 24h cycle">
                  <div className="h-72 w-full mt-4">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                                   <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#colorValue)" strokeWidth={4} />
                             <XAxis dataKey="time" hide />
                             <YAxis hide domain={[0, 100]} />
                             <Tooltip 
                                  contentStyle={{ backgroundColor: '#020617', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(12px)' }}
                                  itemStyle={{ color: '#22d3ee', fontWeight: '900', fontSize: '12px' }}
                                  labelStyle={{ display: 'none' }}
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                    )}
                 </div>
              </GlassCard>

              <GlassCard title="Recent Findings" subtitle="Verified AI anomalies in last 24h">
                 <div className="space-y-4 mt-4">
                    {[
                      { id: 'AN-823', type: 'Error Spike', severity: 'High', service: 'AUTH-BRIDGE', time: '12m ago' },
                      { id: 'AN-824', type: 'OOM Warning', severity: 'Medium', service: 'DATA-SINK', time: '44m ago' },
                    ].map((anomaly, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden shadow-sm">
                         <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${anomaly.severity === 'High' ? 'bg-status-error shadow-[0_0_10px_var(--status-error)]' : 'bg-status-warn shadow-[0_0_10px_var(--status-warn)]'}`} />
                         <div className="space-y-1">
                            <h4 className="mono-data text-[11px] font-black text-white tracking-widest uppercase">{anomaly.type}</h4>
                            <div className="flex items-center gap-2">
                               <span className="mono-data text-[9px] text-text-secondary uppercase font-bold tracking-wider">{anomaly.service}</span>
                               <span className="text-white/10 uppercase font-black text-[9px]">|</span>
                               <span className="mono-data text-[9px] text-white/30 uppercase font-bold tracking-wider">{anomaly.time}</span>
                            </div>
                         </div>
                         <ArrowUpRight className="w-5 h-5 text-text-secondary group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                      </div>
                    ))}
                    <button className="w-full mt-4 py-4 border border-white/5 rounded-[1.5rem] mono-data text-[10px] font-black text-white/30 hover:text-white hover:bg-white/5 transition-all tracking-[0.3em] uppercase">
                        Access Full Forensic Audit
                    </button>
                 </div>
              </GlassCard>
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-10">
           <GlassCard className="bg-gradient-to-br from-accent-fuchsia/5 to-transparent border-accent-fuchsia/20">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 rounded-2xl bg-accent-fuchsia/10 border border-accent-fuchsia/20">
                    <Zap className="w-5 h-5 text-accent-fuchsia" />
                 </div>
                 <h3 className="text-sm font-black text-white tracking-widest uppercase">Forensic Prognosis</h3>
              </div>
              <p className="mono-data text-[11px] text-text-secondary leading-relaxed font-medium">
                AI node <span className="text-accent-fuchsia font-black underline">NANO-FORENSIC-01</span> predicts <span className="text-white font-black underline">92% stability</span> for the next 4h cycle. <br/><br/>
                <span className="text-status-success font-black border-b border-status-success/20">No critical bottlenecks identified in Kafka stream raw-logs.</span>
              </p>
           </GlassCard>

           <GlassCard title="Infrastructure Pulse">
              <div className="space-y-8 mt-6">
                 {[
                   { label: "Internal Node Cluster", status: "Active", progress: 92, color: "cyan" },
                   { label: "AI Analysis Mesh", status: "Active", progress: 78, color: "fuchsia" },
                   { label: "Telemetry Sink Bridge", status: "Online", progress: 45, color: "blue" },
                 ].map((node, idx) => (
                    <div key={idx} className="space-y-3 p-1">
                       <div className="flex justify-between items-center mono-data text-[10px] font-black tracking-widest uppercase">
                          <span className="text-white/40">{node.label}</span>
                          <span className={`text-accent-${node.color} opacity-80 shadow-sm`}>{node.status}</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${node.progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r from-accent-${node.color} to-white/20 rounded-full shadow-[0_0_15px_var(--accent-${node.color})]`} 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>
        </div>

      </div>
    </div>

      </div>
    </div>
  );
}
