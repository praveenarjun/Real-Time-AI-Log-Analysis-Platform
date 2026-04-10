"use client";

import GlassCard from "../components/GlassCard";
import { Users, UserPlus, Search, Filter, History, UserCheck, Clock } from "lucide-react";

export default function Workforce() {
  const employees = [
    { id: 'EMP-001', name: 'John Doe', dept: 'Engineering', role: 'Staff SRE', status: 'Active', hireDate: '2023-01-15' },
    { id: 'EMP-002', name: 'Jane Smith', dept: 'Security', role: 'Lead Architect', status: 'Active', hireDate: '2022-06-20' },
    { id: 'EMP-003', name: 'Robert Brown', dept: 'Operations', role: 'Senior SRE', status: 'On Leave', hireDate: '2021-03-12' },
    { id: 'EMP-004', name: 'Emily White', dept: 'Engineering', role: 'DevOps Engineer', status: 'Active', hireDate: '2024-02-01' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workforce Management</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Resource allocation and department health tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            ADD EMPLOYEE
          </button>
           <button className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
            <History className="w-4 h-4" />
            ATTENDANCE LOGS
          </button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
             <Users className="w-6 h-6" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">42</div>
              <div className="text-[10px] text-[#64748b] font-bold tracking-widest uppercase">Total Headcount</div>
           </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
             <UserCheck className="w-6 h-6" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">38</div>
              <div className="text-[10px] text-[#64748b] font-bold tracking-widest uppercase">Currently Active</div>
           </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400">
             <Clock className="w-6 h-6" />
           </div>
           <div>
              <div className="text-2xl font-bold text-white">96%</div>
              <div className="text-[10px] text-[#64748b] font-bold tracking-widest uppercase">Attendance Rate</div>
           </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden border-[#1e293b]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-96">
            <Search className="w-4 h-4 text-[#64748b]" />
            <input 
              type="text" 
              placeholder="Search by ID or name..." 
              className="bg-transparent border-none outline-none text-xs text-white w-full"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] transition-all">
               <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Employee Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Position</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {employees.map((emp, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-none hover:bg-white/[0.03] transition-all group">
                  <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{emp.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{emp.name}</td>
                  <td className="px-6 py-4 text-[#94a3b8]">{emp.dept}</td>
                  <td className="px-6 py-4 text-[#64748b] font-medium">{emp.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-status-warn/10 text-status-warn border border-status-warn/30'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs font-bold text-cyan-400 hover:text-white transition-colors duration-300">
                      EDIT PROFILE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <footer className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-center">
           <div className="flex gap-2">
              <button className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-[#64748b] hover:text-white transition-all">PREV</button>
              <button className="px-3 py-1 bg-cyan-500/10 rounded-lg text-xs font-bold text-cyan-400 border border-cyan-500/20">1</button>
              <button className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-[#64748b] hover:text-white transition-all text-center">2</button>
              <button className="px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-[#64748b] hover:text-white transition-all text-center">NEXT</button>
           </div>
        </footer>
      </GlassCard>
    </div>
  );
}
