"use client";
import Sidebar from "./components/Sidebar";
import AlertCenter from "./components/AlertCenter";
import { ForensicProvider, useForensic } from "./context/ForensicContext";
import "./globals.css";

export const metadata = {
  title: "AI Log Analysis | Command Center",
  description: "Real-time AI-powered forensic log analysis platform",
};

// Internal Layout to access Context
function LayoutContent({ children }) {
  const { isAlertOpen, toggleAlerts, anomalies, clearAnomalies, unreadCount } = useForensic();
  
  return (
    <body className="bg-bg-primary min-h-screen text-text-primary selection:bg-accent-cyan/30 flex overflow-x-hidden">
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
    </body>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <ForensicProvider>
        <LayoutContent>{children}</LayoutContent>
      </ForensicProvider>
    </html>
  );
}
