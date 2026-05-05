# storeready

**Stop getting rejected. Ship with confidence.**

A CLI that checks your Expo/React Native app for Apple App Store submission readiness before you submit. Catches the mechanical mistakes that cause ~40% of rejections — missing permission descriptions, wrong screenshot sizes, broken privacy URLs, missing demo credentials.

```
$ npx storeready check

  storeready v1.0.0  —  Apple App Store Readiness Check
  Project: MyApp (com.mycompany.myapp)
  ─────────────────────────────────────────────────────

  ── Permissions ──────────────────────────────────────
  ✅  PERM-01  NSLocationWhenInUseUsageDescription present
  ❌  PERM-05  NSContactsUsageDescription missing
              You use expo-contacts (src/screens/Friends.tsx:12)
              Fix: Add to app.json → expo.ios.infoPlist:
              "NSContactsUsageDescription": "To find friends using the app"

  ── Screenshots ──────────────────────────────────────
  ✅  SS-02  iPhone 6.9" screenshot present (1320×2868)
  ❌  SS-03  Missing iPhone 6.7" screenshot (1290×2796px)

  ─────────────────────────────────────────────────────
  2 errors · 1 warning

  ❌  Fix 2 errors before submitting to the App Store.
```

## Installation

No install needed — just run with npx:

```bash
npx storeready init   # one-time setup
npx storeready check  # run before every submission
```

Or install globally:

```bash
npm install -g storeready
```

## Setup

Run `init` once per project from your Expo project root:

```bash
npx storeready init
```

This asks for your demo account credentials, privacy policy URL, support URL, and screenshots path, then writes a `.storeready` file to your project root. **Commit this file** — it's safe to store in git.

## The .storeready file

```json
{
  "demoAccount": {
    "email": "tester@yourapp.com",
    "password": "$DEMO_PASSWORD"
  },
  "appReviewNotes": "Tap 'Continue as Guest' to skip login",
  "privacyPolicyUrl": "https://yourapp.com/privacy",
  "supportUrl": "https://yourapp.com/support",
  "screenshotsPath": "./assets/screenshots"
}
```

**Passwords and secrets:** Prefix the value with `$` to read from an environment variable at runtime. The `.storeready` file itself never contains the real value — store it in your shell profile or CI secrets.

```bash
# In your shell or CI environment:
export DEMO_PASSWORD=your-actual-password
```

## What gets checked

| Category | Checks | Examples                                                                |
| -------- | ------ | ----------------------------------------------------------------------- |
| **PERM** | 10     | Expo package imports cross-referenced against `app.json infoPlist` keys |
| **SS**   | 6      | Screenshot dimensions for required iPhone sizes (1320×2868, 1290×2796)  |
| **SUB**  | 11     | Demo account, privacy URL reachability, version, app name length        |
| **CFG**  | 5      | `app.json` structure, bundle ID format, placeholder values              |

**Errors** exit with code 1 — they will block CI if you add `storeready check` to your pipeline.
**Warnings** print but exit 0 — advisory only.

Full check reference with IDs and error messages: [`storeready.md`](./storeready.md)

## Supported packages (permission scan)

`expo-location` · `expo-camera` · `expo-av` · `expo-microphone` · `expo-contacts` · `expo-media-library` · `expo-calendar` · `expo-face-detector` · `expo-local-authentication` · `expo-tracking-transparency` · `expo-sensors` · `expo-speech-recognition` · `expo-bluetooth` · `expo-health`

## Use in CI

```yaml
# GitHub Actions example
- name: Check App Store readiness
  run: npx storeready check
  env:
    DEMO_PASSWORD: ${{ secrets.DEMO_PASSWORD }}
```

## Requirements

- Node.js 18+
- Expo managed or bare workflow project with `app.json` or `app.config.js`

## License

MIT
