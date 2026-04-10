"use client";

import { useState, useEffect, useRef } from "react";
import GlassCard from "../components/GlassCard";
import { Send, Cpu, ShieldCheck, Sparkles, Terminal, Reply } from "lucide-react";

export default function AIChat() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Ready for forensics. Detected 4 anomalies in the last hour. How can I assist with your investigation?', time: '10:45 AM' }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: "Analyzing telemetry for your query... Root cause seems to be a memory leak in the 'auth-service' pod under high concurrent load. Would you like a detailed remediation report?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-fuchsia-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Cpu className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Forensics Studio</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Active reasoning node online</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 rounded-xl text-xs font-bold text-[#94a3b8] bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              DEBUG CONSOLE
           </button>
           <button className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/20 hover:scale-105 transition-all flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              GENERATE FULL REPORT
           </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex gap-8">
        <GlassCard className="flex-[3] p-0 flex flex-col overflow-hidden relative border-[#1e293b]">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                    msg.role === 'user' 
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                      : 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-400'
                  }`}>
                    {msg.role === 'user' ? <ShieldCheck className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl relative shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/90 text-white rounded-tr-none border border-blue-400/30' 
                      : 'bg-white/5 text-[#e2e8f0] rounded-tl-none border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[10px] absolute -bottom-6 ${msg.role === 'user' ? 'right-0' : 'left-0'} text-[#64748b] font-medium`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-6 bg-white/[0.01] border-t border-white/5">
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-fuchsia-500/50 transition-all group overflow-hidden">
               <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inquire about an anomaly or request a root cause report..." 
                  className="flex-1 bg-transparent px-6 py-5 text-sm text-white outline-none border-none"
               />
               <button 
                  type="submit"
                  className="mr-3 p-3 rounded-xl bg-fuchsia-500 text-white hover:bg-fuchsia-400 hover:scale-105 transition-all shadow-lg shadow-fuchsia-500/40"
               >
                  <Send className="w-5 h-5" />
               </button>
            </div>
            <div className="flex gap-4 mt-4 px-2">
               <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest pt-1">Suggested:</span>
               <div className="flex gap-2">
                  <button onClick={() => setInput("Show critical errors in auth-service")} className="px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-[#94a3b8] hover:text-white hover:border-white/20 transition-all font-medium">Show critical errors in auth-service</button>
                  <button onClick={() => setInput("Analyze anomaly AN-823")} className="px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-[#94a3b8] hover:text-white hover:border-white/20 transition-all font-medium">Analyze anomaly AN-823</button>
                  <button onClick={() => setInput("Check database health")} className="px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] text-[#94a3b8] hover:text-white hover:border-white/20 transition-all font-medium">Check database health</button>
               </div>
            </div>
          </form>
        </GlassCard>

        <div className="flex-1 space-y-8">
           <GlassCard title="Insights Hub" className="bg-gradient-to-br from-fuchsia-500/10 to-transparent">
              <div className="space-y-6">
                <div className="flex gap-3">
                   <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0 h-fit">
                      <Reply className="w-4 h-4 transform rotate-180" />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Root Cause Potential</h4>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">Memory leak suspected in pod <span className="text-white font-mono">auth-v2-4x9z</span>. Usage spike from <span className="text-emerald-400 font-bold">256MB</span> to <span className="text-status-error font-bold">1.4GB</span>.</p>
                   </div>
                </div>
                <div className="flex gap-3">
                   <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 h-fit">
                      <Sparkles className="w-4 h-4" />
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">AI Recommendation</h4>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">Scale auth-service replicas to <span className="text-emerald-400 font-bold">5</span>. Verify garbage collector logs for goroutine leaks.</p>
                   </div>
                </div>
              </div>
           </GlassCard>
           
           <GlassCard title="Model Stats">
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#64748b] tracking-widest">ARCHITECTURE</span>
                    <span className="text-[10px] font-mono text-cyan-400">LANG-GRAPH V1.2</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#64748b] tracking-widest">TOKENS / SEC</span>
                    <span className="text-[10px] font-mono text-white">124</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#64748b] tracking-widest">ACCURACY</span>
                    <span className="text-[10px] font-mono text-emerald-400">92.4%</span>
                 </div>
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
