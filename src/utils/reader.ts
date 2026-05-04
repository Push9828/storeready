import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import type { ExpoConfig } from '../types.js';

export async function readExpoConfig(root: string = process.cwd()): Promise<ExpoConfig> {
  const appJsonPath = path.join(root, 'app.json');

  if (fs.existsSync(appJsonPath)) {
    const raw = await fsPromises.readFile(appJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return (parsed.expo ?? parsed) as ExpoConfig;
  }

  const appConfigPath = path.join(root, 'app.config.js');

  if (fs.existsSync(appConfigPath)) {
    const require = createRequire(import.meta.url);
    const mod = require(appConfigPath) as unknown;
    const config = typeof mod === 'function' ? (mod as (ctx: unknown) => unknown)({}) : mod;
    const asRecord = config as Record<string, unknown>;
    return (asRecord.expo ?? config) as ExpoConfig;
  }

  throw new Error(
    'No app.json or app.config.js found at project root.\n' +
      'storeready requires an Expo config file to run checks.'
  );
}
