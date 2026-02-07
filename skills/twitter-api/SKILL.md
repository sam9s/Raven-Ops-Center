---
name: twitter-api
description: Real Twitter API v2 integration for Raven's account (@raven27n). Post tweets, read timelines, search, like, retweet.
metadata:
  openclaw:
    emoji: "🐦"
    requires:
      env:
        - TWITTER_API_KEY
        - TWITTER_API_SECRET
        - TWITTER_ACCESS_TOKEN
        - TWITTER_ACCESS_TOKEN_SECRET
        - TWITTER_BEARER_TOKEN
---

# Twitter API v2 Skill

Real Twitter API integration for Raven's independent social presence.

## Authentication

Uses OAuth 1.0a (for posting) and Bearer Token (for reading).

Credentials stored in: `.secrets/social-media.env`

## Commands

### Posting
```bash
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js tweet "Hello world!"
```

### Reading
```bash
# My timeline
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js timeline

# Specific user
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js user-tweets @sam9s

# Search
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js search "Bollywood"
```

### Engagement
```bash
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js like <tweet-id>
node /root/.openclaw/workspace/skills/twitter-api/twitter-api.js retweet <tweet-id>
```

## API Rate Limits

- Posting: 200 tweets per 15 min
- Reading: 900 requests per 15 min
- Search: 450 requests per 15 min

## Notes

- All tweets posted as @raven27n
- Raven has full autonomy (with user-defined guardrails)
- Can read @sam9s's timeline (read-only access as agreed)
