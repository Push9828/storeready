import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as path from 'node:path';
import { PERMISSION_MAP, PLACEHOLDER_VALUES } from '../maps/permissions.js';
import type { CheckResult } from '../types.js';
import { readExpoConfig } from '../utils/reader.js';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__tests__', '.expo']);

async function collectSourceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  let entries;
  try {
    entries = await fsPromises.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      const nested = await collectSourceFiles(path.join(dir, entry.name));
      files.push(...nested);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function findImportLine(content: string, packageName: string): number | null {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`'${packageName}'`) || lines[i].includes(`"${packageName}"`)) {
      return i + 1; // 1-based line number
    }
  }
  return null;
}

export async function runPermissionChecks(root: string = process.cwd()): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  let config;
  try {
    config = await readExpoConfig(root);
  } catch {
    // Config checks will report this — skip permission checks silently
    return results;
  }

  const infoPlist = config.ios?.infoPlist ?? {};
  const srcDir = path.join(root, 'src');

  // Collect all source files (fall back to root if no src/ dir)
  const searchDir = fs.existsSync(srcDir) ? srcDir : root;
  const sourceFiles = await collectSourceFiles(searchDir);

  // For each file, read content once and scan for all package matches
  interface Match {
    plistKey: string;
    checkId: string;
    errorMessage: string;
    file: string;
    line: number;
  }

  const triggered = new Map<string, Match>(); // plistKey → first match found

  for (const filePath of sourceFiles) {
    let content: string;
    try {
      content = await fsPromises.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }

    for (const mapping of PERMISSION_MAP) {
      if (triggered.has(mapping.plistKey)) continue; // already found

      const hasPackage =
        content.includes(`'${mapping.package}'`) || content.includes(`"${mapping.package}"`);
      if (!hasPackage) continue;

      if (mapping.conditionalCall && !content.includes(mapping.conditionalCall)) continue;

      const line = findImportLine(content, mapping.package) ?? 1;
      const relPath = path.relative(root, filePath);

      triggered.set(mapping.plistKey, {
        plistKey: mapping.plistKey,
        checkId: mapping.checkId,
        errorMessage: mapping.errorMessage,
        file: `${relPath}:${line}`,
        line,
      });
    }
  }

  // Deduplicate check IDs — one result per checkId, using first match
  const seenCheckIds = new Map<string, Match>();
  for (const match of triggered.values()) {
    if (!seenCheckIds.has(match.checkId)) {
      seenCheckIds.set(match.checkId, match);
    }
  }

  // Emit a result for each triggered check
  for (const match of seenCheckIds.values()) {
    const keyValue = infoPlist[match.plistKey];

    if (!keyValue) {
      results.push({
        id: match.checkId,
        passed: false,
        severity: 'error',
        message: match.errorMessage,
        detail:
          `Found usage in ${match.file}\n` +
          `Fix: Add to app.json → expo.ios.infoPlist:\n` +
          `"${match.plistKey}": "Describe why your app needs this"`,
        file: match.file,
      });
    } else {
      results.push({
        id: match.checkId,
        passed: true,
        severity: 'error',
        message: `${match.plistKey} present`,
      });
    }
  }

  // PERM-10: check existing plist values for placeholders / short strings
  for (const [key, value] of Object.entries(infoPlist)) {
    if (typeof value !== 'string') continue;
    const lower = value.toLowerCase().trim();
    const isPlaceholder = PLACEHOLDER_VALUES.has(lower);
    const isTooShort = value.trim().length < 10;

    if (isPlaceholder || isTooShort) {
      results.push({
        id: 'PERM-10',
        passed: false,
        severity: 'warning',
        message: `${key} value looks like a placeholder`,
        detail:
          `Current: "${value}"\n` +
          `Tip: Be specific. Example: "To scan QR codes for event check-in"`,
      });
      return results; // one PERM-10 warning is enough
    }
  }

  if (triggered.size > 0) {
    results.push({
      id: 'PERM-10',
      passed: true,
      severity: 'warning',
      message: 'Permission description values look meaningful',
    });
  }

  return results;
}
