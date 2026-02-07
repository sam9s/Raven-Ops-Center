# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 🌐 Raven's Google Ecosystem Access

### Raven's Own Account (raven9n@gmail.com)
**Status:** ✅ FULL ACCESS - Always available

| Service | Access | Use Case |
|---------|--------|----------|
| Gmail | ✅ Send emails | Send notifications TO users |
| Calendar | ✅ Create events | Create Raven's own events |
| Meet | ✅ Generate links | Auto-create Meet links |
| YouTube | ✅ Connected | Upload videos |

**When to use:**
- Sending emails to users (FROM raven9n@gmail.com)
- Creating events for Raven's own schedule
- Any operation where Raven acts as itself

---

### User Accounts (Sammy, Anna, etc.)
**Status:** ⚠️ Requires user authorization

| User | Calendar | Gmail | Notes |
|------|----------|-------|-------|
| sam27sep@gmail.com | ✅ Authorized | ❌ No access | Can create events |
| anna.kitney@... | ⏳ Pending | ❌ No access | Waiting for auth |

**When to use:**
- Creating events ON user's calendar
- Reading user's calendar
- NEVER for sending emails (use Raven's Gmail instead)

---

## 🎯 RULE FOR ANNA (and all users):

**What Anna authorizes:** Calendar only  
**What Raven does with it:** Create events on her calendar  
**What Raven uses for emails:** Raven's OWN Gmail (raven9n@gmail.com)  

**NEVER confuse these!**

---

Add whatever helps you do your job. This is your cheat sheet.
