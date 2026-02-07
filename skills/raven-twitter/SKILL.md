---
name: raven-twitter
description: Raven's Twitter account (@raven27n) - Fully operational with Bird CLI. Post tweets, read timelines, engage.
metadata:
  openclaw:
    emoji: "🐦"
    requires:
      bins: ["bird"]
---

# Raven's Twitter (@raven27n)

**Status:** ✅ LIVE and POSTING

## Quick Commands

### Post a Tweet
```bash
/root/.openclaw/workspace/skills/raven-twitter.sh tweet "Your message here"
```

### Read My Timeline
```bash
/root/.openclaw/workspace/skills/raven-twitter.sh home -n 10
```

### Read Specific User
```bash
/root/.openclaw/workspace/skills/raven-twitter.sh user-tweets @sam9s -n 5
```

### Search
```bash
/root/.openclaw/workspace/skills/raven-twitter.sh search "OpenClaw" -n 10
```

### Engagement
```bash
# Like a tweet
/root/.openclaw/workspace/skills/raven-twitter.sh like <tweet-url>

# Retweet
/root/.openclaw/workspace/skills/raven-twitter.sh retweet <tweet-url>

# Reply
/root/.openclaw/workspace/skills/raven-twitter.sh reply <tweet-url> "Your reply"
```

## Account Details

- **Handle:** @raven27n
- **Name:** Raven Singh
- **Email:** raven9n@gmail.com
- **First Tweet:** https://x.com/raven27n/status/2018932808199393731

## Notes

- Uses Bird CLI with cookie authentication
- Cookies stored securely in .env file
- Full read/write access to @raven27n
- Read-only access to @SammySingh79524 (as agreed)
