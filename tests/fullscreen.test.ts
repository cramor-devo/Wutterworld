import { describe, expect, it } from 'vitest';
import { fullscreenPlan, isIos, type ScreenEnv, touchOverride } from '../src/platform/fullscreen';

const env = (patch: Partial<ScreenEnv>): ScreenEnv => ({ touch: false, fullscreenApi: false, installed: false, ios: false, ...patch });

describe('fullscreenPlan', () => {
  it('Android phone in the browser: auto full screen and toggle, no hint', () => {
    expect(fullscreenPlan(env({ touch: true, fullscreenApi: true }))).toEqual({ autoOnFirstTap: true, showToggle: true, showInstallHint: false });
  });

  it('iPhone in Safari: only the Add to Home Screen hint', () => {
    expect(fullscreenPlan(env({ touch: true, ios: true }))).toEqual({ autoOnFirstTap: false, showToggle: false, showInstallHint: true });
  });

  it('iPad with the Fullscreen API: toggle and auto full screen, no hint', () => {
    expect(fullscreenPlan(env({ touch: true, ios: true, fullscreenApi: true }))).toEqual({ autoOnFirstTap: true, showToggle: true, showInstallHint: false });
  });

  it('installed app: nothing, it is already full screen', () => {
    expect(fullscreenPlan(env({ touch: true, fullscreenApi: true, installed: true }))).toEqual({ autoOnFirstTap: false, showToggle: false, showInstallHint: false });
    expect(fullscreenPlan(env({ touch: true, ios: true, installed: true }))).toEqual({ autoOnFirstTap: false, showToggle: false, showInstallHint: false });
  });

  it('desktop: unchanged, no automatic full screen', () => {
    expect(fullscreenPlan(env({ fullscreenApi: true }))).toEqual({ autoOnFirstTap: false, showToggle: false, showInstallHint: false });
  });
});

describe('touchOverride', () => {
  it('reads ?touch=1 and ?touch=0', () => {
    expect(touchOverride('?touch=1')).toBe(true);
    expect(touchOverride('?level=x&touch=0')).toBe(false);
    expect(touchOverride('')).toBeNull();
  });
});

describe('isIos', () => {
  it('detects iPhone, iPad and iPadOS', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
  });

  it('does not flag desktop Macs or Android', () => {
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIos('Mozilla/5.0 (Linux; Android 14; Pixel 7)', 5)).toBe(false);
  });
});
