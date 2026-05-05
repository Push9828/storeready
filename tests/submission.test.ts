import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runSubmissionChecks } from '../src/checks/submission.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

describe('runSubmissionChecks', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns single SUB-01 error when .storeready is missing', async () => {
    const results = await runSubmissionChecks(fixture('no-app-json'));
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('SUB-01');
    expect(results[0].passed).toBe(false);
  });

  it('passes SUB-01 and SUB-02 with valid demo account', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    expect(results.find((r) => r.id === 'SUB-01')!.passed).toBe(true);
    expect(results.find((r) => r.id === 'SUB-02')!.passed).toBe(true);
  });

  it('passes SUB-03 when app review notes are long enough', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    expect(results.find((r) => r.id === 'SUB-03')!.passed).toBe(true);
  });

  it('passes SUB-04 when privacy policy URL is valid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    expect(results.find((r) => r.id === 'SUB-04')!.passed).toBe(true);
  });

  it('passes SUB-05 when privacy policy URL returns 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    const sub05 = results.find((r) => r.id === 'SUB-05');
    expect(sub05!.passed).toBe(true);
  });

  it('fails SUB-05 with error when URL returns non-200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    const sub05 = results.find((r) => r.id === 'SUB-05');
    expect(sub05!.passed).toBe(false);
    expect(sub05!.severity).toBe('error');
  });

  it('fails SUB-05 with warning when URL times out', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
    const results = await runSubmissionChecks(fixture('submission-project'));
    const sub05 = results.find((r) => r.id === 'SUB-05');
    expect(sub05!.passed).toBe(false);
    expect(sub05!.severity).toBe('warning');
  });

  it('passes SUB-08 when version and buildNumber are set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    const sub08 = results.find((r) => r.id === 'SUB-08');
    expect(sub08!.passed).toBe(true);
    expect(sub08!.message).toContain('1.2.0');
    expect(sub08!.message).toContain('42');
  });

  it('passes SUB-07 for a valid reverse-domain bundle ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const results = await runSubmissionChecks(fixture('submission-project'));
    const sub07 = results.find((r) => r.id === 'SUB-07');
    expect(sub07!.passed).toBe(true);
  });
});
