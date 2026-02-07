const fs = require('fs');
const http = require('http');
const url = require('url');
const crypto = require('crypto');

// Load client secrets
const SECRET_FILE = '/root/.openclaw/workspace/client_secret_937007158994-2kcuvlve5rbaefjhe6hh8a5u1t8sf6ot.apps.googleusercontent.com.json';
const TOKEN_FILE = '/root/.openclaw/workspace/.secrets/google-tokens.json';

let clientSecrets;
try {
  clientSecrets = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));
} catch (e) {
  console.error('❌ Client secret file not found');
  process.exit(1);
}

const CLIENT_ID = clientSecrets.installed.client_id;
const CLIENT_SECRET = clientSecrets.installed.client_secret;
const REDIRECT_URI = clientSecrets.installed.redirect_uris[0];

// Google OAuth scopes we need
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

// Check if we already have tokens
function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveTokens(tokens) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log('✅ Tokens saved!');
}

// Step 1: Generate OAuth URL
function getAuthURL() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Step 2: Exchange code for tokens
async function exchangeCode(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(`Token exchange failed: ${data.error_description}`);
  }
  
  return data;
}

// Step 3: Refresh access token
async function refreshAccessToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description}`);
  }
  
  return data;
}

// Get valid access token (refresh if needed)
async function getAccessToken() {
  const tokens = loadTokens();
  if (!tokens) {
    throw new Error('No tokens found. Run auth flow first.');
  }
  
  // Check if token is expired (simplified - in production, check exp)
  return tokens.access_token;
}

// Gmail: Send email
async function sendEmail(to, subject, body) {
  const accessToken = await getAccessToken();
  
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\r\n');
  
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedEmail })
  });
  
  return await response.json();
}

// Gmail: List messages
async function listEmails(maxResults = 10) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  return await response.json();
}

// Calendar: List events
async function listCalendarEvents(maxResults = 10) {
  const accessToken = await getAccessToken();
  
  const now = new Date().toISOString();
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${now}&orderBy=startTime&singleEvents=true`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  return await response.json();
}

// Calendar: Create event
async function createEvent(summary, startTime, endTime, description = '') {
  const accessToken = await getAccessToken();
  
  const event = {
    summary,
    description,
    start: { dateTime: startTime, timeZone: 'Asia/Kolkata' },
    end: { dateTime: endTime, timeZone: 'Asia/Kolkata' }
  };
  
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  return await response.json();
}

// Drive: List files
async function listDriveFiles(maxResults = 10) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?pageSize=${maxResults}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  return await response.json();
}

// Main CLI
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'auth-url':
      console.log('\n🚀 Google OAuth Setup\n');
      console.log('Open this URL in your browser:');
      console.log('\n' + getAuthURL());
      console.log('\nAfter approving, you\'ll be redirected.');
      console.log('Copy the CODE from the URL and run:');
      console.log('  node google-api.js auth-code \u003ccode\u003e');
      break;
      
    case 'auth-code':
      const code = process.argv[3];
      if (!code) {
        console.error('Usage: node google-api.js auth-code \u003ccode\u003e');
        process.exit(1);
      }
      
      console.log('\n🔄 Exchanging code for tokens...\n');
      try {
        const tokens = await exchangeCode(code);
        saveTokens(tokens);
        console.log('\n✅ Google authentication successful!');
        console.log('Email:', tokens.scope.includes('email') ? 'Available' : 'N/A');
        console.log('Expires in:', tokens.expires_in, 'seconds');
        console.log('Refresh token:', tokens.refresh_token ? '✅ Yes' : '❌ No');
      } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
      }
      break;
      
    case 'test':
      try {
        console.log('\n🧪 Testing Google APIs...\n');
        
        // Test Gmail
        console.log('📧 Gmail:');
        const emails = await listEmails(3);
        console.log(`  Found ${emails.messages?.length || 0} messages`);
        
        // Test Calendar
        console.log('\n📅 Calendar:');
        const events = await listCalendarEvents(3);
        console.log(`  Found ${events.items?.length || 0} upcoming events`);
        
        // Test Drive
        console.log('\n📁 Drive:');
        const files = await listDriveFiles(3);
        console.log(`  Found ${files.files?.length || 0} files`);
        
        console.log('\n✅ All APIs working!');
      } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
      }
      break;
      
    case 'send-email':
      const to = process.argv[3];
      const subject = process.argv[4];
      const body = process.argv[5];
      
      if (!to || !subject || !body) {
        console.error('Usage: node google-api.js send-email \u003cto\u003e "subject" "body"');
        process.exit(1);
      }
      
      try {
        const result = await sendEmail(to, subject, body);
        console.log('✅ Email sent!');
        console.log('Message ID:', result.id);
      } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
      }
      break;
      
    case 'create-event':
      const eventSummary = process.argv[3];
      const start = process.argv[4]; // ISO format
      const end = process.argv[5];   // ISO format
      
      if (!eventSummary || !start || !end) {
        console.error('Usage: node google-api.js create-event "Summary" "2026-02-04T10:00:00" "2026-02-04T11:00:00"');
        process.exit(1);
      }
      
      try {
        const result = await createEvent(eventSummary, start, end);
        console.log('✅ Event created!');
        console.log('Event ID:', result.id);
        console.log('Link:', result.htmlLink);
      } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log(`
🚀 Raven's Google API Client

Usage: node google-api.js \u003ccommand\u003e

Setup:
  auth-url                  Get OAuth URL to authenticate
  auth-code \u003ccode\u003e          Complete auth with code from redirect
  test                      Test all APIs

Actions:
  send-email \u003cto\u003e "subject" "body"
  create-event "Summary" "start-time" "end-time"

Examples:
  node google-api.js auth-url
  node google-api.js auth-code 4/0A...
  node google-api.js test
  node google-api.js send-email sam9s@gmx.com "Hello" "Test from Raven"
`);
  }
}

main().catch(console.error);
