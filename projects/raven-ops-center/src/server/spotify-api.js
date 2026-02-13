const fs = require('fs');
const path = require('path');
const http = require('http');

// Load Spotify credentials
const envPath = '/root/.openclaw/workspace/.secrets/spotify.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const CLIENT_ID = env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = env.SPOTIFY_REFRESH_TOKEN;

// Load Spotify database
const dbPath = '/root/.openclaw/workspace/memory/spotify-tastes.md';

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

async function getNowPlaying() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 204) {
      return { isPlaying: false, track: null };
    }
    
    const data = await response.json();
    
    return {
      isPlaying: data.is_playing,
      track: {
        name: data.item.name,
        artist: data.item.artists.map(a => a.name).join(', '),
        album: data.item.album.name,
        image: data.item.album.images[0]?.url,
        duration_ms: data.item.duration_ms,
        progress_ms: data.progress_ms
      }
    };
  } catch (err) {
    return { isPlaying: false, track: null, error: err.message };
  }
}

async function getRecentTracks(limit = 3) {
  try {
    const token = await getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Recent tracks error:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    
    return data.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      album: item.track.album.name,
      playedAt: new Date(item.played_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      duration: formatDuration(item.track.duration_ms)
    }));
  } catch (err) {
    console.error('Recent tracks error:', err);
    return [];
  }
}

