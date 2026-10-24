import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chiptune } from '../src/audio/chiptune';

/** Just enough of the Web Audio API to count scheduled notes against a controllable clock. */
class FakeAudioContext {
  currentTime = 0;
  state = 'running';
  destination = {};
  oscillators = 0;
  private node() {
    const param = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
    const node = { gain: param, frequency: param, type: '', connect: () => node, disconnect() {}, start() {}, stop() {} };
    return node;
  }
  createGain() {
    return this.node();
  }
  createOscillator() {
    this.oscillators++;
    return this.node();
  }
  resume() {
    return Promise.resolve();
  }
}

describe('Chiptune scheduling', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('skips missed loops after a throttled background tab instead of playing them all at once', () => {
    let ctx!: FakeAudioContext;
    let tick: () => void = () => {};
    vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} });
    vi.stubGlobal('window', {
      AudioContext: function () {
        ctx = new FakeAudioContext();
        return ctx;
      },
      setInterval: (fn: () => void) => {
        tick = fn;
        return 1;
      },
      clearInterval() {},
    });

    const engine = new Chiptune();
    engine.unlock();
    engine.play('title');
    const firstBatch = ctx.oscillators;
    expect(firstBatch).toBeGreaterThan(0);

    // Desktop browsers may run the timer only once a minute in a hidden tab.
    ctx.currentTime += 60;
    ctx.oscillators = 0;
    tick();
    expect(ctx.oscillators).toBeGreaterThan(0);
    expect(ctx.oscillators).toBeLessThanOrEqual(firstBatch * 2);
  });
});
