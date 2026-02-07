#!/usr/bin/env node
/**
 * Telegram Polling Bridge for OpenClaw
 * Polls Telegram for messages and forwards to OpenClaw
 */

const BOT_TOKEN = '8267153638:AAGZV9vGwCrBpLUBIPUXB0d6onfLz-etU9I';
const ALLOWED_CHAT = '8499732151';
const OPENCLAW_GATEWAY = 'ws://127.0.0.1:18789';

let lastUpdateId = 0;

async function getUpdates() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=10`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return;
    }
    
    for (const update of data.result) {
      lastUpdateId = update.update_id;
      
      if (update.message && update.message.chat.id.toString() === ALLOWED_CHAT) {
        const msg = update.message;
        console.log(`[Telegram] ${msg.from.first_name}: ${msg.text}`);
        
        // Forward to OpenClaw via system event
        // This would need to be integrated with the Gateway
        console.log('Would forward to OpenClaw:', msg.text);
      }
    }
  } catch (e) {
    console.error('Error polling Telegram:', e.message);
  }
}

// Poll every 2 seconds
console.log('Telegram polling started...');
setInterval(getUpdates, 2000);
