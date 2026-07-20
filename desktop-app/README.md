# Email File Manager (Desktop)

Cross-platform desktop app (Windows & macOS) that:
- Lets you pick files from your computer and sends each one individually as an email attachment to a recipient (no subject/body).
- Checks your inbox for new emails from that recipient and downloads all attachments to a local folder.

No Google account or Google Drive required. Works with **Gmail, Outlook, Yahoo, or any custom IMAP/SMTP provider** via SMTP (send) + IMAP (receive), authenticated with an app password. Settings and activity log are stored locally on your machine (no server, no database).

## Setup

```bash
npm install
```

## Run in development

```bash
npm run dev
```

## Build production bundle

```bash
npm run build
```

## Package installers

```bash
npm run dist:mac    # .dmg / .zip for macOS (Intel and Apple Silicon: pass --x64 / --arm64 to electron-builder as needed)
npm run dist:win    # .exe (NSIS installer) for Windows
npm run dist        # both (cross-building Windows exe from macOS requires Wine, or build on Windows)
```

Installers are written to `release/`.

### Building the Windows .exe via GitHub Actions

This repo includes `.github/workflows/build-windows.yml`, which builds the Windows installer on a real Windows GitHub-hosted runner (no Wine needed). To use it:

1. Push this repository to GitHub.
2. Go to the **Actions** tab → **Build Windows Desktop App** → **Run workflow** (or just push a change under `desktop-app/`).
3. When the run finishes, download the `email-file-manager-windows` artifact — it contains the `.exe` installer.

## Language

The app supports **English** and **Macedonian**, switchable at any time from the language toggle (EN / МК) in the top-right of the header. The choice is saved locally and persists between launches.

## Email account setup

In the app's Settings tab:
1. Choose your provider (Gmail / Outlook / Yahoo / Other).
2. Enter your email address and an **app password** (not your normal password — each provider requires enabling 2-step verification and generating an app password; links are shown in-app).
3. Enter the recipient email (this is editable anytime — it's both the "send to" address and the address checked for replies).
4. Choose a local download folder for attachments received from replies.
5. Use "Test connection" to verify SMTP + IMAP credentials before use.