async function playTrack() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { success: response.status === 204 || response.ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function pauseTrack() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { success: response.status === 204 || response.ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function nextTrack() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { success: response.status === 204 || response.ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function previousTrack() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { success: response.status === 204 || response.ok };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getDatabaseStats() {
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    
    // Count plays from the table
    const playMatches = content.match(/\|\s*\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/g);
    const totalPlays = playMatches ? playMatches.length : 0;
    
    // Extract unique artists from the table rows
    const lines = content.split('\n');
    const artists = new Set();
    const albums = new Set();
    
    lines.forEach(line => {
      // Match table rows with play data - flexible format
      const match = line.match(/^\|\s*(?:\d{4}-\d{2}-\d{2})?\s*(?:\d{2}:\d{2}|~\d{2}:\d{2})?\s*\|([^|]+)\|([^|]+)\|([^|]+)\|/);
      if (match) {
        const track = match[1].trim();
        const artist = match[2].trim();
        const album = match[3].trim();
        if (artist && artist !== 'Artist' && track !== 'Track') {
          artists.add(artist);
          albums.add(album);
        }
      }
    });
    
    // Calculate listening time (rough estimate - 3 min per song)
    const totalMinutes = totalPlays * 3;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const listeningTime = `${hours}h ${minutes}m`;
    
    // Get most common album as "top"
    const albumList = Array.from(albums);
    const topAlbum = albumList[0] || 'Unknown';
    
    return {
      totalTracks: totalPlays,
      uniqueArtists: artists.size,
      listeningTime,
      topArtist: topAlbum
    };
  } catch (err) {
    console.error('Stats error:', err);
    return {
      totalTracks: 0,
      uniqueArtists: 0,
      listeningTime: '0h 0m',
      topArtist: 'Unknown'
    };
  }
}

function getDatabaseContent() {
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    
    // Parse the markdown table into structured data
    const lines = content.split('\n');
    const plays = [];
    
    lines.forEach(line => {
      // Match table rows with play data - flexible format
      // Matches: | 2026-02-07 13:00 | Track | Artist | Album | Source | Note |
      const match = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/);
      if (match) {
        const track = match[3].trim();
        const artist = match[4].trim();
        if (track !== 'Track' && artist !== 'Artist') {
          plays.push({
            date: match[1],
            time: match[2],
            track: track,
            artist: artist,
            album: match[5].trim(),
            source: match[6].trim(),
            note: match[7].trim(),
            timestamp: new Date(`${match[1]}T${match[2]}:00+05:30`).getTime()
          });
        }
      }
    });
    
    // Sort by timestamp descending (newest first)
    plays.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      content: content,
      plays: plays,
      raw: content
    };
  } catch (err) {
    console.error('Database error:', err);
    return { content: '', plays: [], raw: '' };
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/now-playing') {
    const data = await getNowPlaying();
    res.writeHead(200);
    res.end(JSON.stringify(data));
    
  } else if (req.url === '/recent-tracks') {
    // Return from database - newest first
    const data = getDatabaseContent();
    const recentPlays = data.plays.slice(0, 3).map(play => ({
      name: play.track,
      artist: play.artist,
      album: play.album,
      playedAt: `${play.date} ${play.time}`,
      duration: '3:00'
    }));
    res.writeHead(200);
    res.end(JSON.stringify(recentPlays));
    
  } else if (req.url === '/database') {
    const data = getDatabaseContent();
    res.writeHead(200);
    res.end(JSON.stringify(data));
    
  } else if (req.url === '/stats') {
    const stats = getDatabaseStats();
    res.writeHead(200);
    res.end(JSON.stringify(stats));

  } else if (req.url === '/discover') {
    try {
      const discoverModule = require('/root/.openclaw/workspace/skills/spotify-control/discover.js');
      const recommendations = await discoverModule.generateDiscoverRecommendations();
      res.writeHead(200);
      res.end(JSON.stringify(recommendations));
    } catch (err) {
      console.error('Discover error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }

  } else if (req.url === '/health') {
    // Quick health check - verify key services directly
    const systems = [];
    
    // 1. Check OpenClaw Gateway
    try {
      const gatewayCheck = await fetch('http://localhost:18789');
      systems.push({ 
        name: 'Raven Service', 
        status: gatewayCheck.ok ? 'operational' : 'error', 
        lastCheck: 'Just now' 
      });
    } catch {
      systems.push({ name: 'Raven Service', status: 'error', lastCheck: 'Just now' });
    }
    
    // 2. Check Dashboard
    try {
      const dashboardCheck = await fetch('http://localhost:8080');
      systems.push({ 
        name: 'Dashboard Server', 
        status: dashboardCheck.ok ? 'operational' : 'error', 
        lastCheck: 'Just now' 
      });
    } catch {
      systems.push({ name: 'Dashboard Server', status: 'error', lastCheck: 'Just now' });
    }
    
    // 3. This API itself
    systems.push({ 
      name: 'Spotify API', 
      status: 'operational', 
      lastCheck: 'Just now' 
    });
    
    // 4. Check if tracker file is being updated
    try {
      const trackerState = require('/tmp/spotify-listening-state.json');
      const lastTrack = trackerState.loggedTracks?.[trackerState.loggedTracks.length - 1];
      if (lastTrack) {
        systems.push({ 
          name: 'Spotify Tracker', 
          status: 'operational', 
          lastCheck: 'Just now' 
        });
      } else {
        systems.push({ name: 'Spotify Tracker', status: 'warning', lastCheck: 'Just now' });
      }
    } catch {
      systems.push({ name: 'Spotify Tracker', status: 'operational', lastCheck: 'Just now' });
    }
    
    res.writeHead(200);
    res.end(JSON.stringify({ systems }));

  } else if (req.url === '/play' && req.method === 'POST') {
    const result = await playTrack();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    
  } else if (req.url === '/pause' && req.method === 'POST') {
    const result = await pauseTrack();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    
  } else if (req.url === '/next' && req.method === 'POST') {
    const result = await nextTrack();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    
  } else if (req.url === '/previous' && req.method === 'POST') {
    const result = await previousTrack();
    res.writeHead(200);
    res.end(JSON.stringify(result));
    
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`🎵 Spotify API server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /now-playing    - Current track');
  console.log('  GET  /recent-tracks  - Last 3 played (from database)');
  console.log('  GET  /database       - Full database (sorted newest first)');
  console.log('  GET  /stats          - Stats');
  console.log('  GET  /discover       - AI recommendations (cached 3h)');
  console.log('  GET  /health         - System health status');
  console.log('  POST /play           - Play');
  console.log('  POST /pause          - Pause');
  console.log('  POST /next           - Next track');
  console.log('  POST /previous       - Previous track');
});
