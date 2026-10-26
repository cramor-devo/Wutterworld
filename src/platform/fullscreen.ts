/** What the browser offers, as far as full screen is concerned. */
export interface ScreenEnv {
  /** Touch device, or forced with ?touch=1 / ?touch=0. */
  touch: boolean;
  /** The Fullscreen API can be used for the page (not on iPhone Safari). */
  fullscreenApi: boolean;
  /** Running as an installed app ("Add to Home Screen"), which is already full screen. */
  installed: boolean;
  /** iPhone, iPod or iPad. */
  ios: boolean;
}

export interface FullscreenPlan {
  /** Enter full screen (and lock landscape) on the first tap. */
  autoOnFirstTap: boolean;
  /** Show the small full-screen toggle button. */
  showToggle: boolean;
  /** Show the "Add to Home Screen" hint (iPhone). */
  showInstallHint: boolean;
}

/** Decides which full-screen helpers to use. Desktop gets none, so it behaves as before. */
export function fullscreenPlan(env: ScreenEnv): FullscreenPlan {
  const canGoFull = env.touch && env.fullscreenApi && !env.installed;
  return {
    autoOnFirstTap: canGoFull,
    showToggle: canGoFull,
    showInstallHint: env.ios && !env.fullscreenApi && !env.installed,
  };
}

/** ?touch=1 forces touch on, ?touch=0 forces it off; otherwise null. */
export function touchOverride(search: string): boolean | null {
  const forced = new URLSearchParams(search).get('touch');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return null;
}

/** iPhone/iPod/iPad, including iPadOS which reports itself as a Mac with touch. */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/** Reads the current browser environment. */
export function detectEnv(): ScreenEnv {
  const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const installed =
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    touch: touchOverride(window.location.search) ?? touchDevice,
    fullscreenApi: !!document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function',
    installed,
    ios: isIos(navigator.userAgent, navigator.maxTouchPoints),
  };
}
