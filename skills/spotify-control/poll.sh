#!/bin/bash
# Spotify Poller - Check what's currently playing and log it

cd /root/.openclaw/workspace/skills/spotify-control
node status.js > /tmp/current_track.txt 2>&1

if grep -q "▶️" /tmp/current_track.txt; then
  TRACK=$(grep "▶️" /tmp/current_track.txt | sed 's/▶️ //')
  ARTIST=$(grep "Artist:" /tmp/current_track.txt | sed 's/   Artist: //')
  ALBUM=$(grep "Album:" /tmp/current_track.txt | sed 's/   Album: //')
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
  
  # Append to daily log
  echo "| $TIMESTAMP | $TRACK | $ARTIST | $ALBUM | Auto-detected | |" >> /root/.openclaw/workspace/memory/spotify-tastes.md
fi
