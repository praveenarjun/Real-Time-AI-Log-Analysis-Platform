-- 1. Forensic Anomalies Table
CREATE TABLE IF NOT EXISTS forensic_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    related_log_ids TEXT[], 
    root_cause TEXT,
    recommendations TEXT[],
    confidence_score FLOAT DEFAULT 0.0,
    service_name VARCHAR(100),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Forensic Incident Reports Table
CREATE TABLE IF NOT EXISTS forensic_incidents (
    id VARCHAR(100) PRIMARY KEY, -- Matches the REP- or INC- IDs from AI
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    executive_summary TEXT,
    timeline JSONB, -- Storing complex timeline events as JSONB
    root_cause_analysis TEXT,
    impact_assessment TEXT,
    affected_services TEXT[],
    risk_score FLOAT DEFAULT 0.0,
    recommendations JSONB, -- Storing struct as JSONB
    action_items JSONB,    -- Storing list of structs as JSONB
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS IX_Anomalies_Service ON forensic_anomalies (service_name);
CREATE INDEX IF NOT EXISTS IX_Anomalies_DetectedAt ON forensic_anomalies (detected_at);
CREATE INDEX IF NOT EXISTS IX_Incidents_GeneratedAt ON forensic_incidents (generated_at);
