#!/bin/bash
# Forensic Cache Purge Script
# This will clear all old mock reports and anomalies from your database and Redis cache.

echo "🔍 Identifying Forensic Targets..."

# 1. Clear PostgreSQL Mock Data
echo "🗑️  Purging SQL Tables: forensic_incidents, forensic_anomalies..."
if [ -n "$DATABASE_URL" ]; then
  # Use psql to clear tables
  psql "$DATABASE_URL" -c "TRUNCATE forensic_incidents, forensic_anomalies RESTART IDENTITY;"
else
  echo "⚠️  DATABASE_URL not set. Skipping SQL purge."
fi

# 2. Clear Redis Mock Data
echo "🗑️  Purging Redis Keys: v2_recent_logs, v2_recent_anomalies..."
if [ -n "$REDIS_URL" ]; then
  # Basic redis-cli call
  redis-cli -u "$REDIS_URL" DEL v2_recent_logs v2_recent_anomalies
else
  echo "⚠️  REDIS_URL not set. Skipping Redis purge."
fi

echo "✅ Forensic Purge Complete. Waiting for fresh AI Intelligence..."
