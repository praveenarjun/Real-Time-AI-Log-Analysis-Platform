"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ForensicContext = createContext();

export function ForensicProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [activeAnomaly, setActiveAnomaly] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [wsStatus, setWsStatus] = useState("connecting");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://back.praveen-challa.tech/api/v1/ws/stream";
      
      setWsStatus("connecting");
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Forensic Context: Tunnel Established");
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          
          switch (update.type) {
            case "LOG_BATCH":
              if (update.payload.logs) {
                setLogs((prev) => [...prev, ...update.payload.logs].slice(-200));
              }
              break;
            case "ANOMALY":
              setAnomalies(prev => [update.payload, ...prev].slice(0, 20));
              setActiveAnomaly(update.payload);
              if (!isAlertOpen) {
                 setUnreadCount(prev => prev + 1);
              }
              break;
            case "INCIDENT_REPORT":
              setActiveReport(update.payload);
              break;
          }
        } catch (err) {
          console.error("Context Data Error", err);
        }
      };

      socket.onclose = () => {
        setWsStatus("disconnected");
        reconnectTimer = setTimeout(connect, 5000);
      };

      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
    };
  }, [isAlertOpen]);

  const toggleAlerts = () => {
    setIsAlertOpen(!isAlertOpen);
    if (!isAlertOpen) setUnreadCount(0);
  };

  const clearAnomalies = () => {
    setAnomalies([]);
    setUnreadCount(0);
  };

  return (
    <ForensicContext.Provider value={{
      logs,
      anomalies,
      activeAnomaly,
      activeReport,
      wsStatus,
      isAlertOpen,
      unreadCount,
      toggleAlerts,
      clearAnomalies,
      setActiveAnomaly
    }}>
      {children}
    </ForensicContext.Provider>
  );
}

export function useForensic() {
  const context = useContext(ForensicContext);
  if (!context) throw new Error("useForensic must be used within a ForensicProvider");
  return context;
}
