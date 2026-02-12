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

const CACHE_FILE = path.join(__dirname, 'discover-cache.json');
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

// Remix keywords to exclude
const REMIX_KEYWORDS = ['remix', 'remixed', 'edm mix', 'dj mix', 'club mix', 'dance mix', 're-mix'];

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
    throw new Error(`Token refresh failed: ${data.error}`);
  }
  return data.access_token;
}

async function searchArtist(artistName, accessToken) {
  const query = encodeURIComponent(artistName);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  if (data.artists && data.artists.items.length > 0) {
    return data.artists.items[0].id;
  }
  return null;
}

async function getRecommendations(seedArtistIds, accessToken) {
  // Try the recommendations API first
  const seeds = seedArtistIds.slice(0, 3).join(',');
  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_artists=${seeds}&limit=20&market=IN`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data.tracks || [];
  }

  // Fallback: Get top tracks from seed artists
  console.log('⚠️ Recommendations API unavailable, using fallback...');
  const allTracks = [];
  
  for (const artistId of seedArtistIds.slice(0, 2)) {
    const topTracksRes = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=IN`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (topTracksRes.ok) {
      const data = await topTracksRes.json();
      allTracks.push(...(data.tracks || []).slice(0, 3));
    }
  }
  
  return allTracks;
}

function isRemix(trackName) {
  const lowerName = trackName.toLowerCase();
  return REMIX_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function parseSpotifyTastes() {
  const tastesPath = path.join(__dirname, '..', '..', 'memory', 'spotify-tastes.md');
  
  if (!fs.existsSync(tastesPath)) {
    return [];
  }

  const content = fs.readFileSync(tastesPath, 'utf8');
  const plays = [];
  
  // Parse the markdown table
  const lines = content.split('\n');
  let inTable = false;
  
  for (const line of lines) {
    if (line.includes('| Time (IST) | Track | Artist |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        plays.push({
          date: parts[0],
          track: parts[1],
          artist: parts[2],
          album: parts[3]
        });
      }
    }
  }
  
  return plays;
}

function getTopArtists(plays, limit = 3) {
  const artistCounts = {};
  
  plays.forEach(play => {
    // Split combined artists like "Udit Narayan, Sadhana Sargam"
    const artists = play.artist.split(/,\s*/);
    artists.forEach(artist => {
      artist = artist.trim();
      if (artist) {
        artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      }
    });
  });

  return Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - cache.timestamp;
      
      if (age < CACHE_DURATION_MS) {
        console.log('✅ Using cached recommendations (age:', Math.round(age/60000), 'minutes)');
        return cache.recommendations;
      }
    }
  } catch (err) {
    console.error('Cache read error:', err.message);
  }
  return null;
}

function saveCache(recommendations) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      recommendations
    }, null, 2));
  } catch (err) {
    console.error('Cache write error:', err.message);
  }
}

async function generateDiscoverRecommendations() {
  // Check cache first
  const cached = loadCache();
  if (cached) {
    return cached;
  }

  console.log('🎵 Generating fresh recommendations...');

  // Parse listening history
  const plays = parseSpotifyTastes();
  if (plays.length === 0) {
    return [];
  }

  // Get top 3 artists
  const topArtists = getTopArtists(plays, 3);
  console.log('🎤 Top artists:', topArtists.join(', '));

  // Get access token
  const accessToken = await getAccessToken();

  // Search for artist IDs
  const artistIds = [];
  for (const artist of topArtists) {
    const id = await searchArtist(artist, accessToken);
    if (id) {
      artistIds.push(id);
      console.log(`✅ Found Spotify ID for ${artist}`);
    } else {
      console.log(`⚠️ Could not find Spotify ID for ${artist}`);
    }
  }

  if (artistIds.length === 0) {
    throw new Error('Could not find any Spotify artist IDs');
  }

  // Get recommendations from Spotify
  const tracks = await getRecommendations(artistIds, accessToken);

  // Filter out remixes and format
  const recommendations = tracks
    .filter(track => !isRemix(track.name))
    .slice(0, 5)
    .map(track => ({
      type: 'song',
      title: track.name,
      subtitle: `${track.artists.map(a => a.name).join(', ')} • ${track.album.name}`,
      reason: `Because you listen to ${topArtists[0]}`,
      match: Math.round(85 + Math.random() * 10), // 85-95% match
      spotifyUrl: track.external_urls.spotify,
      image: track.album.images[0]?.url
    }));

  // Save to cache
  saveCache(recommendations);

  console.log(`✅ Generated ${recommendations.length} recommendations`);
  return recommendations;
}

// CLI usage
if (require.main === module) {
  generateDiscoverRecommendations()
    .then(recs => {
      console.log('\n🎵 Recommendations:');
      console.log(JSON.stringify(recs, null, 2));
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { generateDiscoverRecommendations, parseSpotifyTastes, getTopArtists };
