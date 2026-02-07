---
name: spotify-control
description: Control Spotify playback via Web API. Play tracks, albums, artists, control playback, and manage queue. Requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .secrets/spotify.env
metadata:
  openclaw:
    emoji: "🎵"
    requires:
      env:
        - SPOTIFY_CLIENT_ID
        - SPOTIFY_CLIENT_SECRET
---

# Spotify Control Skill

Control your Spotify playback via Web API.

## Setup

1. Fill in `/root/.openclaw/workspace/.secrets/spotify.env`:
   - `SPOTIFY_CLIENT_ID` — from Spotify Developer Dashboard
   - `SPOTIFY_CLIENT_SECRET` — from Spotify Developer Dashboard

2. Run authorization (one-time):
   ```bash
   node /root/.openclaw/workspace/skills/spotify-control/auth.js
   ```
   This will give you a URL to open in your browser. After approving, the refresh token will be saved automatically.

## Commands

### Search & Play
```bash
# Search for a track
node /root/.openclaw/workspace/skills/spotify-control/play.js track "Hotel California"

# Search for an artist
node /root/.openclaw/workspace/skills/spotify-control/play.js artist "Pink Floyd"

# Search for an album  
node /root/.openclaw/workspace/skills/spotify-control/play.js album "Dark Side of the Moon"
```

### Playback Control
```bash
node /root/.openclaw/workspace/skills/spotify-control/control.js pause
node /root/.openclaw/workspace/skills/spotify-control/control.js play
node /root/.openclaw/workspace/skills/spotify-control/control.js next
node /root/.openclaw/workspace/skills/spotify-control/control.js previous
```

### Volume
```bash
node /root/.openclaw/workspace/skills/spotify-control/control.js volume 50
node /root/.openclaw/workspace/skills/spotify-control/control.js volume up
node /root/.openclaw/workspace/skills/spotify-control/control.js volume down
```

### Status
```bash
node /root/.openclaw/workspace/skills/spotify-control/status.js
```

## Notes

- Requires Spotify Premium
- Playback controls only work when you have an active device (Spotify open on phone/web/desktop)
- The skill will ask for confirmation before playing by default
