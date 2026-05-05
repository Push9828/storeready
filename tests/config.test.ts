import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runConfigChecks } from '../src/checks/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('runConfigChecks', () => {
  it('fails CFG-01 and returns early when no app.json exists', async () => {
    const results = await runConfigChecks(fixture('no-app-json'));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('CFG-01');
    expect(results[0].passed).toBe(false);
    expect(results[0].severity).toBe('error');
  });

  it('passes CFG-01, CFG-02, CFG-03 for a valid project', async () => {
    const results = await runConfigChecks(fixture('clean-project'));
    const cfg01 = results.find((r) => r.id === 'CFG-01');
    const cfg02 = results.find((r) => r.id === 'CFG-02');
    const cfg03 = results.find((r) => r.id === 'CFG-03');
    expect(cfg01!.passed).toBe(true);
    expect(cfg02!.passed).toBe(true);
    expect(cfg03!.passed).toBe(true);
  });

  it('fails CFG-02 when ios block is missing', async () => {
    const results = await runConfigChecks(fixture('no-ios-block'));
    const cfg02 = results.find((r) => r.id === 'CFG-02');
    expect(cfg02).toBeDefined();
    expect(cfg02!.passed).toBe(false);
    expect(cfg02!.severity).toBe('error');
  });

  it('fails CFG-04 when bundle ID contains placeholder value', async () => {
    const results = await runConfigChecks(fixture('placeholder-bundle'));
    const cfg04 = results.find((r) => r.id === 'CFG-04');
    expect(cfg04).toBeDefined();
    expect(cfg04!.passed).toBe(false);
    expect(cfg04!.severity).toBe('error');
  });

  it('passes CFG-04 for a valid bundle ID', async () => {
    const results = await runConfigChecks(fixture('clean-project'));
    const cfg04 = results.find((r) => r.id === 'CFG-04');
    expect(cfg04!.passed).toBe(true);
  });

  it('passes CFG-05 when no tracking packages are installed', async () => {
    const results = await runConfigChecks(fixture('clean-project'));
    const cfg05 = results.find((r) => r.id === 'CFG-05');
    expect(cfg05).toBeDefined();
    expect(cfg05!.passed).toBe(true);
  });
});
