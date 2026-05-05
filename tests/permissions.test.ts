import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runPermissionChecks } from '../src/checks/permissions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('runPermissionChecks', () => {
  it('passes PERM-03 when expo-camera is imported and NSCameraUsageDescription is present', async () => {
    const results = await runPermissionChecks(fixture('clean-project'));
    const perm03 = results.find((r) => r.id === 'PERM-03');
    expect(perm03).toBeDefined();
    expect(perm03!.passed).toBe(true);
  });

  it('fails PERM-03 when expo-camera is imported but NSCameraUsageDescription is missing', async () => {
    const results = await runPermissionChecks(fixture('missing-plist'));
    const perm03 = results.find((r) => r.id === 'PERM-03');
    expect(perm03).toBeDefined();
    expect(perm03!.passed).toBe(false);
    expect(perm03!.severity).toBe('error');
    expect(perm03!.detail).toContain('NSCameraUsageDescription');
  });

  it('includes file reference in failing result', async () => {
    const results = await runPermissionChecks(fixture('missing-plist'));
    const perm03 = results.find((r) => r.id === 'PERM-03');
    expect(perm03!.file).toMatch(/Camera\.js/);
  });

  it('warns PERM-10 when plist value is too short', async () => {
    const results = await runPermissionChecks(fixture('short-plist'));
    const perm10 = results.find((r) => r.id === 'PERM-10');
    expect(perm10).toBeDefined();
    expect(perm10!.passed).toBe(false);
    expect(perm10!.severity).toBe('warning');
  });

  it('passes PERM-01 when expo-location is imported and foreground key is present', async () => {
    const results = await runPermissionChecks(fixture('foreground-only'));
    const perm01 = results.find((r) => r.id === 'PERM-01');
    expect(perm01).toBeDefined();
    expect(perm01!.passed).toBe(true);
  });

  it('does not trigger PERM-02 when requestBackgroundPermissionsAsync is not called', async () => {
    const results = await runPermissionChecks(fixture('foreground-only'));
    const perm02 = results.find((r) => r.id === 'PERM-02');
    // PERM-02 should not appear at all — no background call found
    expect(perm02).toBeUndefined();
  });

  it('passes PERM-02 when background location is used and both keys are present', async () => {
    const results = await runPermissionChecks(fixture('background-location'));
    const perm02 = results.find((r) => r.id === 'PERM-02');
    expect(perm02).toBeDefined();
    expect(perm02!.passed).toBe(true);
  });

  it('returns empty array when no app.json exists', async () => {
    const results = await runPermissionChecks(fixture('no-app-json'));
    expect(results).toHaveLength(0);
  });
});
