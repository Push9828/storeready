import { Command } from '@oclif/core';
import ora from 'ora';
import { runConfigChecks } from '../checks/config.js';
import { runPermissionChecks } from '../checks/permissions.js';
import { runScreenshotChecks } from '../checks/screenshots.js';
import { runSubmissionChecks } from '../checks/submission.js';
import type { CheckResult } from '../types.js';
import { readExpoConfig } from '../utils/reader.js';
import {
  printAllPassed,
  printCategoryHeader,
  printHeader,
  printResult,
  printSummary,
} from '../utils/reporter.js';

export default class Check extends Command {
  static description = 'Check your Expo app for Apple App Store submission readiness';

  async run(): Promise<void> {
    const root = process.cwd();

    // Read app name and bundle ID for the header (best effort)
    let appName = 'Unknown';
    let bundleId = 'unknown';
    try {
      const config = await readExpoConfig(root);
      appName = config.name ?? 'Unknown';
      bundleId = config.ios?.bundleIdentifier ?? 'unknown';
    } catch {
      // Header will show fallback values; CFG-01 will report the real error
    }

    printHeader(appName, bundleId);

    const spinner = ora('Running checks...').start();

    // Run CFG checks first — if app.json is missing, skip everything else
    const cfgResults = await runConfigChecks(root);
    const cfgFailed = cfgResults.some((r) => r.id === 'CFG-01' && !r.passed);

    let permResults: CheckResult[] = [];
    let ssResults: CheckResult[] = [];
    let subResults: CheckResult[] = [];

    if (!cfgFailed) {
      [permResults, ssResults, subResults] = await Promise.all([
        runPermissionChecks(root),
        runScreenshotChecks(root),
        runSubmissionChecks(root),
      ]);
    }

    spinner.stop();

    // Print results by category
    const categories: Array<{ name: string; results: CheckResult[] }> = [
      { name: 'Permissions', results: permResults },
      { name: 'Screenshots', results: ssResults },
      { name: 'Submission Checklist', results: subResults },
      { name: 'App Config', results: cfgResults },
    ];

    for (const { name, results } of categories) {
      printCategoryHeader(name);

      if (results.length === 0) {
        console.log(`  —  No checks ran`);
      } else if (results.every((r) => r.passed)) {
        printAllPassed(name, results.length);
      } else {
        for (const result of results) {
          printResult(result);
        }
      }

      console.log();
    }

    // Summary and exit code
    const allResults = [...permResults, ...ssResults, ...subResults, ...cfgResults];
    printSummary(allResults);

    const errorCount = allResults.filter((r) => !r.passed && r.severity === 'error').length;
    if (errorCount > 0) {
      this.exit(1);
    }
  }
}
