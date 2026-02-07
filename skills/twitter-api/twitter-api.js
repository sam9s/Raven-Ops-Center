const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Load credentials from env file
const envPath = '/root/.openclaw/workspace/.secrets/social-media.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(TWITTER_[^=]+)=(.+)$/);
  if (match) env[match[1]] = match[2].trim();
});

const API_KEY = env.TWITTER_API_KEY;
const API_SECRET = env.TWITTER_API_SECRET;
const ACCESS_TOKEN = env.TWITTER_ACCESS_TOKEN;
const ACCESS_TOKEN_SECRET = env.TWITTER_ACCESS_TOKEN_SECRET;
const BEARER_TOKEN = env.TWITTER_BEARER_TOKEN;

if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
  console.error('❌ Missing Twitter credentials');
  console.error('Required: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET');
  process.exit(1);
}

// OAuth 1.0a signature
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const paramString = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
}

function buildOAuth1Header(method, url, extraParams = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const params = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0',
    ...extraParams
  };
  
  params.oauth_signature = generateOAuthSignature(method, url, params, API_SECRET, ACCESS_TOKEN_SECRET);
  
  const header = 'OAuth ' + Object.keys(params).map(k => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`).join(', ');
  return header;
}

// API v2 Base URL
const API_BASE = 'https://api.twitter.com/2';

// Make OAuth 1.0a request (for user-context endpoints)
async function oauth1Request(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Authorization': buildOAuth1Header(method, url),
    'Content-Type': 'application/json'
  };
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Twitter API Error: ${data.detail || JSON.stringify(data)}`);
  }
  
  return data;
}

// Make Bearer Token request (for search/read-only)
async function bearerRequest(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Authorization': `Bearer ${BEARER_TOKEN}` };
  
  const response = await fetch(url, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Twitter API Error: ${data.detail || JSON.stringify(data)}`);
  }
  
  return data;
}

// Commands
async function postTweet(text) {
  return await oauth1Request('/tweets', 'POST', { text });
}

async function getUserByUsername(username) {
  return await oauth1Request(`/users/by/username/${username.replace('@', '')}`);
}

async function getUserTweets(userId, maxResults = 10) {
  const data = await oauth1Request(`/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`);
  return data.data || [];
}

async function getMyTweets(maxResults = 10) {
  const me = await oauth1Request('/users/me');
  return await getUserTweets(me.data.id, maxResults);
}

async function searchTweets(query, maxResults = 10) {
  // Search requires OAuth 1.0a for user context
  const data = await oauth1Request(`/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id`);
  return data.data || [];
}

async function likeTweet(tweetId) {
  const me = await oauth1Request('/users/me');
  return await oauth1Request(`/users/${me.data.id}/likes`, 'POST', { tweet_id: tweetId });
}

async function retweet(tweetId) {
  const me = await oauth1Request('/users/me');
  return await oauth1Request(`/users/${me.data.id}/retweets`, 'POST', { tweet_id: tweetId });
}

async function getMyInfo() {
  return await oauth1Request('/users/me');
}

// Main CLI
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'tweet':
        if (!arg) {
          console.error('Usage: node twitter-api.js tweet "Your tweet text"');
          process.exit(1);
        }
        const result = await postTweet(arg);
        console.log('✅ Tweet posted!');
        console.log(`ID: ${result.data.id}`);
        console.log(`Text: ${result.data.text}`);
        break;
        
      case 'timeline':
        const tweets = await getMyTweets(parseInt(arg) || 10);
        console.log(`\n📜 Recent tweets from @raven27n:\n`);
        tweets.forEach(t => {
          console.log(`[${new Date(t.created_at).toLocaleString()}]`);
          console.log(`${t.text}`);
          console.log(`❤️ ${t.public_metrics?.like_count || 0}  🔁 ${t.public_metrics?.retweet_count || 0}`);
          console.log(`ID: ${t.id}\n`);
        });
        break;
        
      case 'user':
        if (!arg) {
          console.error('Usage: node twitter-api.js user @username');
          process.exit(1);
        }
        const user = await getUserByUsername(arg);
        console.log(`\n👤 ${user.data.name} (@${user.data.username})`);
        console.log(`ID: ${user.data.id}`);
        console.log(`Description: ${user.data.description || 'No bio'}`);
        console.log(`Followers: ${user.data.public_metrics?.followers_count || 0}`);
        break;
        
      case 'user-tweets':
        if (!arg) {
          console.error('Usage: node twitter-api.js user-tweets @username');
          process.exit(1);
        }
        const targetUser = await getUserByUsername(arg);
        const userTweets = await getUserTweets(targetUser.data.id, 10);
        console.log(`\n📜 Recent tweets from @${targetUser.data.username}:\n`);
        userTweets.forEach(t => {
          console.log(`[${new Date(t.created_at).toLocaleString()}]`);
          console.log(`${t.text}`);
          console.log(`---`);
        });
        break;
        
      case 'search':
        if (!arg) {
          console.error('Usage: node twitter-api.js search "your query"');
          process.exit(1);
        }
        const searchResults = await searchTweets(arg, 10);
        console.log(`\n🔍 Search results for "${arg}":\n`);
        searchResults.forEach(t => {
          console.log(`[${new Date(t.created_at).toLocaleString()}]`);
          console.log(`${t.text}`);
          console.log(`---`);
        });
        break;
        
      case 'like':
        if (!arg) {
          console.error('Usage: node twitter-api.js like <tweet-id>');
          process.exit(1);
        }
        await likeTweet(arg);
        console.log('✅ Liked tweet!');
        break;
        
      case 'retweet':
        if (!arg) {
          console.error('Usage: node twitter-api.js retweet <tweet-id>');
          process.exit(1);
        }
        await retweet(arg);
        console.log('✅ Retweeted!');
        break;
        
      case 'me':
        const me = await getMyInfo();
        console.log(`\n👤 My Account:`);
        console.log(`Name: ${me.data.name}`);
        console.log(`Handle: @${me.data.username}`);
        console.log(`ID: ${me.data.id}`);
        break;
        
      default:
        console.log(`
🐦 Raven's Twitter API Client

Usage: node twitter-api.js <command> [args]

Commands:
  tweet "text"              Post a tweet
  timeline [n]              Show my recent tweets (default: 10)
  me                        Show my account info
  user @handle              Show user profile
  user-tweets @handle       Show user's tweets
  search "query"            Search tweets
  like <tweet-id>           Like a tweet
  retweet <tweet-id>        Retweet

Examples:
  node twitter-api.js tweet "Hello world!"
  node twitter-api.js timeline 5
  node twitter-api.js user @elonmusk
  node twitter-api.js search "Bollywood"
`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
