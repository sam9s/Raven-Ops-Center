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
  const command = process.argv[2];
  const token = await getAccessToken();
  
  let endpoint = '';
  let method = 'PUT';
  let body = null;
  
  switch (command) {
    case 'play':
      endpoint = 'play';
      method = 'PUT';
      break;
    case 'pause':
      endpoint = 'pause';
      method = 'PUT';
      break;
    case 'next':
      endpoint = 'next';
      method = 'POST';
      break;
    case 'previous':
    case 'prev':
      endpoint = 'previous';
      method = 'POST';
      break;
    case 'volume':
      const volArg = process.argv[3];
      if (!volArg) {
        console.log('Usage: node control.js volume [0-100|up|down]');
        process.exit(1);
      }
      
      // Get current volume first
      const stateRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const state = await stateRes.json();
      let currentVol = state?.device?.volume_percent || 50;
      
      let newVol;
      if (volArg === 'up') newVol = Math.min(100, currentVol + 10);
      else if (volArg === 'down') newVol = Math.max(0, currentVol - 10);
      else newVol = parseInt(volArg);
      
      endpoint = `volume?volume_percent=${newVol}`;
      method = 'PUT';
      console.log(`🔊 Volume: ${currentVol}% → ${newVol}%`);
      break;
    default:
      console.log('Usage: node control.js [play|pause|next|previous|volume]');
      process.exit(1);
  }
  
  const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body
  });
  
  if (response.status === 204 || response.status === 200) {
    console.log(`✅ ${command}`);
  } else if (response.status === 404) {
    console.error('❌ No active device. Open Spotify first.');
  } else {
    const error = await response.json().catch(() => ({}));
    console.error('❌ Failed:', error.error?.message || response.statusText);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
