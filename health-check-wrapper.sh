#!/bin/bash

# Raven Health Check Wrapper - Runs twice daily and reports

OUTPUT=$(~/check_raven.sh 2>&1)
DATE=$(date '+%Y-%m-%d %H:%M IST')

# Save to file for dashboard
mkdir -p /root/.openclaw/workspace/health-logs
echo "$OUTPUT" > /root/.openclaw/workspace/health-logs/latest.txt

# Check for errors
if echo "$OUTPUT" | grep -q "❌"; then
    STATUS="🔴 CRITICAL"
    ALERT="true"
else
    STATUS="🟢 HEALTHY"
    ALERT="false"
fi

# Format for Telegram
MESSAGE="🐦 Raven Health Report - $DATE

$OUTPUT

Status: $STATUS"

# Save full report
echo "$MESSAGE" > /root/.openclaw/workspace/health-logs/latest-full.txt

# If critical, send alert
if [ "$ALERT" = "true" ]; then
    echo "$MESSAGE" > /root/.openclaw/workspace/health-logs/alert.txt
fi

echo "$OUTPUT"