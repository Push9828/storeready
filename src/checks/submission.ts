import type { CheckResult } from '../types.js';
import {
  readStoreReadyConfig,
  resolveValue,
  StoreReadyConfigMissingError,
} from '../utils/config.js';
import { readExpoConfig } from '../utils/reader.js';

const URL_REGEX = /^https?:\/\/.+\..+/i;
const BUNDLE_ID_REGEX = /^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/i;
const DEBUG_KEY_PATTERNS = ['test', 'debug', 'dev', 'staging', 'sandbox', 'localhost'];

async function checkUrlReachable(
  url: string
): Promise<{ ok: boolean; status?: number; timedOut?: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal, method: 'HEAD' });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, timedOut: true };
    }
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runSubmissionChecks(root: string = process.cwd()): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  let storeConfig;
  try {
    storeConfig = readStoreReadyConfig(root);
  } catch (err) {
    if (err instanceof StoreReadyConfigMissingError) {
      results.push({
        id: 'SUB-01',
        passed: false,
        severity: 'error',
        message: 'No demo account configured',
        detail:
          '.storeready config not found. Apple reviewers cannot test your app without login credentials.\n' +
          'Run npx storeready init to configure.',
      });
      return results;
    }
    throw err;
  }

  // SUB-01 + SUB-02: demo account credentials
  const account = storeConfig.demoAccount;
  const loginType = (account as { loginType?: string }).loginType ?? 'email';

  if (loginType === 'phone') {
    const phone = (account as { phone?: string }).phone?.trim();
    if (!phone) {
      results.push({
        id: 'SUB-01',
        passed: false,
        severity: 'error',
        message: 'No demo account phone number configured',
        detail:
          'Apple reviewers cannot test your app without login credentials.\n' +
          'Run storeready init to configure.',
      });
    } else {
      results.push({
        id: 'SUB-01',
        passed: true,
        severity: 'error',
        message: `Demo account phone configured (${phone})`,
      });
    }

    const otpNote = (account as { otpNote?: string }).otpNote?.trim();
    if (!otpNote) {
      results.push({
        id: 'SUB-02',
        passed: false,
        severity: 'error',
        message: 'OTP note missing',
        detail:
          'Apple reviewers need instructions for how to complete OTP login.\n' +
          'Add an otpNote explaining how to receive or bypass the OTP.',
      });
    } else {
      results.push({
        id: 'SUB-02',
        passed: true,
        severity: 'error',
        message: 'OTP login note configured',
      });
    }
  } else {
    const email = (account as { email?: string }).email?.trim();
    if (!email) {
      results.push({
        id: 'SUB-01',
        passed: false,
        severity: 'error',
        message: 'No demo account configured',
        detail:
          'Apple reviewers cannot test your app without login credentials.\n' +
          'Run storeready init to configure.',
      });
    } else {
      results.push({
        id: 'SUB-01',
        passed: true,
        severity: 'error',
        message: 'Demo account email configured',
      });
    }

    const rawPassword = (account as { password?: string }).password?.trim();
    if (!rawPassword) {
      results.push({
        id: 'SUB-02',
        passed: false,
        severity: 'error',
        message: 'Demo account password missing',
        detail: 'Apple reviewers need complete login credentials.',
      });
    } else {
      try {
        resolveValue(rawPassword);
        results.push({
          id: 'SUB-02',
          passed: true,
          severity: 'error',
          message: 'Demo account password configured',
        });
      } catch (err) {
        results.push({
          id: 'SUB-02',
          passed: false,
          severity: 'error',
          message: 'Demo account password env var not set',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // SUB-03: app review notes
  const notes = storeConfig.appReviewNotes?.trim() ?? '';
  if (notes.length < 20) {
    results.push({
      id: 'SUB-03',
      passed: false,
      severity: 'warning',
      message: `App Review notes are very short (${notes.length} chars)`,
      detail: 'Add more context for the reviewer.',
    });
  } else {
    results.push({
      id: 'SUB-03',
      passed: true,
      severity: 'warning',
      message: 'App Review notes present',
    });
  }

  // SUB-04: privacy policy URL format
  const privacyUrl = storeConfig.privacyPolicyUrl?.trim() ?? '';
  if (!privacyUrl || !URL_REGEX.test(privacyUrl)) {
    results.push({
      id: 'SUB-04',
      passed: false,
      severity: 'error',
      message: 'Privacy policy URL missing or invalid',
      detail: 'Apple requires a valid privacy policy URL for all apps.',
    });
  } else {
    results.push({
      id: 'SUB-04',
      passed: true,
      severity: 'error',
      message: 'Privacy policy URL set',
    });

    // SUB-05: privacy policy URL reachable
    const reachability = await checkUrlReachable(privacyUrl);
    if (reachability.timedOut) {
      results.push({
        id: 'SUB-05',
        passed: false,
        severity: 'warning',
        message: 'Privacy policy URL timed out',
        detail: 'Request timed out after 5s. Verify the URL is publicly accessible.',
      });
    } else if (!reachability.ok) {
      results.push({
        id: 'SUB-05',
        passed: false,
        severity: 'error',
        message: `Privacy policy URL returned ${reachability.status ?? 'error'}`,
        detail: 'Apple reviewers click this link — a broken URL causes rejection.',
      });
    } else {
      results.push({
        id: 'SUB-05',
        passed: true,
        severity: 'error',
        message: `Privacy policy URL reachable (${reachability.status} OK)`,
      });
    }
  }

  // SUB-06: support URL
  const supportUrl = storeConfig.supportUrl?.trim() ?? '';
  if (!supportUrl || !URL_REGEX.test(supportUrl)) {
    results.push({
      id: 'SUB-06',
      passed: false,
      severity: 'warning',
      message: 'Support URL missing or invalid',
      detail: 'Apple requires a support URL for all App Store listings.',
    });
  } else {
    results.push({
      id: 'SUB-06',
      passed: true,
      severity: 'warning',
      message: 'Support URL set',
    });
  }

  // Load Expo config for remaining checks
  let config;
  try {
    config = await readExpoConfig(root);
  } catch {
    return results;
  }

  // SUB-07: bundle ID format
  const bundleId = config.ios?.bundleIdentifier ?? '';
  if (bundleId && !BUNDLE_ID_REGEX.test(bundleId)) {
    results.push({
      id: 'SUB-07',
      passed: false,
      severity: 'warning',
      message: `Bundle ID format invalid: "${bundleId}"`,
      detail: 'Expected format: com.yourcompany.appname',
    });
  } else if (bundleId) {
    results.push({
      id: 'SUB-07',
      passed: true,
      severity: 'warning',
      message: `Bundle ID format valid (${bundleId})`,
    });
  }

  // SUB-08: version and buildNumber
  const version = config.version?.trim();
  const buildNumber = config.ios?.buildNumber?.trim();

  if (!version || !buildNumber) {
    results.push({
      id: 'SUB-08',
      passed: false,
      severity: 'error',
      message: !version ? 'version missing in app.json' : 'ios.buildNumber missing in app.json',
      detail: 'EAS requires both version and ios.buildNumber for App Store submissions.',
    });
  } else {
    results.push({
      id: 'SUB-08',
      passed: true,
      severity: 'error',
      message: `Version (${version}) and buildNumber (${buildNumber}) set`,
    });
  }

  // SUB-09: minimum OS version
  const minOs = config.ios?.minimumOsVersion?.trim();
  if (!minOs) {
    results.push({
      id: 'SUB-09',
      passed: false,
      severity: 'warning',
      message: 'ios.minimumOsVersion not set in app.json',
      detail: 'Apple requires a minimum OS version declaration. Example: "16.0"',
    });
  } else {
    results.push({
      id: 'SUB-09',
      passed: true,
      severity: 'warning',
      message: `Minimum OS version set (${minOs})`,
    });
  }

  // SUB-10: app name length
  const appName = config.name?.trim() ?? '';
  if (appName.length > 30) {
    results.push({
      id: 'SUB-10',
      passed: false,
      severity: 'error',
      message: `App name is ${appName.length} characters (limit: 30)`,
      detail: `Current name: "${appName}"\nApp Store limit is 30 characters. Truncation causes rejection.`,
    });
  } else if (appName) {
    results.push({
      id: 'SUB-10',
      passed: true,
      severity: 'error',
      message: `App name length OK (${appName.length}/30 chars)`,
    });
  }

  // SUB-11: no test/debug keys in app.json extra
  const extra = config.extra ?? {};
  const suspiciousEntry = Object.entries(extra).find(([key, value]) => {
    const keyLower = key.toLowerCase();
    const valueLower = typeof value === 'string' ? value.toLowerCase() : '';
    return DEBUG_KEY_PATTERNS.some((p) => keyLower.includes(p) || valueLower.includes(p));
  });

  if (suspiciousEntry) {
    results.push({
      id: 'SUB-11',
      passed: false,
      severity: 'warning',
      message: `Possible test/debug key detected in app.json extra: "${suspiciousEntry[0]}"`,
      detail: 'Remove test, debug, staging, or localhost values before App Store submission.',
    });
  } else {
    results.push({
      id: 'SUB-11',
      passed: true,
      severity: 'warning',
      message: 'No test/debug keys detected in app.json extra',
    });
  }

  return results;
}
