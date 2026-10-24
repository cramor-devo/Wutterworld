import { midiToFrequency, parsePattern, SONGS, type SongId } from './music';

export type Sfx = 'jump' | 'pickup' | 'pearl' | 'hit' | 'thread' | 'stomp' | 'shield' | 'clear';

const MUTE_KEY = 'wutter-muted';

function readStoredMute(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Minimal Web Audio chiptune engine: a square-wave lead and a triangle bass,
 * scheduled ahead of time so the loop stays steady. Audio only starts after a user
 * gesture (required by iOS/Safari and Chrome), see `unlock()`.
 */
export class Chiptune {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private songBus: GainNode | null = null;
  private timer: number | null = null;
  private song: SongId | null = null;
  private nextBarTime = 0;
  private hidden = false;
  /** The player's own mute choice, remembered between visits. */
  userMuted = readStoredMute();

  get muted(): boolean {
    return this.userMuted || this.hidden;
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolume(): void {
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.18;
  }

  /** Silences audio while the page is hidden (e.g. phone screen locked). */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.applyVolume();
  }

  toggleMute(): boolean {
    this.userMuted = !this.userMuted;
    try {
      localStorage.setItem(MUTE_KEY, this.userMuted ? '1' : '0');
    } catch {
      // Private browsing may block storage; muting still works for this session.
    }
    this.applyVolume();
    return this.userMuted;
  }

  play(id: SongId): void {
    if (this.song === id) return;
    this.stop();
    this.song = id;
    if (!this.ctx || !this.master) return;
    // Each song gets its own bus so stop() can silence notes that were already scheduled ahead.
    this.songBus = this.ctx.createGain();
    this.songBus.connect(this.master);
    this.nextBarTime = this.ctx.currentTime + 0.05;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 200);
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.song = null;
    this.songBus?.disconnect();
    this.songBus = null;
  }

  /** Called after unlock if a song was requested before audio was allowed. */
  resume(): void {
    const id = this.song;
    if (id && this.timer === null) {
      this.song = null;
      this.play(id);
    }
  }

  private schedule(): void {
    if (!this.ctx || !this.song) return;
    const song = SONGS[this.song];
    const stepDur = 60 / song.bpm / 2;
    const lead = parsePattern(song.lead);
    const bass = parsePattern(song.bass);
    const loopDur = lead.steps * stepDur;
    while (this.nextBarTime < this.ctx.currentTime + 1.0) {
      for (const e of lead.events) this.tone('square', e.midi, this.nextBarTime + e.step * stepDur, e.length * stepDur * 0.9, 0.5);
      for (const e of bass.events) this.tone('triangle', e.midi, this.nextBarTime + e.step * stepDur, e.length * stepDur * 0.95, 0.9);
      this.nextBarTime += loopDur;
    }
  }

  private tone(type: OscillatorType, midi: number, start: number, dur: number, volume: number): void {
    if (!this.ctx || !this.songBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFrequency(midi), start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + Math.max(0.05, dur));
    osc.connect(gain).connect(this.songBus);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  sfx(kind: Sfx): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    const sweep = (from: number, to: number, dur: number, type: OscillatorType = 'square', vol = 0.6) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.master!);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    };
    switch (kind) {
      case 'jump':
        return sweep(300, 600, 0.12);
      case 'pickup':
        return sweep(900, 1400, 0.08, 'square', 0.35);
      case 'pearl':
        return sweep(700, 1800, 0.2, 'triangle', 0.8);
      case 'hit':
        return sweep(400, 80, 0.3, 'sawtooth', 0.5);
      case 'thread':
        return sweep(1200, 300, 0.15, 'triangle', 0.7);
      case 'stomp':
        return sweep(200, 700, 0.1);
      case 'shield':
        return sweep(500, 1500, 0.35, 'triangle', 0.8);
      case 'clear':
        return sweep(523, 1046, 0.6, 'square', 0.4);
    }
  }
}

/** One shared engine for the whole game. */
export const audio = new Chiptune();
