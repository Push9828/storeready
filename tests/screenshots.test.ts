import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('image-size', () => ({
  imageSize: vi.fn(),
}));

import { imageSize } from 'image-size';
import { runScreenshotChecks } from '../src/checks/screenshots.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, 'fixtures', name);
const mockImageSize = vi.mocked(imageSize);

describe('runScreenshotChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails SS-01 when .storeready config is missing', async () => {
    const results = await runScreenshotChecks(fixture('no-app-json'));
    const ss01 = results.find((r) => r.id === 'SS-01');
    expect(ss01).toBeDefined();
    expect(ss01!.passed).toBe(false);
    expect(ss01!.severity).toBe('error');
  });

  it('fails SS-01 when screenshots folder does not exist', async () => {
    const results = await runScreenshotChecks(fixture('screenshot-missing'));
    const ss01 = results.find((r) => r.id === 'SS-01');
    expect(ss01!.passed).toBe(false);
    expect(ss01!.message).toContain('not found');
  });

  it('passes SS-01 when screenshots folder exists', async () => {
    mockImageSize.mockReturnValue({ width: 1320, height: 2868, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss01 = results.find((r) => r.id === 'SS-01');
    expect(ss01!.passed).toBe(true);
  });

  it('passes SS-02 when iPhone 6.9" screenshot is present (1320x2868)', async () => {
    mockImageSize.mockReturnValue({ width: 1320, height: 2868, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss02 = results.find((r) => r.id === 'SS-02');
    expect(ss02!.passed).toBe(true);
  });

  it('fails SS-02 when no iPhone 6.9" screenshot is present', async () => {
    mockImageSize.mockReturnValue({ width: 1290, height: 2796, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss02 = results.find((r) => r.id === 'SS-02');
    expect(ss02!.passed).toBe(false);
    expect(ss02!.severity).toBe('error');
  });

  it('passes SS-03 when iPhone 6.7" screenshot is present (1290x2796)', async () => {
    mockImageSize.mockReturnValue({ width: 1290, height: 2796, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss03 = results.find((r) => r.id === 'SS-03');
    expect(ss03!.passed).toBe(true);
  });

  it('warns SS-05 when fewer than 3 screenshots exist for a device', async () => {
    // Only 1 file returns correct dimensions → count warning
    mockImageSize
      .mockReturnValueOnce({ width: 1320, height: 2868, type: 'png' })
      .mockReturnValue({ width: 999, height: 999, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss05 = results.find((r) => r.id === 'SS-05');
    expect(ss05).toBeDefined();
    expect(ss05!.passed).toBe(false);
    expect(ss05!.severity).toBe('warning');
  });

  it('passes SS-04 as not required when supportsTablet is false', async () => {
    mockImageSize.mockReturnValue({ width: 1320, height: 2868, type: 'png' });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    const ss04 = results.find((r) => r.id === 'SS-04');
    expect(ss04!.passed).toBe(true);
    expect(ss04!.message).toContain('not required');
  });

  it('skips files that are not images without crashing', async () => {
    mockImageSize.mockImplementation(() => {
      throw new Error('not an image');
    });
    const results = await runScreenshotChecks(fixture('screenshot-project'));
    // Should still produce SS-01 result at minimum without throwing
    expect(results.some((r) => r.id === 'SS-01')).toBe(true);
  });
});
