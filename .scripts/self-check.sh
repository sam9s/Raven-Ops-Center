#!/bin/bash
# Self-Check Script for Raven Systems
# Run this during every heartbeat/morning briefing

echo "================================"
echo "🔍 RAVEN SYSTEM SELF-CHECK"
echo "================================"
echo ""

FAILED=0

# 1. Check OpenClaw Gateway
echo "1. Checking OpenClaw Gateway..."
if openclaw status | grep -q "Gateway.*running"; then
    echo "   ✅ Gateway: RUNNING"
else
    echo "   ❌ Gateway: FAILED"
    FAILED=1
fi

# 2. Check Dashboard
echo ""
echo "2. Checking Dashboard (port 8080)..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "   ✅ Dashboard: RESPONDING (HTTP 200)"
else
    echo "   ❌ Dashboard: NOT RESPONDING (HTTP $DASHBOARD_STATUS)"
    FAILED=1
fi

# 3. Check Spotify API
echo ""
echo "3. Checking Spotify API (port 8081)..."
SPOTIFY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/discover 2>/dev/null)
if [ "$SPOTIFY_STATUS" = "200" ]; then
    echo "   ✅ Spotify API: RESPONDING (HTTP 200)"
else
    echo "   ❌ Spotify API: NOT RESPONDING (HTTP $SPOTIFY_STATUS)"
    FAILED=1
fi

# 4. Check Docker Containers
echo ""
echo "4. Checking Docker containers..."
EXITED_CONTAINERS=$(docker ps -f "status=exited" -q 2>/dev/null | wc -l)
if [ "$EXITED_CONTAINERS" -eq 0 ]; then
    echo "   ✅ All containers: RUNNING"
else
    echo "   ⚠️ $EXITED_CONTAINERS containers: EXITED"
    docker ps -f "status=exited" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null
fi

# 5. Check Trigger Files
echo ""
echo "5. Checking for trigger files..."
TRIGGER_COUNT=$(ls /root/.openclaw/workspace/.triggers/ 2>/dev/null | grep -v "^\.$\|^\.\.$" | wc -l)
if [ "$TRIGGER_COUNT" -eq 0 ]; then
    echo "   ✅ No triggers pending"
else
    echo "   ⚠️ $TRIGGER_COUNT trigger(s) pending:"
    ls /root/.openclaw/workspace/.triggers/ 2>/dev/null | grep -v "^\.$\|^\.\.$"
fi

# 6. Check Spotify Database
echo ""
echo "6. Checking Spotify database..."
TRACK_COUNT=$(grep -c "^| 2026-" /root/.openclaw/workspace/memory/spotify-tastes.md 2>/dev/null)
echo "   📊 Total tracks logged: $TRACK_COUNT"
LATEST_TRACK=$(grep "^| 2026-" /root/.openclaw/workspace/memory/spotify-tastes.md 2>/dev/null | head -1)
echo "   🎵 Latest: $LATEST_TRACK"

# 7. Check Cron Jobs
echo ""
echo "7. Checking cron jobs..."
openclaw cron list 2>/dev/null | grep -c "enabled.*true" | xargs -I {} echo "   ⏰ Active cron jobs: {}"

# Summary
echo ""
echo "================================"
if [ $FAILED -eq 0 ]; then
    echo "✅ ALL SYSTEMS OPERATIONAL"
else
    echo "❌ $FAILED SYSTEM(S) NEED ATTENTION"
fi
echo "================================"
echo ""

exit $FAILED
