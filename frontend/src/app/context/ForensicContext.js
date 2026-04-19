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

  const fetchInitialData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
      console.log("Forensic Context: Syncing with Archival Intelligence Hub...");
      
      const [anomalyRes, reportRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/anomalies`),
        fetch(`${apiBase}/api/v1/incidents/latest`)
      ]);

      if (anomalyRes.ok) {
        const data = await anomalyRes.json();
        setAnomalies(data.anomalies || []);
      }

      if (reportRes.ok) {
        const data = await reportRes.json();
        setActiveReport(data.report);
      }
    } catch (err) {
      console.error("Forensic Context: Failed to sync archival data", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    let socket;
    let reconnectTimer;

    const connect = () => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://back.praveen-challa.tech";
      // Construct WS URL from API URL if not explicitly provided
      let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      
      if (!wsUrl) {
        const protocol = apiBase.startsWith("https") ? "wss" : "ws";
        const host = apiBase.replace(/^https?:\/\//, "").replace(/\/$/, "");
        // Targeting the specific WebSocket frequency on the backend
        wsUrl = `${protocol}://${host}/api/v1/ws/stream`;
      }
      
      console.log(`Forensic Context: Connecting to ${wsUrl}`);
      setWsStatus("connecting");
      
      try {
        socket = new WebSocket(wsUrl);
      } catch (err) {
        console.error("WebSocket Initialization Failed", err);
        setWsStatus("disconnected");
        reconnectTimer = setTimeout(connect, 5000);
        return;
      }

      socket.onopen = () => {
        console.log("Forensic Context: Tunnel Established");
        setWsStatus("connected");
      };

      socket.onmessage = (event) => {
        console.log("RAW WS DATA RECEIVED:", event.data);
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

      socket.onclose = (event) => {
        console.warn(`Forensic Context: Tunnel Severed. Code: ${event.code}, Reason: ${event.reason}`);
        setWsStatus("disconnected");
        reconnectTimer = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error("Forensic Context: Socket Error", err);
        socket.close();
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
    };
  }, []); // Removed dependency on isAlertOpen to prevent reconnect cycles

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
