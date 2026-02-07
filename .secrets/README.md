# Secrets Directory

This folder contains sensitive API keys and tokens.

**NEVER** commit this folder to git.
**NEVER** paste contents from here into chat.

## Files

- `spotify.env` — Spotify API credentials and tokens

## Usage

1. Edit the `.env` files directly on the server (SSH, SFTP, etc.)
2. Ask Raven to read specific values when needed
3. Raven will use these for API calls but won't expose them in messages
