# pratiplati (Desktop)

Cross-platform desktop app (Windows & macOS) that:
- Lets you pick files from your computer and sends each one individually as an email attachment to a recipient (subject defaults to the file name, or a custom subject you set in Settings).
- Checks your inbox for new emails from that recipient and downloads all attachments to a local folder.

No Google account or Google Drive required. Works with **Gmail, Outlook, Yahoo, or any custom IMAP/SMTP provider** via SMTP (send) + IMAP (receive). Gmail, Outlook and Yahoo connect with **OAuth** (no app password, no 2-Step Verification required); custom providers use normal SMTP/IMAP credentials. Settings and activity log are stored locally on your machine (no server, no database).

## Deliverability & privacy

- **Sending limits:** The app throttles sends with a configurable delay (default 2000 ms) to stay within provider rate limits and avoid spam filtering. A warning appears when you queue a large batch, and each provider's approximate daily sending limit is shown in Settings.
- **Spam avoidance:** Emails are sent with a non-empty subject (file name by default) to reduce the chance of being flagged as spam.
- **Local data only:** Files, attachments, your email address, app password, and settings are stored only on your machine (or your own OneDrive/SharePoint/Google Drive). The app connects directly to your email provider via SMTP/IMAP — no personal server is involved, so you stay in control and compliant with GDPR / local data-protection rules.

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
3. When the run finishes, download the `pratiplati-windows` artifact — it contains the `.exe` installer.

## Language

The app supports **English** and **Macedonian**, switchable at any time from the language toggle (EN / МК) in the top-right of the header. The choice is saved locally and persists between launches.

## Developer setup: OAuth client credentials

Gmail, Outlook and Yahoo connect via OAuth. As the developer you must register an app with each provider **once** and enter the resulting **Client ID / Client Secret** in the app's **Admin** tab (protected by an admin password you set on first use). This is free. The accountants who use the app never see or enter these credentials — they are preloaded, so users just click "Connect" and log in with their normal email/password (no 2-Step Verification required).

For the redirect URI, the app uses a local loopback server. It prefers port **3000** and automatically falls back to a free port if 3000 is taken.

- **Gmail / Outlook:** register the redirect URI as `http://localhost` — Google and Microsoft accept any loopback port, so the dynamic port works.
- **Yahoo:** requires an exact redirect URI match. Register the specific port the app reports (default `http://localhost:3000/`), or configure a fixed port.

### Gmail (Google Cloud Console)
1. Go to https://console.cloud.google.com/apis/credentials → **Create credentials → OAuth client ID**.
2. Application type: **Desktop app**.
3. Copy the **Client ID** and **Client Secret** into the app's Settings.
4. (Optional) On the OAuth consent screen, add the scope `https://mail.google.com/` and publish the app to **Production** so refresh tokens don't expire.

### Outlook / Microsoft 365 (Azure portal)
1. Go to https://portal.azure.com → **App registrations → New registration**.
2. Set redirect URI to `http://localhost:3000/` (type: **Public client / native**).
3. Under **API permissions**, add delegated permissions: `SMTP.Send` and `IMAP.AccessAsUser.All` (both under `https://outlook.office.com/`).
4. Enable **Allow public client flows** (required for the PKCE flow used here).
5. Copy the **Application (client) ID** into Settings. No client secret is needed for Outlook.
6. The mailbox must have IMAP/SMTP enabled (default for Outlook.com; for Microsoft 365 check with your admin).

### Yahoo (Yahoo Developer Network)
1. Go to https://developer.yahoo.com/apps/create/ → **Create app**.
2. Application type: **Web Application** (or Desktop), redirect URI `http://localhost:3000/`.
3. Scopes: `mail-r`, `mail-w`, `smtp-w`.
4. Copy the **Client ID** and **Client Secret** into Settings.

### Custom providers
For "Other (custom SMTP/IMAP)", no OAuth is used — enter the SMTP/IMAP host/port and your account password directly.

## Email account setup (in the app)

In the app's Settings tab:
1. Choose your provider (Gmail / Outlook / Yahoo / Other).
2. For Gmail/Outlook/Yahoo: click **Connect with [Provider]** and approve in the browser (the Client ID/Secret are preloaded by the admin). That's it — the account is connected and ready to use. For Other: enter your email + password and SMTP/IMAP details.
3. Enter the recipient email (this is editable anytime — it's both the "send to" address and the address checked for replies).
4. Choose a local download folder for attachments received from replies.
5. Use "Test connection" to verify SMTP + IMAP before use.

The connect button also appears on the **Dashboard** when the account isn't connected yet, so users can connect directly from the main screen without visiting Settings.
