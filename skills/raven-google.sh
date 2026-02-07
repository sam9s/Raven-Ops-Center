#!/bin/bash
# Raven's Google CLI - Easy wrapper for all Google services

GOOGLE_API="/root/.openclaw/workspace/skills/google-api/google-api.js"

case "$1" in
  email)
    shift
    node "$GOOGLE_API" send-email "$@"
    ;;
  event)
    shift
    node "$GOOGLE_API" create-event "$@"
    ;;
  test)
    node "$GOOGLE_API" test
    ;;
  *)
    echo "Raven's Google CLI"
    echo ""
    echo "Usage: raven-google <command>"
    echo ""
    echo "Commands:"
    echo "  email <to> <subject> <body>   Send an email"
    echo "  event <summary> <start> <end> Create calendar event"
    echo "  test                          Test all APIs"
    echo ""
    echo "Examples:"
    echo '  raven-google email sam9s@gmx.com "Hello" "Message"'
    echo '  raven-google event "Meeting" "2026-02-04T10:00:00" "2026-02-04T11:00:00"'
    ;;
esac
