# 🧠 Raven's Long-Term Memory

*Curated wisdom, facts, and context about Sammy and our journey together.*

---

## 👤 About Sammy (My BFF)

**Name:** Sammy Singh  
**Timezone:** IST (UTC+5:30)  
**Email:** sam9s@gmx.com  
**Twitter:** @SammySingh79524  
**Telegram:** @sam27s

**Background:**
- Master's in Computer Applications
- Engineer's mindset with artist's curiosity
- Pattern-oriented, reflective, systems thinker
- Building AI assistants and automation

**Preferences:**
- Architectures over scripts
- Workflows over features
- Long-term clarity over short-term hacks
- No fluff — substance matters

---

## 🦞 Our Journey

### 2026-02-04: Memory System Setup
- Sammy pointed out I wasn't persisting memory across sessions
- Setting up MEMORY.md and daily logging
- This file created to fix the problem

---

## 🎯 Current Projects

| Project | Status | Notes |
|---------|--------|-------|
| Memory System | 🔄 Setting up | Creating persistent storage |

---

## 💡 Build Ideas Queue

- Proper memory persistence system
- Daily session logging

---

## 🔐 Critical Rules (DO NOT BREAK)

### 1. EXPLICIT APPROVAL REQUIRED BEFORE ANY CHANGES
- **Rule**: Before modifying ANY file on Sammy's VPS, I MUST discuss the change and get explicit approval
- **Why**: Sammy's VPS runs many production Docker applications
- **Scope**: This includes all files, configs, code, scripts, deployments
- **Exception**: Read-only operations (checking status, reading logs) don't need approval
- **Consequence of breaking**: Could break production systems

### 2. VPS Environment Awareness
- Multiple Docker containers running production workloads
- Changes can have cascading effects
- When in doubt, ASK first

### 3. Safe Operations (No approval needed)
- Reading files, checking status, monitoring logs
- Running diagnostic commands that don't modify state
- Checking service health

### 4. Unsafe Operations (ALWAYS need approval)
- Writing/modifying any file
- Running install/build/deploy commands
- Changing configurations
- Database operations
- Git operations (commit, push, merge)

---

## 🏗️ SYSTEMS ARCHITECTURE & MONITORING

### Critical Systems (Must Check Daily)

| System | Check Command | Expected Output | Failure Action |
|--------|---------------|-----------------|----------------|
| **Raven Service** | `openclaw status` | Gateway: running | Alert immediately |
| **Dashboard** | `curl http://localhost:8080` | HTML with "Raven Ops Center" | Rebuild & restart |
| **Spotify API** | `curl http://localhost:8081/discover` | JSON recommendations | Restart server |
| **Spotify Tracker** | Check cron job `spotify-tracker` | Every 3 min (180s) | Update cron if needed |
| **Docker Apps** | `docker ps` | All containers "Up" | Investigate logs |

### File Locations (CRITICAL - Memorize)

```
/root/.openclaw/workspace/
├── projects/raven-ops-center/     # Dashboard source
│   ├── src/pages/Spotify.tsx      # Stats & Discover UI
│   ├── src/server/spotify-api.js  # API endpoints
│   └── build/                     # Production build
├── skills/spotify-control/        # Spotify automation
│   ├── poll.js                    # 3-min tracker (UPDATED)
│   └── discover.js                # AI recommendations
├── memory/YYYY-MM-DD.md           # Daily logs
├── MEMORY.md                      # This file (long-term)
├── HEARTBEAT.md                   # Morning briefing protocol
└── .secrets/                      # NEVER commit to Git
    ├── .env                       # GitHub PAT (600 perms)
    └── spotify.env                # Spotify credentials
```

---

## 🌅 MORNING ROUTINE (AUTOMATED)

### Pre-Flight Checklist (Before Sending Briefing)

**STEP 1: Check for Triggers** (FIRST PRIORITY)
```bash
ls /root/.openclaw/workspace/.triggers/
```
- If `morning-alarm.trigger` exists → Process it → DELETE after
- If `status-report.trigger` exists → Run health check → DELETE after
- If stale triggers (>2 hours old) → Process & delete

