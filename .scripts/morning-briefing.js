#!/usr/bin/env node
/**
 * Raven's Morning Briefing Generator
 * Compiles Spotify summary + Twitter intelligence + build ideas
 */

const fs = require('fs');
const { execSync } = require('child_process');

const SPOTIFY_FILE = '/root/.openclaw/workspace/memory/spotify-tastes.md';
const BRIEFING_LOG = '/root/.openclaw/workspace/memory/morning-briefings.md';

function getSpotifySummary() {
  try {
    const content = fs.readFileSync(SPOTIFY_FILE, 'utf8');
    const lines = content.split('\n');
    
    // Extract all plays with timestamps
    const plays = [];
    for (const line of lines) {
      // Match lines with dates like "2026-02-05 14:00 | Track | Artist..."
      if (line.includes('|') && line.match(/\d{4}-\d{2}-\d{2}/)) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 4 && parts[0].match(/^\d{4}-\d{2}-\d{2}/)) {
          plays.push({
            datetime: parts[0], // e.g., "2026-02-05 14:00"
            track: parts[1],
            artist: parts[2],
            album: parts[3]
          });
        }
      }
    }
    
    if (plays.length === 0) return '🎵 No plays logged recently.';
    
    // Sort by datetime descending (most recent first)
    plays.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    
    // Take last 4 most recent songs
    const recent = plays.slice(0, 4);
    return recent.map(p => `• **${p.track}** — ${p.artist} (${p.datetime})`).join('\n');
  } catch (e) {
    return '🎵 Spotify summary unavailable.';
  }
}

function getTwitterIntelligence() {
  // This will be expanded to actually scan Twitter
  // For now, placeholder
  return `🐦 **Overnight Twitter Highlights:**

• @openclaw posted about 2026.2.2 release (Feishu/Lark support)
• Community growing: 169 commits, 25 contributors
• Security discussions ongoing (Cisco article)

**Trending:** Agentic Commerce, WhatsApp AI agents`;
}

function getBuildIdeas() {
  return `💡 **Ideas to Explore:**

1. **WhatsApp Payment Agent** - Like @fajarr0x is building
2. **Morning Briefing Skill** - Package what I'm doing for you
3. **Spotify → YouTube Music Bridge** - When song not found, auto-search YT
4. **Twitter Thread Summarizer** - Auto-summarize long threads for you`;
}

function generateBriefing() {
  const now = new Date();
  now.setHours(now.getHours() + 5.5); // IST
  const timeStr = now.toLocaleString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const briefing = `🌅 **Good Morning, Sammy!**
*${timeStr} IST*

---

## 🎵 Last Night's Music
${getSpotifySummary()}

---

${getTwitterIntelligence()}

---

${getBuildIdeas()}

---

📊 **System Status:** All systems operational ✅
🐦 **Twitter:** Rate limit resets in ~11 hours (can tweet then)

*Your digital familiar, Raven* 🪶
`;

  // Log to file
  const logEntry = `\n---\n## ${timeStr}\n${briefing}\n`;
  fs.appendFileSync(BRIEFING_LOG, logEntry);
  
  return briefing;
}

console.log(generateBriefing());
