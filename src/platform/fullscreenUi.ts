import { detectEnv, fullscreenPlan } from './fullscreen';

export const INSTALL_HINT_KEY = 'wutterworld.installHintClosed';

/** `screen.orientation.lock` is missing from some TypeScript DOM typings. */
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

async function enterFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    // Landscape lock only works while in full screen, and only on some browsers (Android Chrome).
    await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape');
  } catch {
    // Refused (no gesture, unsupported, user setting): the game simply keeps running in the tab.
  }
}

async function exitFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // Already left full screen.
  }
}

function readHintClosed(): boolean {
  try {
    return localStorage.getItem(INSTALL_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Keeps taps on DOM overlays away from the game (which listens on window) and the first-tap handler. */
function shieldFromGame(el: HTMLElement): void {
  for (const evt of ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup']) {
    el.addEventListener(evt, (e) => e.stopPropagation());
  }
}

/**
 * Mobile full screen: the first tap goes full screen in landscape (Android), a small toggle button enters
 * and leaves full screen, and iPhones (no Fullscreen API) get an "Add to Home Screen" hint.
 */
export function setupFullscreen(): void {
  const plan = fullscreenPlan(detectEnv());
  const toggle = document.getElementById('fs-toggle');
  const hint = document.getElementById('install-hint');

  if (plan.autoOnFirstTap) {
    // Only once per visit: if the player leaves full screen, it is not forced on them again.
    const onFirstTap = () => {
      window.removeEventListener('pointerup', onFirstTap);
      window.removeEventListener('touchend', onFirstTap);
      void enterFullscreen();
    };
    window.addEventListener('pointerup', onFirstTap, { passive: true });
    window.addEventListener('touchend', onFirstTap, { passive: true });
  }

  if (toggle && plan.showToggle) {
    const sync = () => toggle.classList.toggle('is-full', !!document.fullscreenElement);
    toggle.hidden = false;
    shieldFromGame(toggle);
    toggle.addEventListener('click', () => {
      if (document.fullscreenElement) void exitFullscreen();
      else void enterFullscreen();
    });
    document.addEventListener('fullscreenchange', sync);
    sync();
  }

  if (hint && plan.showInstallHint && !readHintClosed()) {
    hint.hidden = false;
    shieldFromGame(hint);
    hint.querySelector('button')?.addEventListener('click', () => {
      hint.hidden = true;
      try {
        localStorage.setItem(INSTALL_HINT_KEY, '1');
      } catch {
        // Private mode: the hint just comes back next visit.
      }
    });
  }
}
