// Copies electron/oauth-credentials.json into dist-electron/ so the packaged
// app can load the baked-in OAuth credentials at runtime. The source file is
// gitignored (real secrets are not committed), so this step is a no-op when the
// file is absent (e.g. in CI) — the build still succeeds.
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'electron', 'oauth-credentials.json')
const destDir = path.join(__dirname, '..', 'dist-electron')
const dest = path.join(destDir, 'oauth-credentials.json')

if (fs.existsSync(src)) {
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(src, dest)
  console.log('Copied oauth-credentials.json to dist-electron/')
} else {
  console.log('oauth-credentials.json not found — skipping (no baked-in credentials)')
}
