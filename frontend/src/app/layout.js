import "./globals.css";
import { LayoutDashboard, FileTerminal, Cpu, Users, Bell, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AI Log Analysis Platform",
  description: "Real-time log forensics and automated anomaly detection.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 glass-panel border-r border-[#1e293b] flex flex-col p-6 z-20">
            <div className="flex items-center gap-3 mb-10 group cursor-pointer transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg group-hover:scale-110">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#94a3b8]">AI Analyzer</h2>
            </div>

            <nav className="flex-1 space-y-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] hover:text-white group">
                <LayoutDashboard className="w-5 h-5 group-hover:text-cyan-400" />
                <span>Dashboard</span>
              </Link>
              <Link href="/logs" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] hover:text-white group">
                <FileTerminal className="w-5 h-5 group-hover:text-cyan-400" />
                <span>Live Logs</span>
              </Link>
              <Link href="/ai" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] hover:text-white group">
                <Cpu className="w-5 h-5 group-hover:text-cyan-400" />
                <span>AI Forensics</span>
              </Link>
              <Link href="/workforce" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[#94a3b8] hover:text-white group">
                <Users className="w-5 h-5 group-hover:text-cyan-400" />
                <span>Workforce</span>
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5 text-xs text-[#64748b]">
              <span>System Status:</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-medium">All Systems Operational</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#020617]/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 w-96 group focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all duration-300">
                <Search className="w-4 h-4 text-[#64748b] group-focus-within:text-cyan-400" />
                <input 
                  type="text" 
                  placeholder="Ask AI about your logs..." 
                  className="bg-transparent border-none outline-none text-sm text-white w-full h-full"
                />
              </div>

              <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all group">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-fuchsia-500 rounded-full border-2 border-[#020617] group-hover:scale-125 transition-all" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border border-white/20 p-0.5 cursor-pointer hover:scale-105 transition-all">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold">Admin</div>
                </div>
              </div>
            </header>

            <section className="flex-1 overflow-y-auto p-8 relative">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/5 blur-[120px] rounded-full pointer-events-none" />
              {children}
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}
