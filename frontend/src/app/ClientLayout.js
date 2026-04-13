"use client";

import Sidebar from "./components/Sidebar";
import AlertCenter from "./components/AlertCenter";
import { ForensicProvider, useForensic } from "./context/ForensicContext";

function LayoutContent({ children }) {
  const { isAlertOpen, toggleAlerts, anomalies, clearAnomalies, unreadCount } = useForensic();
  
  return (
    <div className="flex overflow-x-hidden">
      <Sidebar onToggleAlerts={toggleAlerts} unreadCount={unreadCount} />
      <AlertCenter 
        isOpen={isAlertOpen} 
        onClose={toggleAlerts} 
        anomalies={anomalies} 
        onClear={clearAnomalies} 
      />
      <div className="flex-1 ml-32 pr-8 py-8 min-h-screen w-full">
        <main className="max-w-[1400px] mx-auto animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }) {
  return (
    <ForensicProvider>
      <LayoutContent>{children}</LayoutContent>
    </ForensicProvider>
  );
}
