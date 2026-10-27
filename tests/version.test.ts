import { describe, expect, it } from 'vitest';
// Imported as text: importing TitleScene itself would pull in Phaser, which needs a browser.
import packageJson from '../package.json?raw';
import titleSource from '../src/scenes/TitleScene.ts?raw';

describe('version', () => {
  it('shows the package.json version on the title screen', () => {
    const { version } = JSON.parse(packageJson) as { version: string };
    const match = /APP_VERSION = '([^']+)'/.exec(titleSource);
    expect(match?.[1]).toBe(version);
    expect(version).toBe('1.0.0');
  });
});
