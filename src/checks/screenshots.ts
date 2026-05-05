import { imageSize } from 'image-size';
import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import type { CheckResult } from '../types.js';
import { readStoreReadyConfig, StoreReadyConfigMissingError } from '../utils/config.js';
import { readExpoConfig } from '../utils/reader.js';

interface DeviceSize {
  width: number;
  height: number;
  device: string;
  checkId: string;
}

const REQUIRED_SIZES: DeviceSize[] = [
  { width: 1320, height: 2868, device: 'iPhone 6.9"', checkId: 'SS-02' },
  { width: 1290, height: 2796, device: 'iPhone 6.7"', checkId: 'SS-03' },
];

const IPAD_SIZES: DeviceSize[] = [
  { width: 2064, height: 2752, device: 'iPad Pro 13"', checkId: 'SS-04' },
  { width: 2048, height: 2732, device: 'iPad Pro 12.9"', checkId: 'SS-04' },
];

interface ImageDimensions {
  width: number;
  height: number;
  filePath: string;
}

async function readScreenshotDimensions(screenshotsDir: string): Promise<ImageDimensions[]> {
  const dimensions: ImageDimensions[] = [];

  let entries;
  try {
    entries = await fsPromises.readdir(screenshotsDir, { withFileTypes: true });
  } catch {
    return dimensions;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(screenshotsDir, entry.name);
    try {
      const buffer = await fsPromises.readFile(filePath);
      const result = imageSize(buffer);
      if (result?.width && result?.height) {
        dimensions.push({ width: result.width, height: result.height, filePath });
      }
    } catch {
      // Not an image or unreadable — skip silently
    }
  }

  return dimensions;
}

export async function runScreenshotChecks(root: string = process.cwd()): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // SS-01: screenshots folder exists
  let screenshotsPath: string;
  try {
    const storeReadyConfig = readStoreReadyConfig(root);
    screenshotsPath = path.resolve(root, storeReadyConfig.screenshotsPath);
  } catch (err) {
    if (err instanceof StoreReadyConfigMissingError) {
      results.push({
        id: 'SS-01',
        passed: false,
        severity: 'error',
        message: 'Screenshots folder not configured',
        detail: '.storeready config not found. Run npx storeready init to set screenshots path.',
      });
      return results;
    }
    throw err;
  }

  if (!fs.existsSync(screenshotsPath)) {
    results.push({
      id: 'SS-01',
      passed: false,
      severity: 'error',
      message: `Screenshots folder not found at ${screenshotsPath}`,
      detail:
        'Screenshots folder not found at path configured in .storeready.\n' +
        'Run storeready init to set path.',
    });
    return results;
  }

  results.push({
    id: 'SS-01',
    passed: true,
    severity: 'error',
    message: `Screenshots folder found (${screenshotsPath})`,
  });

  const images = await readScreenshotDimensions(screenshotsPath);

  // SS-02 and SS-03: required device sizes
  for (const required of REQUIRED_SIZES) {
    const matches = images.filter(
      (img) => img.width === required.width && img.height === required.height
    );

    if (matches.length === 0) {
      results.push({
        id: required.checkId,
        passed: false,
        severity: 'error',
        message: `Missing ${required.device} screenshot (${required.width}×${required.height}px)`,
        detail:
          `Apple requires screenshots for all current iPhone sizes.\n` +
          `Add a ${required.width}×${required.height} screenshot to ${screenshotsPath}`,
      });
    } else {
      results.push({
        id: required.checkId,
        passed: true,
        severity: 'error',
        message: `${required.device} screenshot present (${required.width}×${required.height})`,
      });

      // SS-05: at least 3 screenshots per required device size
      if (matches.length < 3) {
        results.push({
          id: 'SS-05',
          passed: false,
          severity: 'warning',
          message: `Only ${matches.length} screenshot(s) found for ${required.device}`,
          detail: `Apple recommends 3–10 screenshots per device size.`,
        });
      }
    }
  }

  // SS-04: iPad screenshots if supportsTablet
  let config;
  try {
    config = await readExpoConfig(root);
  } catch {
    return results;
  }

  const supportsTablet = config.ios?.supportsTablet === true;

  if (supportsTablet) {
    const hasIpad = images.some((img) =>
      IPAD_SIZES.some((size) => img.width === size.width && img.height === size.height)
    );

    if (!hasIpad) {
      results.push({
        id: 'SS-04',
        passed: false,
        severity: 'error',
        message: 'iPad screenshots missing',
        detail:
          'supportsTablet is true but no iPad screenshots found.\n' +
          'Apple requires iPad screenshots if app supports iPad.\n' +
          `Expected: 2064×2752 or 2048×2732 in ${screenshotsPath}`,
      });
    } else {
      results.push({
        id: 'SS-04',
        passed: true,
        severity: 'error',
        message: 'iPad screenshots present',
      });
    }
  } else {
    results.push({
      id: 'SS-04',
      passed: true,
      severity: 'error',
      message: 'iPad screenshots not required (supportsTablet: false)',
    });
  }

  // SS-06: orientation mismatch
  const orientation = config.orientation;
  if (orientation === 'landscape' && images.length > 0) {
    const portraitScreenshots = images.filter((img) => img.height > img.width);
    if (portraitScreenshots.length > 0) {
      results.push({
        id: 'SS-06',
        passed: false,
        severity: 'warning',
        message: 'Portrait screenshots found in a landscape-only app',
        detail:
          'app.json orientation is "landscape" but some screenshots appear to be portrait.\n' +
          'Apple may reject screenshots that do not match the app orientation.',
      });
    } else {
      results.push({
        id: 'SS-06',
        passed: true,
        severity: 'warning',
        message: 'Screenshot orientations match app orientation',
      });
    }
  }

  return results;
}
