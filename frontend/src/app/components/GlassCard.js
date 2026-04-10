"use client";

import React from "react";

export default function GlassCard({ children, title, className = "", subtitle }) {
  return (
    <div className={`glass-card p-6 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl rounded-2xl ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-[#94a3b8] mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
