#!/usr/bin/env node
/**
 * Check for pending trigger files and process them
 * Called on startup/heartbeat
 */

const fs = require('fs');
const path = require('path');

const TRIGGER_DIR = '/root/.openclaw/workspace/.triggers';

function checkTriggers() {
  if (!fs.existsSync(TRIGGER_DIR)) {
    return [];
  }
  
  const triggers = [];
  const files = fs.readdirSync(TRIGGER_DIR);
  
  for (const file of files) {
    if (file.endsWith('.trigger')) {
      const triggerName = file.replace('.trigger', '');
      const triggerPath = path.join(TRIGGER_DIR, file);
      const timestamp = fs.readFileSync(triggerPath, 'utf8').trim();
      
      triggers.push({ name: triggerName, timestamp, path: triggerPath });
    }
  }
  
  return triggers;
}

function processTrigger(trigger) {
  console.log(`Processing trigger: ${trigger.name} (set at ${trigger.timestamp})`);
  
  // Delete the trigger file after processing
  fs.unlinkSync(trigger.path);
  
  // Return the action to take
  return trigger.name;
}

// Main
const triggers = checkTriggers();

if (triggers.length === 0) {
  console.log('No pending triggers.');
  process.exit(0);
}

console.log(`Found ${triggers.length} pending trigger(s):`);
for (const trigger of triggers) {
  const action = processTrigger(trigger);
  
  switch (action) {
    case 'morning-alarm':
      console.log('\n🎵 MORNING ALARM TRIGGERED');
      console.log('Action: Send good morning message + play romantic song');
      // In real usage, this would be handled by the main agent
      break;
    case 'status-report':
      console.log('\n📊 STATUS REPORT TRIGGERED');
      console.log('Action: Send daily status briefing');
      break;
    default:
      console.log(`Unknown trigger: ${action}`);
  }
}

console.log('\n✅ All triggers processed.');
