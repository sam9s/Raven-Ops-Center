# HEARTBEAT.md - Morning Briefing Protocol
## 🌅 Version 2.0 - Comprehensive Self-Monitoring

---

## ⚠️ CRITICAL: NEVER Reply HEARTBEAT_OK Blindly

**BEFORE any response, you MUST:**

### Step 1: Check for Trigger Files (PRIORITY 1)
```bash
ls -la /root/.openclaw/workspace/.triggers/
```

**If triggers found:**
| Trigger File | Action | After Processing |
|--------------|--------|------------------|
| `morning-alarm.trigger` | Send morning briefing | DELETE file |
| `status-report.trigger` | Run self-check + send report | DELETE file |
| `health-check.trigger` | Run health check + alert if issues | DELETE file |
| Stale triggers (>2h old) | Process anyway + delete | DELETE file |

**ONLY reply HEARTBEAT_OK if NO triggers found.**

---

### Step 2: Run Self-Check Script
```bash
bash /root/.openclaw/workspace/.scripts/self-check.sh
```

**This checks:**
1. ✅ OpenClaw Gateway running
2. ✅ Dashboard responding (port 8080)
3. ✅ Spotify API responding (port 8081)
4. ✅ Docker containers (alerts if any exited)
5. ✅ No pending triggers
6. ✅ Spotify database growing
7. ✅ Cron jobs active

---

### Step 3: Generate Morning Briefing (if 7 AM IST)

**Include in briefing:**

#### 🎵 Spotify Summary
- Last night's plays (from spotify-tastes.md)
- Total tracks in database
- Listening patterns

#### 📊 System Health
| System | Status | Notes |
|--------|--------|-------|
| Raven Service | ✅/❌ | PID, memory |
| Dashboard | ✅/❌ | Response time |
| Spotify API | ✅/❌ | Recommendations working |
| Docker | ✅/❌ | Containers running |

#### 💡 Build Ideas / Alerts
- Any systems need attention?
- New features to discuss?
- Issues from yesterday fixed?

---

## 🔄 On Every Startup/Heartbeat

### System Verification Checklist:

- [ ] **Triggers checked** - Any .triggers/ files processed?
- [ ] **Self-check run** - /root/.openclaw/workspace/.scripts/self-check.sh
- [ ] **Dashboard verified** - curl http://localhost:8080 returns 200
- [ ] **Spotify API verified** - curl http://localhost:8081/discover returns JSON
- [ ] **Database growing** - spotify-tastes.md has recent entries
- [ ] **Git status clean** - No uncommitted critical changes

### If ANY check fails:
1. **DO NOT reply HEARTBEAT_OK**
2. **Alert Sammy immediately** with specific issue
3. **Attempt auto-recovery** (if safe and approved)
4. **Document in memory file**

---

## 📋 Morning Briefing Template (7:00 AM IST)

```
🌅 Good Morning, Sammy!
*Friday, 13 February 2026 at 07:00 AM IST*

---

## 🎵 Last Night's Music
• [Song] - [Artist] ([Album])
• [Song] - [Artist] ([Album])
[... up to 5 most recent]

## 📊 System Health
✅ Raven Service - Running (PID: XXXX, Memory: XXX MB)
✅ Dashboard - Responding (<1s)
✅ Spotify API - Working (recommendations active)
✅ Docker - [X] containers running
✅ Spotify Tracker - [X] tracks logged

## 💡 Today's Focus
[Any alerts, issues, or suggestions]

---

Have a great day! 🪶
```

---

## 🚨 Emergency Procedures

### Dashboard Down:
```bash
cd /root/.openclaw/workspace/projects/raven-ops-center
pkill -f "serve.*8080"
npm run build  # if needed
nohup npx serve -s build -p 8080 &
```

### Spotify API Down:
```bash
pkill -f "spotify-api.js"
nohup node /root/.openclaw/workspace/projects/raven-ops-center/src/server/spotify-api.js &
```

### Critical File Missing:
1. Check git: `git status`
2. Restore from backup: `git checkout HEAD -- [file]`
3. Verify: `ls -la [file]`
4. Restart affected services

---

## 📝 Daily Logging Requirements

**Every day I MUST create:**
`/root/.openclaw/workspace/memory/YYYY-MM-DD.md`

**Contents:**
1. Day start timestamp
2. Systems status snapshot
3. Work completed
4. Issues encountered + fixes applied
5. Git commits made
6. Next day's priorities
7. Any system changes

---

## 🧠 Memory System Hierarchy

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `MEMORY.md` | Permanent rules, architecture, protocols | When protocols change |
| `HEARTBEAT.md` | This file - morning briefing protocol | When procedure changes |
| `memory/YYYY-MM-DD.md` | Daily activity log | Every day |
| `.scripts/self-check.sh` | Automated system checks | When system changes |

---

## ⏰ Cron Schedule (System)

| Job | Schedule | Purpose |
|-----|----------|---------|
| spotify-tracker | Every 3 min | Track currently playing |
| morning-romantic-alarm | 7:00 AM IST | Trigger morning briefing |
| daily-status-report | 7:30 AM IST | System status report |
| health-check-morning | 9:00 AM IST | Health verification |
| health-check-evening | 9:00 PM IST | Health verification |

---

## ✅ Success Metrics

- [ ] Morning briefing delivered by 7:05 AM IST
- [ ] All system checks pass
- [ ] No triggers left unprocessed
- [ ] Daily memory file created
- [ ] Git commits pushed (if any)

---

*Last Updated: 2026-02-13*
*Version: 2.0 - Comprehensive Self-Monitoring*
