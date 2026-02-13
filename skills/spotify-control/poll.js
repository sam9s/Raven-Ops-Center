const fs = require('fs');
const path = require('path');

// Load env from .secrets
const envPath = path.join(__dirname, '..', '..', '.secrets', 'spotify.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const CLIENT_ID = env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = env.SPOTIFY_REFRESH_TOKEN;

// State file to track listening sessions
const STATE_FILE = '/tmp/spotify-listening-state.json';
const MIN_LISTEN_TIME_MS = 60000; // 1 minute minimum to log
const TASTES_PATH = '/root/.openclaw/workspace/memory/spotify-tastes.md';

if (!REFRESH_TOKEN) {
  console.error('No refresh token found');
  process.exit(1);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { currentTrack: null, startTime: null, loggedTracks: [], lastRecentFetch: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    },
    body: `grant_type=refresh_token&refresh_token=${REFRESH_TOKEN}`
  });
  
  const data = await response.json();
  return data.access_token;
}

async function getCurrentTrack() {
  const token = await getAccessToken();
  
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 204) return null;
  if (!response.ok) return null;
  
  const data = await response.json();
  if (!data.item) return null;
  
  return {
    track: data.item.name,
    artist: data.item.artists.map(a => a.name).join(', '),
    album: data.item.album.name,
    isPlaying: data.is_playing,
    uri: data.item.uri,
    progressMs: data.progress_ms,
    durationMs: data.item.duration_ms
  };
}

// NEW: Fetch recently played tracks from Spotify API (backup method)
async function getRecentlyPlayed(limit = 20) {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    console.error('Recently played API failed:', response.status);
    return [];
  }
  
  const data = await response.json();
  
  return data.items.map(item => ({
    track: item.track.name,
    artist: item.track.artists.map(a => a.name).join(', '),
    album: item.track.album.name,
    uri: item.track.uri,
    playedAt: item.played_at, // ISO timestamp
    durationMs: item.track.duration_ms
  }));
}

function isTrackAlreadyLogged(track, state) {
  const trackId = `${track.track}::${track.artist}`;
  const today = new Date().toISOString().split('T')[0];
  
  // Check state file
  const inState = state.loggedTracks.some(lt => 
    lt.id === trackId && lt.date === today
  );
  
  if (inState) return true;
  
  // Check markdown file (more thorough)
  try {
    const content = fs.readFileSync(TASTES_PATH, 'utf8');
    // Look for track name and artist in the table
    const trackPattern = new RegExp(`\\|[^|]*\\|\\s*${escapeRegex(track.track)}\\s*\\|\\s*${escapeRegex(track.artist)}\\s*\\|`, 'i');
    if (trackPattern.test(content)) {
      return true;
    }
  } catch (err) {
    console.error('Error checking markdown:', err.message);
  }
  
  return false;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addToLog(track, playedAt = null) {
  const content = fs.readFileSync(TASTES_PATH, 'utf8');
  
  // Convert UTC to IST (UTC+5:30)
  let timestamp;
  if (playedAt) {
    // Use the provided played_at time
    const utcDate = new Date(playedAt);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(utcDate.getTime() + istOffset);
    timestamp = istTime.toISOString().replace('T', ' ').substring(0, 16);
  } else {
    // Use current time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    timestamp = istTime.toISOString().replace('T', ' ').substring(0, 16);
  }
  
  const listenTime = track.listenTimeMs || track.durationMs || 180000;
  const newLine = `| ${timestamp} | ${track.track} | ${track.artist} | ${track.album} | Auto-detected | Listened ${Math.round(listenTime/1000)}s |`;
  
  // Find the Play History table and add entry
  const updatedContent = content.replace(
    /(\| Time \(IST\) \| Track \| Artist \| Album \| Source \| Note \|\n\|[-|]+\n)/,
    `$1${newLine}\n`
  );
  
  fs.writeFileSync(TASTES_PATH, updatedContent);
  console.log(`✅ Logged: ${track.track} by ${track.artist}`);
}

async function processRecentlyPlayed(state) {
  console.log('🔄 Checking recently played tracks...');
  
  const recentTracks = await getRecentlyPlayed(20);
  let addedCount = 0;
  
  for (const track of recentTracks) {
    // Check if already logged
    if (!isTrackAlreadyLogged(track, state)) {
      // Check if played in last 24 hours (to avoid adding very old tracks)
      const playedTime = new Date(track.playedAt).getTime();
      const now = Date.now();
      const hoursAgo = (now - playedTime) / (1000 * 60 * 60);
      
      if (hoursAgo <= 24) {
        addToLog(track, track.playedAt);
        
        // Add to state
        const today = new Date().toISOString().split('T')[0];
        state.loggedTracks.push({
          id: `${track.track}::${track.artist}`,
          date: today
        });
        
        addedCount++;
      }
    }
  }
  
  if (addedCount > 0) {
    console.log(`🎵 Added ${addedCount} tracks from recently played API`);
  } else {
    console.log('✓ No new tracks from recently played');
  }
  
  state.lastRecentFetch = Date.now();
}

async function logTrack() {
  const state = loadState();
  
  // NEW: Every 3rd poll (9 minutes), also check recently played API
  const shouldCheckRecent = !state.lastRecentFetch || (Date.now() - state.lastRecentFetch) > 540000;
  
  if (shouldCheckRecent) {
    await processRecentlyPlayed(state);
  }
  
  // Continue with existing real-time tracking
  const track = await getCurrentTrack();
  
  if (!track) {
    // No track playing at all
    if (state.currentTrack && state.startTime) {
      const listenTime = Date.now() - state.startTime;
      if (listenTime >= MIN_LISTEN_TIME_MS) {
        // Log the track that was playing before it stopped
        state.currentTrack.listenTimeMs = listenTime;
        if (!isTrackAlreadyLogged(state.currentTrack, state)) {
          addToLog(state.currentTrack);
          console.log(`✅ Logged from current track: ${state.currentTrack.track}`);
          
          // Add to logged tracks
          const today = new Date().toISOString().split('T')[0];
          state.loggedTracks.push({
            id: `${state.currentTrack.track}::${state.currentTrack.artist}`,
            date: today
          });
        }
      }
    }
    state.currentTrack = null;
    state.startTime = null;
    saveState(state);
    console.log('No track currently playing');
    return;
  }
  
  const now = Date.now();
  
  // Check if this is a new track
  if (!state.currentTrack || state.currentTrack.uri !== track.uri) {
    // New track started - check if we should log the previous one
    if (state.currentTrack && state.startTime) {
      const listenTime = now - state.startTime;
      if (listenTime >= MIN_LISTEN_TIME_MS) {
        state.currentTrack.listenTimeMs = listenTime;
        if (!isTrackAlreadyLogged(state.currentTrack, state)) {
          addToLog(state.currentTrack);
          console.log(`✅ Logged from track change: ${state.currentTrack.track}`);
          
          const today = new Date().toISOString().split('T')[0];
          state.loggedTracks.push({
            id: `${state.currentTrack.track}::${state.currentTrack.artist}`,
            date: today
          });
        }
      }
    }
    
    // Start tracking new track
    state.currentTrack = {
      track: track.track,
      artist: track.artist,
      album: track.album,
      uri: track.uri
    };
    state.startTime = now;
    console.log(`▶️ Now tracking: ${track.track}`);
  }
  
  saveState(state);
}

logTrack().catch(console.error);
