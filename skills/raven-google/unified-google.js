#!/usr/bin/env node
/**
 * Unified Google API Client - Works across ALL channels (Slack, Telegram, WhatsApp)
 * Uses shared credentials from .secrets/
 */

const fs = require('fs');
const path = require('path');

// Shared credential paths (accessible to ALL sessions)
const TOKEN_FILE = '/root/.openclaw/workspace/.secrets/google-tokens.json';
const SECRET_FILE = '/root/.openclaw/workspace/client_secret_937007158994-2kcuvlve5rbaefjhe6hh8a5u1t8sf6ot.apps.googleusercontent.com.json';

// Load tokens (shared across all channels)
function loadTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch (e) {
    console.error('❌ Google tokens not found. Run auth setup first.');
    process.exit(1);
  }
}

// Get valid access token (refresh if needed)
async function getAccessToken() {
  const tokens = loadTokens();
  // For now, return existing token (we'll add refresh logic later if needed)
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
  
  const encodedEmail = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
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
  
  try {
    switch (command) {
      case 'send-email':
        const to = process.argv[3];
        const subject = process.argv[4];
        const body = process.argv[5];
        if (!to || !subject || !body) {
          console.error('Usage: raven-google send-email <to> "subject" "body"');
          process.exit(1);
        }
        const result = await sendEmail(to, subject, body);
        console.log('✅ Email sent!');
        console.log('Message ID:', result.id);
        break;
        
      case 'create-event':
        const summary = process.argv[3];
        const start = process.argv[4];
        const end = process.argv[5];
        if (!summary || !start || !end) {
          console.error('Usage: raven-google create-event "Summary" "2026-02-05T10:00:00" "2026-02-05T11:00:00"');
          process.exit(1);
        }
        const eventResult = await createEvent(summary, start, end);
        console.log('✅ Event created!');
        console.log('Link:', eventResult.htmlLink);
        break;
        
      case 'list-drive':
        const files = await listDriveFiles(10);
        console.log(`📁 ${files.files?.length || 0} files found`);
        files.files?.forEach(f => console.log(`- ${f.name}`));
        break;
        
      case 'test':
        console.log('🧪 Testing Google API...');
        const token = await getAccessToken();
        console.log('✅ Token loaded:', token.substring(0, 20) + '...');
        console.log('✅ Ready to use from ANY channel!');
        break;
        
      default:
        console.log(`
🚀 Raven's Unified Google API (Works on Slack, Telegram, WhatsApp)

Usage: raven-google <command>

Commands:
  send-email <to> "subject" "body"    Send email from raven9n@gmail.com
  create-event "title" "start" "end"  Create calendar event
  list-drive                          List Drive files
  test                                Test connection

Examples:
  raven-google send-email sam27sep@gmail.com "Hello" "Test message"
  raven-google create-event "Meeting" "2026-02-05T10:00:00" "2026-02-05T11:00:00"
`);
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
