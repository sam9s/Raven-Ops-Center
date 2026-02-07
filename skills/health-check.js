#!/usr/bin/env node
/**
 * System Health Monitor
 * Checks all services and reports status
 */

const fs = require('fs');
const { execSync } = require('child_process');

const REPORT_FILE = '/root/.openclaw/workspace/memory/system-health.md';

function checkCronJobs() {
  try {
    // Check both system crontab and OpenClaw crons
    const crons = [];
    
    // System crontab
    try {
      const sysCrons = execSync('crontab -l 2>/dev/null || echo ""').toString();
      if (sysCrons.includes('spotify')) crons.push('Spotify Tracker');
    } catch {}
    
    return {
      status: crons.length > 0 ? 'OK' : 'MISSING',
      jobs: crons
    };
  } catch (e) {
    return { status: 'ERROR', error: e.message };
  }
}

function checkSpotifyAuth() {
  try {
    const envPath = '/root/.openclaw/workspace/.secrets/spotify.env';
    const content = fs.readFileSync(envPath, 'utf8');
    const hasToken = content.includes('SPOTIFY_REFRESH_TOKEN=') && 
                     !content.includes('SPOTIFY_REFRESH_TOKEN=\n') &&
                     !content.includes('SPOTIFY_REFRESH_TOKEN= ');
    
    return {
      status: hasToken ? 'OK' : 'NEEDS_AUTH',
      message: hasToken ? 'Authenticated' : 'No refresh token'
    };
  } catch (e) {
    return { status: 'ERROR', error: e.message };
  }
}

function checkFile(path) {
  try {
    fs.accessSync(path);
    return { status: 'OK', exists: true };
  } catch {
    return { status: 'MISSING', exists: false };
  }
}

function generateReport() {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  const checks = {
    timestamp: now,
    spotifyAuth: checkSpotifyAuth(),
    spotifyTracker: checkCronJobs(),
    tasteFile: checkFile('/root/.openclaw/workspace/memory/spotify-tastes.md'),
    healthFile: checkFile(REPORT_FILE)
  };
  
  let status = '✅ ALL SYSTEMS OPERATIONAL';
  const issues = [];
  
  if (checks.spotifyAuth.status !== 'OK') {
    status = '⚠️ ISSUES DETECTED';
    issues.push(`Spotify: ${checks.spotifyAuth.message}`);
  }
  if (checks.spotifyTracker.status !== 'OK') {
    status = '⚠️ ISSUES DETECTED';
    issues.push('Spotify Tracker cron: Missing');
  }
  
  const report = `# System Health Report
*Generated: ${now} UTC*

## Overall Status: ${status}

${issues.length > 0 ? `### Issues:\n${issues.map(i => `- ${i}`).join('\n')}\n` : ''}

### Service Status

| Service | Status | Details |
|---------|--------|---------|
| Spotify Auth | ${checks.spotifyAuth.status} | ${checks.spotifyAuth.message || checks.spotifyAuth.error || 'N/A'} |
| Spotify Tracker | ${checks.spotifyTracker.status} | ${checks.spotifyTracker.jobs?.join(', ') || 'Not running'} |
| Taste Database | ${checks.tasteFile.status} | File exists: ${checks.tasteFile.exists} |
| Health Log | ${checks.healthFile.status} | File exists: ${checks.healthFile.exists} |

---

*Last check: ${now}*
*Next check: Every morning at 7 AM IST*
`;

  fs.writeFileSync(REPORT_FILE, report);
  return { status, checks, issues };
}

// Generate and output report
const result = generateReport();
console.log(result.status);
if (result.issues.length > 0) {
  console.log('Issues:', result.issues.join(', '));
}
