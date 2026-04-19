import { useEffect, useRef } from 'react';
import { gameBus } from '../game/GameBus';

/**
 * Small, self-contained audio layer that listens for adventure bus events
 * and plays a matching sound using the Web Audio API directly (avoids
 * dragging the full Tone.js chain in). Sounds are short procedural
 * envelopes — no external assets.
 *
 * Event → sound:
 *   combat:enter   → descending minor triad (tension)
 *   combat:victory → major arpeggio + shimmer
 *   combat:defeat  → soft downward sweep
 *   dialog:open    → tiny wood-block knock
 *   word:learned   → chime + confetti-esque two-note flourish
 *   toast:show kind=celebration → same as word:learned
 */
export function AdventureAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = (): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current;
    try {
      const AC = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    } catch {
      return null;
    }
    return ctxRef.current;
  };

  const tone = (
    ctx: AudioContext,
    freq: number,
    startOffset: number,
    durSec: number,
    opts: { volume?: number; type?: OscillatorType } = {},
  ) => {
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const vol = opts.volume ?? 0.25;
    const start = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durSec);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durSec + 0.05);
  };

  const noise = (ctx: AudioContext, startOffset: number, durSec: number, vol = 0.2) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * durSec, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.8;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    const gain = ctx.createGain();
    const start = ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durSec);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(start);
    src.stop(start + durSec + 0.05);
  };

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      gameBus.on('combat:enter', () => {
        const ctx = ensureCtx();
        if (!ctx) return;
        // descending minor triad — tension
        tone(ctx, 523.25, 0, 0.12, { volume: 0.25 }); // C5
        tone(ctx, 415.3, 0.08, 0.14, { volume: 0.25 }); // G#4
        tone(ctx, 329.63, 0.18, 0.2, { volume: 0.28 }); // E4
      }),
    );

    unsubs.push(
      gameBus.on('combat:victory', () => {
        const ctx = ensureCtx();
        if (!ctx) return;
        // C major arpeggio + shimmer
        tone(ctx, 523.25, 0, 0.15, { volume: 0.28 }); // C5
        tone(ctx, 659.25, 0.1, 0.15, { volume: 0.28 }); // E5
        tone(ctx, 783.99, 0.2, 0.18, { volume: 0.3 }); // G5
        tone(ctx, 1046.5, 0.3, 0.45, { volume: 0.3, type: 'sine' }); // C6
        noise(ctx, 0, 0.06, 0.08);
      }),
    );

    unsubs.push(
      gameBus.on('combat:defeat', () => {
        const ctx = ensureCtx();
        if (!ctx) return;
        tone(ctx, 329.63, 0, 0.2, { volume: 0.25, type: 'sawtooth' });
        tone(ctx, 246.94, 0.15, 0.3, { volume: 0.22, type: 'sawtooth' });
      }),
    );

    unsubs.push(
      gameBus.on('dialog:open', () => {
        const ctx = ensureCtx();
        if (!ctx) return;
        // quick wood-block-y tick
        tone(ctx, 800, 0, 0.04, { volume: 0.12, type: 'square' });
      }),
    );

    unsubs.push(
      gameBus.on('word:learned', () => {
        const ctx = ensureCtx();
        if (!ctx) return;
        tone(ctx, 783.99, 0, 0.12, { volume: 0.25, type: 'sine' });
        tone(ctx, 987.77, 0.1, 0.18, { volume: 0.28, type: 'sine' });
      }),
    );

    unsubs.push(
      gameBus.on('toast:show', (t) => {
        if (t.kind !== 'celebration') return;
        const ctx = ensureCtx();
        if (!ctx) return;
        tone(ctx, 659.25, 0, 0.08, { volume: 0.2, type: 'sine' });
        tone(ctx, 783.99, 0.08, 0.1, { volume: 0.2, type: 'sine' });
        tone(ctx, 1046.5, 0.18, 0.2, { volume: 0.22, type: 'sine' });
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, []);

  return null;
}
