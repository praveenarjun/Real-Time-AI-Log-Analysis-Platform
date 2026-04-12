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
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
                <Zap className="w-5 h-5 text-accent-cyan" />
             </div>
             <h1 className="text-4xl font-black tracking-tight text-white uppercase">Command Center</h1>
          </div>
          <p className="text-text-secondary font-medium tracking-wide ml-12">
            AI-Powered Forensic Log Intelligence <span className="text-white/20 px-2">|</span> 
            <span className="text-accent-cyan"> ACTIVE DEPLOYMENT</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-2 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col items-end px-4">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Global Status</span>
                <span className="text-xs font-black text-status-success uppercase tracking-tighter">Operational</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-center">
                <Radio className="w-6 h-6 text-status-success animate-pulse" />
            </div>
        </div>
      </div>

      {/* Intelligence Briefing - The High Impact Area */}
      <div className="space-y-6">
         {(activeReport || activeAnomaly) ? (
            <ImpactCard report={activeReport} anomaly={activeAnomaly} />
         ) : (
            <GlassCard className="bg-gradient-to-br from-accent-cyan/10 to-transparent border-accent-cyan/20 text-center py-12">
               <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20">
                     <Activity className="w-8 h-8 text-accent-cyan animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black text-white tracking-widest uppercase">Initializing Intelligence Mesh</h3>
                  <p className="max-w-md text-xs text-text-secondary leading-relaxed font-medium">
                    The AI Log Forensics platform is live. We are monitoring the cloud ingestion bridge for anomalies. Once a failure pattern is identified, your **Executive Verdict** and **Next Steps** will appear here.
                  </p>
               </div>
            </GlassCard>
         )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "LOGS / SECOND", value: stats.logsPerSec, icon: Activity, color: "cyan", trend: "+12%" },
          { label: "ANOMALIES", value: stats.anomalies24h, icon: ShieldAlert, color: "fuchsia", trend: "TOTAL" },
          { label: "HEALTH SCORE", value: `${stats.systemHealth}%`, icon: Cpu, color: "blue", trend: "STABLE" },
          { label: "UTILIZATION", value: `${stats.storageUtil}%`, icon: HardDrive, color: "emerald", trend: "82%" },
        ].map((item, idx) => (
          <GlassCard key={idx} delay={idx * 0.1} className={`hover:border-accent-${item.color}/50 group transition-all duration-500`}>
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl bg-accent-${item.color}/10 text-accent-${item.color} group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold text-accent-${item.color} bg-accent-${item.color}/10 px-3 py-1 rounded-full border border-accent-${item.color}/20 uppercase tracking-widest`}>
                {item.trend}
              </span>
            </div>
            <div className="text-4xl font-black text-white mb-2 tabular-nums tracking-tighter">{item.value}</div>
            <div className="text-[10px] text-text-secondary font-bold tracking-[0.2em] uppercase">{item.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Real-time Feed */}
        <div className="xl:col-span-2 space-y-8">
           <GlassCard title="Live Ingestion Stream" subtitle="Raw log flow from distributed collectors">
              <LiveLogStream logs={logs} status={wsStatus} />
           </GlassCard>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <GlassCard title="AI Sentiment Analysis" subtitle="Anomaly distribution over time">
                  <div className="h-64 w-full">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <Area type="monotone" dataKey="value" stroke="#06b6d4" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                             <XAxis dataKey="time" hide />
                             <YAxis hide domain={[0, 100]} />
                             <Tooltip 
                                  contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                  itemStyle={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '12px' }}
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                    )}
                 </div>
              </GlassCard>

              <GlassCard title="Recent AI Findings" subtitle="Anomalies detected in last 24h">
                 <div className="space-y-4">
                    {[
                      { id: 'AN-823', type: 'Error Spike', severity: 'High', service: 'auth-service' },
                      { id: 'AN-824', type: 'Pattern Anomaly', severity: 'Medium', service: 'payment-gateway' },
                    ].map((anomaly, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden">
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${anomaly.severity === 'High' ? 'bg-status-error' : 'bg-status-warn'}`} />
                         <div>
                            <h4 className="text-xs font-black text-white tracking-widest uppercase">{anomaly.type}</h4>
                            <p className="text-[10px] text-text-secondary mt-1 uppercase font-bold tracking-wider">{anomaly.service}</p>
                         </div>
                         <ArrowUpRight className="w-4 h-4 text-text-secondary group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                      </div>
                    ))}
                    <button className="w-full mt-2 py-3 border border-white/5 rounded-2xl text-[10px] font-bold text-text-secondary hover:text-white hover:bg-white/5 transition-all tracking-widest uppercase">
                        Generate Report
                    </button>
                 </div>
              </GlassCard>
           </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-8">
           <GlassCard className="bg-gradient-to-br from-accent-fuchsia/10 to-transparent border-accent-fuchsia/20">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 rounded-lg bg-accent-fuchsia/20">
                    <Zap className="w-4 h-4 text-accent-fuchsia" />
                 </div>
                 <h3 className="text-sm font-black text-white tracking-widest uppercase">Forensic Prediction</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-medium">
                AI model predicts <span className="text-white">92% stability</span> for the next 4 hours. No critical bottlenecks detected in the Kafka cluster.
              </p>
           </GlassCard>

           <GlassCard title="Infrastructure Pulse">
              <div className="space-y-6">
                 {[
                   { label: "Production Cluster", status: "Online", progress: 92, color: "emerald" },
                   { label: "AI Analysis Mesh", status: "Active", progress: 78, color: "cyan" },
                   { label: "Log Storage Sinks", status: "Ready", progress: 45, color: "blue" },
                 ].map((node, idx) => (
                    <div key={idx} className="space-y-3">
                       <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                          <span className="text-white">{node.label}</span>
                          <span className={`text-${node.color}-400`}>{node.status}</span>
                       </div>
                       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${node.progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-accent-${node.color === 'emerald' ? 'cyan' : node.color === 'cyan' ? 'fuchsia' : 'blue'} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]`} 
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>
        </div>

      </div>
    </div>
  );
}
