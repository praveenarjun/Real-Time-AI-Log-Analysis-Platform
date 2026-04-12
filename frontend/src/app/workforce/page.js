"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import GlassCard from "../components/GlassCard";
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  MapPin, 
  Mail,
  PieChart as PieChartIcon
} from "lucide-react";
import { motion } from "framer-motion";

export default function WorkforcePage() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        
        // Fetch Employees
        const empRes = await fetch(`${baseUrl}/api/v1/workforce/employees`);
        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }

        // Fetch Headcount Stats
        const statsRes = await fetch(`${baseUrl}/api/v1/workforce/headcount`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.headcount || []);
        }
      } catch (err) {
        console.warn("Backend unavailable", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <Users className="w-6 h-6 text-accent-blue" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase">Workforce Intelligence</h1>
          </div>
          <p className="text-text-secondary text-sm font-medium tracking-wide">
             Strategic employee demographics and departmental headcount distribution.
          </p>
        </div>

        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
           <UserPlus className="w-4 h-4" /> ADD EMPLOYEE
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Stats */}
        <div className="space-y-8">
           <GlassCard title="Headcount Distribution" subtitle="Active employees per department">
              <div className="space-y-6">
                 {stats.length === 0 ? (
                    [
                      { department: "ENGINEERING", count: 24, progress: 85, color: "cyan" },
                      { department: "SECURITY", count: 12, progress: 45, color: "fuchsia" },
                      { department: "OPERATIONS", count: 18, progress: 65, color: "blue" },
                    ].map((dept, idx) => (
                      <div key={idx} className="space-y-3">
                         <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
                            <span className="text-white">{dept.department}</span>
                            <span className={`text-accent-${dept.color}`}>{dept.count}</span>
                         </div>
                         <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.progress}%` }}
                              className={`h-full bg-accent-${dept.color} rounded-full`} 
                            />
                         </div>
                      </div>
                    ))
                 ) : (
                    stats.map((dept, idx) => (
                      <div key={idx} className="space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{dept.department_name}</span>
                            <span className="text-xs font-bold text-accent-cyan">{dept.count}</span>
                         </div>
                         <div className="w-full h-1 bg-white/5 rounded-full">
                            <div className="h-full bg-accent-cyan rounded-full" style={{ width: `${(dept.count / 50) * 100}%` }} />
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </GlassCard>

           <GlassCard className="bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20">
              <div className="flex items-center gap-3 mb-4">
                 <PieChartIcon className="w-4 h-4 text-accent-blue" />
                 <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Growth Metric</h3>
              </div>
              <p className="text-[10px] text-text-secondary font-medium leading-relaxed">
                Workforce capacity has increased by <span className="text-white">8%</span> this quarter. Planned expansion in the AI Forensics division is on track.
              </p>
           </GlassCard>
        </div>

        {/* Employee Directory */}
        <div className="lg:col-span-2">
           <GlassCard title="Directory Master List" subtitle="Recent hires and active team members">
              <div className="space-y-4">
                 {employees.length === 0 ? (
                   <div className="py-12 flex flex-col items-center justify-center opacity-20 italic">
                      <Users className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-black tracking-widest uppercase">No Active Records Found</p>
                   </div>
                 ) : (
                   employees.map((emp, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-accent-blue/30 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-sm font-black text-white">
                             {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-white tracking-wide">{emp.first_name} {emp.last_name}</h4>
                             <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-accent-blue uppercase tracking-widest">{emp.position}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">{emp.department_name}</span>
                             </div>
                          </div>
                       </div>

                       <div className="flex gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                          <div className="flex flex-col items-end">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                                <Mail className="w-3 h-3" /> {emp.email}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                <MapPin className="w-3 h-3" /> {emp.address || "Main Branch"}
                             </div>
                          </div>
                          <div className="flex items-center">
                             <div className="p-2 rounded-xl bg-white/5 text-text-secondary group-hover:text-white transition-colors cursor-pointer">
                                <Briefcase className="w-4 h-4" />
                             </div>
                          </div>
                       </div>
                    </div>
                  ))
                 )}
              </div>
           </GlassCard>
        </div>
      </div>
    </div>
  );
}
