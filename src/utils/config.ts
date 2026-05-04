import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import type { StoreReadyConfig } from '../types.js';

export class StoreReadyConfigMissingError extends Error {
  constructor() {
    super('.storeready config not found.\n' + 'Run npx storeready init to set up your project.');
    this.name = 'StoreReadyConfigMissingError';
  }
}

export function readStoreReadyConfig(root: string = process.cwd()): StoreReadyConfig {
  const configPath = path.join(root, '.storeready');

  if (!fs.existsSync(configPath)) {
    throw new StoreReadyConfigMissingError();
  }

  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as StoreReadyConfig;
}

export async function writeStoreReadyConfig(
  config: StoreReadyConfig,
  root: string = process.cwd()
): Promise<void> {
  const configPath = path.join(root, '.storeready');
  await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function resolveValue(val: string): string {
  if (val.startsWith('$')) {
    const envKey = val.slice(1);
    const resolved = process.env[envKey];
    if (!resolved) {
      throw new Error(
        `Environment variable ${envKey} is not set.\n` +
          `Add it to your shell or CI secrets, then run storeready check again.`
      );
    }
    return resolved;
  }
  return val;
}
