import chalk from 'chalk';
import type { CheckResult } from '../types.js';

export function printHeader(appName: string, bundleId: string): void {
  console.log();
  console.log(`  storeready v1.0.0  —  Apple App Store Readiness Check`);
  console.log(`  Project: ${appName} (${bundleId})`);
  console.log(`  ${'─'.repeat(53)}`);
  console.log();
}

export function printCategoryHeader(name: string): void {
  console.log(`  ${'─'.repeat(2)} ${name} ${'─'.repeat(Math.max(0, 48 - name.length))}`);
}

export function printResult(result: CheckResult): void {
  if (result.passed) {
    console.log(`  ✅  ${result.id}  ${result.message}`);
  } else if (result.severity === 'error') {
    console.log(`  ${chalk.red('❌')}  ${result.id}  ${chalk.red(result.message)}`);
    if (result.detail) {
      for (const line of result.detail.split('\n')) {
        console.log(`              ${line}`);
      }
    }
  } else {
    console.log(`  ${chalk.yellow('⚠️')}   ${result.id}  ${chalk.yellow(result.message)}`);
    if (result.detail) {
      for (const line of result.detail.split('\n')) {
        console.log(`              ${line}`);
      }
    }
  }
}

export function printAllPassed(categoryName: string, count: number): void {
  console.log(`  ✅  All ${categoryName} checks passed (${count} check${count === 1 ? '' : 's'})`);
}

export function printSummary(results: CheckResult[]): void {
  const errors = results.filter((r) => !r.passed && r.severity === 'error').length;
  const warnings = results.filter((r) => !r.passed && r.severity === 'warning').length;

  console.log();
  console.log(`  ${'─'.repeat(53)}`);

  if (errors === 0 && warnings === 0) {
    console.log(`  ${chalk.green(`✅  ${results.length} checks passed · 0 errors · 0 warnings`)}`);
    console.log();
    console.log(`  Your app looks ready for App Store submission.`);
    console.log(`  Good luck. 🚀`);
  } else {
    const parts = [];
    if (errors > 0) parts.push(chalk.red(`${errors} error${errors === 1 ? '' : 's'}`));
    if (warnings > 0) parts.push(chalk.yellow(`${warnings} warning${warnings === 1 ? '' : 's'}`));
    console.log(`  ${parts.join(' · ')}`);
    if (errors > 0) {
      console.log();
      console.log(
        `  ${chalk.red(`❌  Fix ${errors} error${errors === 1 ? '' : 's'} before submitting to the App Store.`)}`
      );
    }
  }

  console.log();
}
