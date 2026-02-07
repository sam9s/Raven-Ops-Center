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

if (!REFRESH_TOKEN) {
  console.error('No refresh token found');
  process.exit(1);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { currentTrack: null, startTime: null, loggedTracks: [] };
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

function shouldLogTrack(track, state) {
  const trackId = `${track.track}::${track.artist}`;
  
  // Check if already logged today
  const today = new Date().toISOString().split('T')[0];
  const alreadyLoggedToday = state.loggedTracks.some(lt => 
    lt.id === trackId && lt.date === today
  );
  
  return !alreadyLoggedToday;
}

function addToLog(track) {
  const tastesPath = '/root/.openclaw/workspace/memory/spotify-tastes.md';
  const content = fs.readFileSync(tastesPath, 'utf8');
  
  // Convert UTC to IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  const timestamp = istTime.toISOString().replace('T', ' ').substring(0, 16);
  
  const newLine = `| ${timestamp} | ${track.track} | ${track.artist} | ${track.album} | Auto-detected | Listened ${Math.round(track.listenTimeMs/1000)}s |`;
  
  // Find the Play History table and add entry
  const updatedContent = content.replace(
    /(\| Time \(IST\) \| Track \| Artist \| Album \| Source \| Note \|\n\|[-|]+\n)/,
    `$1${newLine}\n`
  );
  
  fs.writeFileSync(tastesPath, updatedContent);
}

async function logTrack() {
  const state = loadState();
  const track = await getCurrentTrack();
  
  if (!track) {
    // No track playing at all
    if (state.currentTrack && state.startTime) {
      const listenTime = Date.now() - state.startTime;
      if (listenTime >= MIN_LISTEN_TIME_MS) {
        // Log the track that was playing before it stopped
        state.currentTrack.listenTimeMs = listenTime;
        if (shouldLogTrack(state.currentTrack, state)) {
          addToLog(state.currentTrack);
          console.log(`✅ Logged: ${state.currentTrack.track} (listened ${Math.round(listenTime/1000)}s)`);
          
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
  
  const trackId = `${track.track}::${track.artist}`;
  const now = Date.now();
  
  // Check if this is a new track
  if (!state.currentTrack || state.currentTrack.uri !== track.uri) {
    // New track started - check if we should log the previous one
    if (state.currentTrack && state.startTime) {
      const listenTime = now - state.startTime;
      if (listenTime >= MIN_LISTEN_TIME_MS) {
        state.currentTrack.listenTimeMs = listenTime;
        if (shouldLogTrack(state.currentTrack, state)) {
          addToLog(state.currentTrack);
          console.log(`✅ Logged: ${state.currentTrack.track} (listened ${Math.round(listenTime/1000)}s)`);
          
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
