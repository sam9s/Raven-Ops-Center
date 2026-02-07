# 🚀 Google Account Setup for Raven (raven9n@gmail.com)

**Goal:** Give Raven full access to Gmail, Calendar, Drive, Sheets, Docs

---

## Step 1: Go to Google Cloud Console

**URL:** https://console.cloud.google.com/

1. Sign in with **raven9n@gmail.com**
2. Accept terms if first time
3. Click "Select a project" → "New Project"
4. Project name: `Raven-OpenClaw`
5. Click "Create"

---

## Step 2: Enable APIs

Click the **hamburger menu (☰)** → "APIs & Services" → "Library"

Enable these one by one:

| API | Search Term |
|-----|-------------|
| ✅ Gmail API | "Gmail API" |
| ✅ Google Calendar API | "Calendar API" |
| ✅ Google Drive API | "Drive API" |
| ✅ Google Sheets API | "Sheets API" |
| ✅ Google Docs API | "Docs API" |
| ✅ Google People API | "People API" (for contacts) |

**For each:** Click → "Enable"

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. User Type: **External** (unless you have Google Workspace)
3. Click **Create**
4. Fill in:
   - **App name:** Raven
   - **User support email:** raven9n@gmail.com
   - **Developer contact:** raven9n@gmail.com
5. Click **Save and Continue**
6. **Scopes:** Click "Add or Remove Scopes"
   - Add these:
     - `.../auth/gmail.modify` (Gmail)
     - `.../auth/calendar` (Calendar)
     - `.../auth/drive` (Drive)
     - `.../auth/spreadsheets` (Sheets)
     - `.../auth/documents` (Docs)
   - Click **Update** → **Save and Continue**
7. **Test users:** Add `raven9n@gmail.com`
8. Click **Save and Continue** → **Back to Dashboard**

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Desktop app"**
4. Name: **"Raven-Desktop"**
5. Click **Create**
6. **Download the JSON file** (it'll be named like `client_secret_xxx.json`)

---

## Step 5: Share the File

Upload the downloaded `client_secret_xxx.json` file to:
- This Slack chat, OR
- Your VPS (I can guide you), OR
- Any secure location I can access

---

## Step 6: Raven Completes OAuth

Once you share the file, I'll:
1. Run the OAuth flow
2. Get a refresh token
3. Store it securely
4. Test Gmail, Calendar, Drive access

---

## 📋 Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled 6 APIs (Gmail, Calendar, Drive, Sheets, Docs, People)
- [ ] Configured OAuth consent screen
- [ ] Added raven9n@gmail.com as test user
- [ ] Created Desktop OAuth client ID
- [ ] Downloaded client_secret.json
- [ ] Shared file with Raven

---

## 🎯 What Raven Can Do Once Set Up

| Service | Actions |
|---------|---------|
| **Gmail** | Send emails, read inbox, search, manage labels |
| **Calendar** | Create events, check schedule, set reminders |
| **Drive** | Upload files, create folders, search documents |
| **Sheets** | Read/write spreadsheets, update cells, append data |
| **Docs** | Create documents, read content, export |

---

**Ready when you are, BFF!** Send me that client_secret.json and I'll get everything working. 🪶
