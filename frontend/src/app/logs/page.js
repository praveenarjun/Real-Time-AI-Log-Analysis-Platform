"use client";

import { useEffect, useState, useRef } from "react";
import GlassCard from "../components/GlassCard";
import { Terminal, Download, Trash2, Play, Pause, Search } from "lucide-react";

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filter, setFilter] = useState("");
  const scrollRef = useRef(null);

  // Simulation for demonstration
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(() => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: Math.random() > 0.1 ? 'INFO' : 'ERROR',
        service: ['auth-service', 'api-gateway', 'payment-node'][Math.floor(Math.random() * 3)],
        message: 'Handling incoming request - Status: 200 OK'
      };
      
      setLogs(prev => [...prev.slice(-49), newLog]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Log Stream</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Real-time telemetry from all connected services.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              isStreaming ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/50' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
            }`}
          >
            {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isStreaming ? "PAUSE STREAM" : "RESUME STREAM"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Download className="w-4 h-4" />
            EXPORT
          </button>
        </div>
      </div>

      <GlassCard className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
        <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-xs font-bold text-[#64748b]">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="tracking-widest uppercase">Streaming raw telemetry</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                <Search className="w-3 h-3 text-[#64748b]" />
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  className="bg-transparent border-none outline-none text-[10px] text-white w-40"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
             </div>
             <button 
                onClick={() => setLogs([])}
                className="text-[#64748b] hover:text-status-error transition-colors"
             >
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-3 terminal-font text-xs"
        >
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#64748b] gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
               Waiting for incoming logs...
            </div>
          ) : logs.map((log) => (
            <div key={log.id} className="grid grid-cols-[160px_80px_120px_1fr] gap-4 p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group">
              <span className="text-[#64748b] shrink-0 font-medium">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] w-fit ${
                log.level === 'ERROR' ? 'bg-status-error/10 text-status-error' : 'bg-cyan-500/10 text-cyan-400'
              }`}>{log.level}</span>
              <span className="text-white font-semibold truncate group-hover:text-fuchsia-400 transition-colors uppercase tracking-tight">{log.service}</span>
              <span className="text-[#94a3b8] break-all">{log.message}</span>
            </div>
          ))}
        </div>
        
        <footer className="h-10 border-t border-white/5 bg-white/[0.01] px-6 flex items-center justify-between">
           <div className="text-[10px] text-[#64748b] font-medium tracking-wide">
              CONNECTED NODES: 8 | BUFFER: {logs.length}/50
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
           </div>
        </footer>
      </GlassCard>
    </div>
  );
}
