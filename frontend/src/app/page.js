"use client";

import GlassCard from "./components/GlassCard";
import { Activity, ShieldAlert, Cpu, HardDrive, ArrowUpRight, Clock8 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">System Overview</h1>
        <p className="text-[#94a3b8]">Operational health and real-time anomaly tracking.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="group hover:border-cyan-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">1,240</div>
          <div className="text-xs text-[#64748b] font-medium tracking-wide">LOGS / SECOND</div>
        </GlassCard>

        <GlassCard className="group hover:border-fuchsia-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-400/10 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">4</div>
          <div className="text-xs text-[#64748b] font-medium tracking-wide">ANOMALIES DETECTED</div>
        </GlassCard>

        <GlassCard className="group hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">HEALTHY</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">98.2<span className="text-sm font-medium text-[#64748b] ml-1">%</span></div>
          <div className="text-xs text-[#64748b] font-medium tracking-wide">SYSTEM HEALTH SCORE</div>
        </GlassCard>

        <GlassCard className="group hover:border-emerald-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">82%</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">2.4<span className="text-sm font-medium text-[#64748b] ml-1">TB</span></div>
          <div className="text-xs text-[#64748b] font-medium tracking-wide">STORAGE UTILIZATION</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Anomalies List */}
        <GlassCard title="Recent AI Findings" subtitle="Anomalies detected in the last 24 hours" className="lg:col-span-2">
          <div className="space-y-4">
            {[
              { id: 'AN-823', type: 'Error Spike', severity: 'High', service: 'auth-service', time: '12m ago' },
              { id: 'AN-824', type: 'Pattern Anomaly', severity: 'Medium', service: 'payment-gateway', time: '1h ago' },
              { id: 'AN-825', type: 'Resource Exhaustion', severity: 'Critical', service: 'db-cluster-01', time: '3h ago' },
            ].map((anomaly, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${
                    anomaly.severity === 'Critical' ? 'bg-status-error' : 
                    anomaly.severity === 'High' ? 'bg-status-warn' : 'bg-status-info'
                  }`} />
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wider">{anomaly.type}</h4>
                    <p className="text-xs text-[#64748b] mt-1">Affecting <span className="text-white font-medium">{anomaly.service}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white tracking-widest">{anomaly.id}</p>
                    <div className="flex items-center gap-1 mt-1 text-[#64748b]">
                      <Clock8 className="w-3 h-3" />
                      <span className="text-[10px] break-all">{anomaly.time}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-[#64748b] group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border border-white/5 rounded-xl text-xs font-bold text-[#64748b] hover:text-white hover:bg-white/5 transition-all text-center">
            VIEW ALL INCIDENTS
          </button>
        </GlassCard>

        {/* System Activity Hub */}
        <div className="space-y-8">
          <GlassCard title="Security Pulse" subtitle="Real-time threat monitoring">
            <div className="h-40 flex items-end gap-2 px-2">
              {[40, 70, 45, 90, 65, 80, 50, 75, 60, 85].map((val, idx) => (
                <div 
                  key={idx} 
                  className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500 rounded-t-sm transition-all duration-500 hover:opacity-80" 
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-bold text-[#64748b] tracking-widest">
              <span>00:00</span>
              <span>12:00</span>
              <span>NOW</span>
            </div>
          </GlassCard>

          <GlassCard title="Node Status" className="bg-gradient-to-br from-fuchsia-500/5 to-transparent">
             <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-medium">Production Clusters</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Online</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-emerald-500 rounded-full" />
                </div>
                <div className="flex justify-between items-center text-xs pt-2">
                    <span className="text-white font-medium">AI Analysis Pipeline</span>
                    <span className="text-cyan-400 font-bold uppercase tracking-wider">Active</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[78%] h-full bg-cyan-500 rounded-full" />
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
