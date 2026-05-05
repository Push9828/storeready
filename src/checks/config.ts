import * as fs from 'node:fs';
import * as path from 'node:path';
import type { CheckResult } from '../types.js';
import { readExpoConfig } from '../utils/reader.js';

const PLACEHOLDER_STRINGS = ['your-', 'com.example', 'com.company', 'todo', 'fixme', 'placeholder'];

export async function runConfigChecks(root: string = process.cwd()): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // CFG-01: app.json or app.config.js exists
  const hasAppJson = fs.existsSync(path.join(root, 'app.json'));
  const hasAppConfig = fs.existsSync(path.join(root, 'app.config.js'));

  if (!hasAppJson && !hasAppConfig) {
    results.push({
      id: 'CFG-01',
      passed: false,
      severity: 'error',
      message: 'app.json not found',
      detail:
        'No app.json or app.config.js found. storeready requires Expo config at project root.',
    });
    // No point running further checks without a config
    return results;
  }

  results.push({
    id: 'CFG-01',
    passed: true,
    severity: 'error',
    message: 'app.json found',
  });

  let config;
  try {
    config = await readExpoConfig(root);
  } catch {
    results.push({
      id: 'CFG-02',
      passed: false,
      severity: 'error',
      message: 'Failed to parse Expo config',
      detail: 'app.json or app.config.js could not be parsed. Check it is valid JSON.',
    });
    return results;
  }

  // CFG-02: ios block exists
  if (!config.ios || typeof config.ios !== 'object') {
    results.push({
      id: 'CFG-02',
      passed: false,
      severity: 'error',
      message: 'No ios block found in app.json',
      detail:
        'Add an "ios" block to your app.json expo config. iOS-specific configuration is required.',
    });
  } else {
    results.push({
      id: 'CFG-02',
      passed: true,
      severity: 'error',
      message: 'ios block present',
    });
  }

  // CFG-03: ios.bundleIdentifier present
  const bundleId = config.ios?.bundleIdentifier;
  if (!bundleId) {
    results.push({
      id: 'CFG-03',
      passed: false,
      severity: 'error',
      message: 'ios.bundleIdentifier missing',
      detail:
        'Add "bundleIdentifier" to the ios block in app.json. Required for App Store submission.',
    });
  } else {
    results.push({
      id: 'CFG-03',
      passed: true,
      severity: 'error',
      message: `Bundle ID set (${bundleId})`,
    });
  }

  // CFG-04: No placeholder values in critical fields
  const fieldsToCheck: Array<{ label: string; value: string | undefined }> = [
    { label: 'ios.bundleIdentifier', value: config.ios?.bundleIdentifier },
    { label: 'name', value: config.name },
  ];

  const placeholderField = fieldsToCheck.find(
    (f) => f.value && PLACEHOLDER_STRINGS.some((p) => f.value!.toLowerCase().includes(p))
  );

  if (placeholderField) {
    results.push({
      id: 'CFG-04',
      passed: false,
      severity: 'error',
      message: `Placeholder value detected in ${placeholderField.label}`,
      detail:
        `Current value: "${placeholderField.value}"\n` +
        `Replace placeholder values before App Store submission.`,
    });
  } else {
    results.push({
      id: 'CFG-04',
      passed: true,
      severity: 'error',
      message: 'No placeholder values detected in critical fields',
    });
  }

  // CFG-05: PrivacyInfo.xcprivacy present if tracking packages detected
  const packageJsonPath = path.join(root, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const pkgRaw = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { dependencies?: Record<string, string> };
    const deps = Object.keys(pkg.dependencies ?? {});
    const usesTracking = deps.includes('expo-tracking-transparency');

    if (usesTracking) {
      const privacyManifestPath = path.join(root, 'ios', 'PrivacyInfo.xcprivacy');
      if (!fs.existsSync(privacyManifestPath)) {
        results.push({
          id: 'CFG-05',
          passed: false,
          severity: 'warning',
          message: 'PrivacyInfo.xcprivacy not found',
          detail:
            'expo-tracking-transparency detected but PrivacyInfo.xcprivacy is missing.\n' +
            'If you use IDFA or fingerprinting, Apple will reject without it.',
        });
      } else {
        results.push({
          id: 'CFG-05',
          passed: true,
          severity: 'warning',
          message: 'PrivacyInfo.xcprivacy found',
        });
      }
    } else {
      results.push({
        id: 'CFG-05',
        passed: true,
        severity: 'warning',
        message: 'PrivacyInfo.xcprivacy not required (no tracking packages detected)',
      });
    }
  }

  return results;
}
