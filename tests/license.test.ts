import { describe, expect, it } from 'vitest';
import contentLicense from '../LICENSE-CONTENT.md?raw';
import license from '../LICENSE?raw';

// Lazy globs only list the file names; nothing is loaded.
const repoFiles = Object.keys(import.meta.glob(['../src/**/*', '../public/**/*'])).map((p) => p.replace(/^\.\.\//, ''));

function coveredPaths(): string[] {
  const section = contentLicense.split('## Covered files')[1]?.split('\n## ')[0] ?? '';
  return [...section.matchAll(/^- `([^`]+)`/gm)].map((m) => m[1]);
}

describe('license', () => {
  it('licenses the code under MIT and points to the content license', () => {
    expect(license).toContain('MIT License');
    expect(license).toContain('C Ramos Rodriguez and Devoteam');
    expect(license).toContain('LICENSE-CONTENT.md');
  });

  it('lists only creative-content paths that exist', () => {
    const paths = coveredPaths();
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const exists = path.endsWith('/**')
        ? repoFiles.some((f) => f.startsWith(path.slice(0, -2)))
        : repoFiles.includes(path);
      expect(exists, `${path} is listed in LICENSE-CONTENT.md but does not exist`).toBe(true);
    }
  });

  it('keeps the MIT helpers it names in the art folder', () => {
    expect(repoFiles).toContain('src/art/canvas.ts');
    expect(repoFiles).toContain('src/art/text.ts');
  });
});
