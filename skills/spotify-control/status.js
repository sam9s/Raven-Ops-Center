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

async function main() {
  const token = await getAccessToken();
  
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 204) {
    console.log('🎵 Nothing is currently playing.');
    return;
  }
  
  const data = await response.json();
  
  if (!data.item) {
    console.log('🎵 No track information available.');
    return;
  }
  
  const track = data.item;
  const isPlaying = data.is_playing ? '▶️' : '⏸️';
  
  console.log('');
  console.log(`${isPlaying} ${track.name}`);
  console.log(`   Artist: ${track.artists.map(a => a.name).join(', ')}`);
  console.log(`   Album: ${track.album.name}`);
  
  const progress = Math.floor(data.progress_ms / 1000);
  const duration = Math.floor(track.duration_ms / 1000);
  const progressMin = Math.floor(progress / 60);
  const progressSec = (progress % 60).toString().padStart(2, '0');
  const durationMin = Math.floor(duration / 60);
  const durationSec = (duration % 60).toString().padStart(2, '0');
  
  console.log(`   ${progressMin}:${progressSec} / ${durationMin}:${durationSec}`);
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