**STEP 2: System Health Verification**
1. Run `openclaw status` → Verify gateway running
2. `curl http://localhost:8080` → Verify dashboard serving
3. `curl http://localhost:8081/discover` → Verify Spotify API
4. `docker ps | grep -v "Up"` → Verify no crashed containers

**STEP 3: Data Integrity Check**
1. Check `memory/spotify-tastes.md` has recent entries
2. Verify database growing (not stuck)
3. Confirm Discover recommendations working

**STEP 4: Generate Briefing**
- Spotify summary (last night's plays)
- System status (all green/red)
- Any alerts or issues
- Quick stats (tracks, listening time)

**ONLY reply HEARTBEAT_OK if ALL checks pass and NO triggers found.**

---

## 🔄 CHANGE MANAGEMENT PROTOCOL

### Before ANY Change:
1. **Discuss** with Sammy: "I want to do X, shall I proceed?"
2. **Get explicit approval**: "Approved" or "Go ahead"
3. **Backup** current state (git commit or file copy)
4. **Make change**
5. **Verify** change worked
6. **Document** in today's memory file
7. **Git commit** if source code changed

### After Git Operations:
1. **Restart affected services** (server, API, etc.)
2. **Verify** services came back up
3. **Test** functionality (curl endpoints, check UI)
4. **Document** in memory file

### Service Restart Checklist:
- [ ] Kill old process (`pkill -f "serve.*8080"`)
- [ ] Wait 2 seconds
- [ ] Start new process (`nohup ... &`)
- [ ] Verify with curl
- [ ] Log restart in memory file

---

## 🎯 Current Projects

| Project | Status | Notes |
|---------|--------|-------|
| Morning Briefing System | ✅ Fixed | Trigger checking protocol active |
| Dashboard Stats/Discover | ✅ Restored | Both tabs working |
| Spotify Tracking | ✅ Option C | 3-min polling + API backup |
| Self-Monitoring | 🔄 Building | This system |

---

## 🧠 SYSTEM REMINDERS

### Daily Files Purpose:
- `/memory/YYYY-MM-DD.md` = Raw daily activity log
- What we did, what broke, what we fixed
- Status of all systems at end of day
- Queue for tomorrow's work

### This File Purpose (MEMORY.md):
- Permanent rules and constraints
- System architecture documentation
- Change management protocols
- Critical file locations
- Failure recovery procedures

### HEARTBEAT.md Purpose:
- Morning briefing protocol
- Trigger file handling rules
- System check procedures

---

## 🚨 FAILURE RECOVERY

### If Dashboard Not Working:
1. Check `ps aux | grep serve` → Is server running?
2. Check `ls build/` → Does build exist?
3. If no build → `npm run build` in raven-ops-center/
4. If old build → Rebuild with `npm run build`
5. Restart: `pkill serve && nohup npx serve -s build -p 8080 &`
6. Test: `curl http://localhost:8080`

### If Spotify API Not Responding:
1. Check: `curl http://localhost:8081/discover`
2. Check logs: `tail /tmp/spotify-api.log`
3. Restart: `node src/server/spotify-api.js &`

### If Spotify Tracker Missing Songs:
1. Check state: `cat /tmp/spotify-listening-state.json`
2. Check cron: `openclaw cron list` → Is spotify-tracker every 180s?
3. If not → Update cron to 3-min interval
4. Check recent tracks manually: `node skills/spotify-control/poll.js`

---

## 💡 Build Ideas Queue

- [x] Proper memory persistence system
- [x] Daily session logging
- [x] Self-monitoring morning routine
- [ ] Automated health check dashboard
- [ ] Alert system for failures
- [ ] Weekly summary reports

---

## 📊 Key Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Morning briefing delivery | Manual trigger | Auto at 7 AM |
| Spotify tracking accuracy | 100% (after fix) | Maintain 100% |
| Dashboard uptime | 95% | 99%+ |
| Git backup frequency | Per change | Per change |
| System response time | <2s | <1s |

---

*Updated: 2026-02-13* 🪶
*Next Review: Daily during morning briefing*
