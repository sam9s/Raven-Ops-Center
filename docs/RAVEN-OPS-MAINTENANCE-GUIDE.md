# 🐦 Raven Operations & Maintenance Guide
**Server:** srv1001519 | **AI:** Kimi-Coding K2.5 | **Date:** Feb 2026

---

## 🚀 The "Gold" Configuration
These are the manual fixes we applied to make Raven stable:

### 1. The IPv4 Shield (Crucial)
To prevent "Fetch Failed" errors caused by VPS IPv6 bugs, we forced IPv4.
* **Location:** `~/.config/systemd/user/openclaw-gateway.service.d/override.conf`
* **Setting:** `NODE_OPTIONS=--dns-result-order=ipv4first`

### 2. The Self-Healing Guardian
We set the system to automatically resurrect Raven if he crashes.
* **Settings:** `Restart=always`, `RestartSec=5s`

### 3. RAM Optimization
* **Profile:** 16GB RAM allocation is enabled in the `.env` file.

---

## 🛠 Emergency Command Toolkit

| Task | Command |
| :--- | :--- |
| **Check if Raven is Alive** | `systemctl --user status openclaw-gateway` |
| **Read Raven's Thoughts** | `journalctl --user -u openclaw-gateway -n 50 --no-pager` |
| **Live Stream Logs** | `journalctl --user -u openclaw-gateway -f` |
| **Emergency Restart** | `systemctl --user restart openclaw-gateway` |
| **Fix Broken JSON** | `openclaw doctor --fix` |

---

## 🤖 Instructions for Raven
*Copy these and send them to Raven on Telegram to "prime" his brain:*

"Raven, you are running on a high-performance 16GB VPS. Your networking is locked to IPv4 for stability. If you encounter errors, remind me to check the `journalctl` logs. You have permission to use your full memory capacity for complex tasks."

---

## 🆘 Troubleshooting Flowchart
1. **Raven not replying?** Run `systemctl --user status openclaw-gateway`.
2. **Status says 'Failed'?** Run `openclaw doctor --fix` and then `systemctl --user restart openclaw-gateway`.
3. **Still not working?** Run `openclaw onboard`, choose **Gateway**, paste the key, and select **Restart** (NOT Reinstall).