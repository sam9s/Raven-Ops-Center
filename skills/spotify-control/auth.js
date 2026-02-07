const http = require('http');
const url = require('url');
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
const REDIRECT_URI = env.SPOTIFY_REDIRECT_URI || 'http://localhost:8888/callback';

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

// Build auth URL
const authURL = 'https://accounts.spotify.com/authorize?' + 
  `client_id=${CLIENT_ID}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `scope=${encodeURIComponent(SCOPES)}&` +
  `state=${STATE}`;

console.log('\n🎵 Spotify Authorization\n');
console.log('Open this URL in your browser:');
console.log(authURL);
console.log('\nWaiting for callback...\n');

// Create server to handle callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;
    const error = parsedUrl.query.error;
    const returnedState = parsedUrl.query.state;
    
    if (error) {
      console.error('❌ Authorization error:', error);
      res.end('Authorization failed. Check console.');
      server.close();
      process.exit(1);
    }
    
    if (returnedState !== STATE) {
      console.error('❌ State mismatch. Possible CSRF attack.');
      res.end('Security error. Check console.');
      server.close();
      process.exit(1);
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('❌ Token error:', tokenData.error);
      res.end('Token exchange failed. Check console.');
      server.close();
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
    
    res.end('<h1>✅ Spotify Connected!</h1><p>You can close this tab and go back to Raven.</p>');
    server.close();
    process.exit(0);
  }
});

server.listen(8888, '0.0.0.0', () => {
  console.log('Listening on http://0.0.0.0:8888/callback');
  console.log('(External access: http://13.234.56.78:8888/callback)');
});
