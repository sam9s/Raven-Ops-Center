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

if (!REFRESH_TOKEN) {
  console.error('❌ No refresh token found. Run auth.js first.');
  process.exit(1);
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
  if (data.error) {
    console.error('❌ Token refresh failed:', data.error);
    process.exit(1);
  }
  return data.access_token;
}

async function search(query, type) {
  const token = await getAccessToken();
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  return data;
}

async function play(uri) {
  const token = await getAccessToken();
  
  const response = await fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris: [uri] })
  });
  
  if (response.status === 204) {
    return true;
  } else if (response.status === 404) {
    console.error('❌ No active device found. Open Spotify on your phone/web first.');
    return false;
  } else {
    const error = await response.json();
    console.error('❌ Play failed:', error.error?.message || response.statusText);
    return false;
  }
}

async function main() {
  const type = process.argv[2]; // track, artist, album
  const query = process.argv.slice(3).join(' ');
  
  if (!type || !query) {
    console.log('Usage: node play.js [track|artist|album] "search query"');
    process.exit(1);
  }
  
  console.log(`🔍 Searching for ${type}: "${query}"...\n`);
  
  const results = await search(query, type);
  
  let items = [];
  if (type === 'track') items = results.tracks?.items || [];
  else if (type === 'artist') items = results.artists?.items || [];
  else if (type === 'album') items = results.albums?.items || [];
  
  if (items.length === 0) {
    console.log('❌ No results found.');
    process.exit(1);
  }
  
  // Show top result
  const top = items[0];
  console.log(`🎵 Found: ${top.name}`);
  if (top.artists) console.log(`   Artist: ${top.artists.map(a => a.name).join(', ')}`);
  if (top.album) console.log(`   Album: ${top.album.name}`);
  console.log('');
  
  // Determine URI to play
  let uri = top.uri;
  if (type === 'artist') {
    // For artists, use their top tracks
    uri = `spotify:artist:${top.id}`;
    // Actually, let's get their top tracks
    const token = await getAccessToken();
    const topTracks = await fetch(
      `https://api.spotify.com/v1/artists/${top.id}/top-tracks?market=IN`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const trackData = await topTracks.json();
    if (trackData.tracks?.length > 0) {
      uri = trackData.tracks[0].uri;
      console.log(`   Playing: ${trackData.tracks[0].name}`);
    }
  }
  
  const success = await play(uri);
  if (success) {
    console.log('✅ Now playing!\n');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
