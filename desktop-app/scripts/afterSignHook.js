// No paid Apple Developer certificate is configured for this app, so
// electron-builder produces an unsigned .app. Unsigned + quarantined apps
// fail Gatekeeper on Apple Silicon with "App is damaged and can't be opened".
// Ad-hoc signing (identity "-") makes the app's code signature internally
// consistent so Gatekeeper can at least validate it (user still needs to
// right-click > Open on first launch since it's not from an identified developer).
const { execFileSync } = require('child_process')
const path = require('path')

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)

  console.log(`[afterSign] Ad-hoc signing ${appPath}`)
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
}
