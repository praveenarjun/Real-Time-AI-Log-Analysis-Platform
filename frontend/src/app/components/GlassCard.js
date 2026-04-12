"use client";

import React from "react";
import { motion } from "framer-motion";

export default function GlassCard({ children, title, className = "", subtitle, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-6 border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl 
                 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)] transition-all duration-300
                 group relative overflow-hidden ${className}`}
    >
      {/* Subtle Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {title && (
        <div className="mb-6 relative z-10">
          <h3 className="text-lg font-bold text-white tracking-widest uppercase">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary mt-1 font-medium tracking-wide">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
