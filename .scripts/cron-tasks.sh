#!/bin/bash
# Persistent Task Scheduler - Triggered by System Cron
# Writes trigger files that Raven checks on startup/heartbeat

TRIGGER_DIR="/root/.openclaw/workspace/.triggers"
mkdir -p "$TRIGGER_DIR"

case "$1" in
  morning-alarm)
    echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_DIR/morning-alarm.trigger"
    # Generate morning briefing
    cd /root/.openclaw/workspace/.scripts
    node morning-briefing.js > /tmp/morning-briefing.txt 2>&1
    echo "[$(date)] Morning alarm + briefing triggered" >> /tmp/persistent-cron.log
    
    # Try to play romantic wake-up song
    echo "[$(date)] Attempting to play wake-up song..." >> /tmp/persistent-cron.log
    
    # Get Spotify credentials
    SPOTIFY_ENV="/root/.openclaw/workspace/.secrets/spotify.env"
    if [ -f "$SPOTIFY_ENV" ]; then
      CLIENT_ID=$(grep SPOTIFY_CLIENT_ID "$SPOTIFY_ENV" | cut -d'=' -f2 | tr -d ' ')
      CLIENT_SECRET=$(grep SPOTIFY_CLIENT_SECRET "$SPOTIFY_ENV" | cut -d'=' -f2 | tr -d ' ')
      REFRESH_TOKEN=$(grep SPOTIFY_REFRESH_TOKEN "$SPOTIFY_ENV" | cut -d'=' -f2 | tr -d ' ')
      
      # Get fresh access token
      TOKEN_RESPONSE=$(curl -s -X POST https://accounts.spotify.com/api/token \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=refresh_token" \
        -d "refresh_token=$REFRESH_TOKEN" \
        -d "client_id=$CLIENT_ID" \
        -d "client_secret=$CLIENT_SECRET")
      
      ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
      
      if [ -n "$ACCESS_TOKEN" ]; then
        # Check for available devices
        DEVICES=$(curl -s -X GET "https://api.spotify.com/v1/me/player/devices" \
          -H "Authorization: Bearer $ACCESS_TOKEN")
        
        # Get first available device ID
        DEVICE_ID=$(echo "$DEVICES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$DEVICE_ID" ]; then
          # Romantic songs from Sammy's history (Spotify URIs)
          SONGS=(
            "spotify:track:6dFQ3W3xuG4ll7cNjIsN2Q"  # Tujhe Dekha To
            "spotify:track:1g9U7ygLH1R8bda0LKCw4l"  # Akele Hain To Kya Gam Hai
            "spotify:track:4cWWWt7T1LK2tJQVf5B2vW"  # Pehla Nasha
            "spotify:track:6IE6V4V8T8r5l5n7i7gM5N"  # Kabootar Ja Ja Ja
            "spotify:track:0m3cF2yJ1v8r9t0k5l7d9h"  # Such Keh Raha Hai
          )
          
          # Pick random song
          RANDOM_SONG=${SONGS[$RANDOM % ${#SONGS[@]}]}
          
          # Play on device
          PLAY_RESULT=$(curl -s -X PUT "https://api.spotify.com/v1/me/player/play?device_id=$DEVICE_ID" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"uris\": [\"$RANDOM_SONG\"]}")
          
          if [ -z "$PLAY_RESULT" ]; then
            echo "[$(date)] ✅ Wake-up song playing on Spotify device" >> /tmp/persistent-cron.log
          else
            echo "[$(date)] ⚠️ Spotify play error: $PLAY_RESULT" >> /tmp/persistent-cron.log
          fi
        else
          echo "[$(date)] ⚠️ No active Spotify device found (keep Spotify app running!)" >> /tmp/persistent-cron.log
        fi
      else
        echo "[$(date)] ⚠️ Failed to refresh Spotify token" >> /tmp/persistent-cron.log
      fi
    else
      echo "[$(date)] ⚠️ Spotify env file not found" >> /tmp/persistent-cron.log
    fi
    ;;
  status-report)
    echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$TRIGGER_DIR/status-report.trigger"
    echo "[$(date)] Status report triggered" >> /tmp/persistent-cron.log
    ;;
  spotify-poll)
    cd /root/.openclaw/workspace/skills/spotify-control
    node poll.js >> /tmp/spotify-poll.log 2>&1
    ;;
  *)
    echo "Usage: $0 {morning-alarm|status-report|spotify-poll}"
    exit 1
    ;;
esac
