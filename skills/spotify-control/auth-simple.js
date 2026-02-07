const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

if (!CLIENT_ID || CLIENT_ID === 'your_client_id_here') {
  console.error('❌ Please set SPOTIFY_CLIENT_ID in .secrets/spotify.env');
  process.exit(1);
}

if (!CLIENT_SECRET || CLIENT_SECRET === 'your_client_secret_here') {
  console.error('❌ Please set SPOTIFY_CLIENT_SECRET in .secrets/spotify.env');
  process.exit(1);
}

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control'
].join(' ');

// Generate random state
const STATE = Math.random().toString(36).substring(7);

console.log('\n🎵 Spotify Authorization\n');
console.log('Since we\'re on different machines (VPS vs your browser),');
console.log('we\'ll do this the manual way.\n');

console.log('Step 1: Open this URL in your browser:');
console.log('');
console.log(`https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=https://open.spotify.com&scope=${encodeURIComponent(SCOPES)}&state=${STATE}`);
console.log('');
console.log('Step 2: After you approve, you\'ll be redirected to Spotify.');
console.log('        Look at the URL in your browser - copy the CODE from:');
console.log('        https://open.spotify.com/?code=AQC...&state=...');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste the code here: ', async (code) => {
  code = code.trim();
  
  if (!code) {
    console.error('❌ No code provided');
    rl.close();
    process.exit(1);
  }
  
  console.log('\n🔄 Exchanging code for tokens...\n');
  
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=https://open.spotify.com`
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ Token error:', tokenData.error);
      console.error('Description:', tokenData.error_description);
      rl.close();
      process.exit(1);
    }
    
    // Save refresh token to env file
    const refreshToken = tokenData.refresh_token;
    const newEnvContent = envContent.replace(
      /SPOTIFY_REFRESH_TOKEN=.*/,
      `SPOTIFY_REFRESH_TOKEN=${refreshToken}`
    );
    
    if (!envContent.includes('SPOTIFY_REFRESH_TOKEN=')) {
      fs.writeFileSync(envPath, envContent + `\nSPOTIFY_REFRESH_TOKEN=${refreshToken}\n`);
    } else {
      fs.writeFileSync(envPath, newEnvContent);
    }
    
    console.log('✅ Authorization successful!');
    console.log('🎵 You can now control Spotify.\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  rl.close();
  process.exit(0);
});
