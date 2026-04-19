import { useCallback, useEffect, useRef, useState } from 'react';
import type { SfxType } from '../types';

declare global {
  interface Window {
    Tone?: any;
  }
}

interface AudioRefs {
  T: any;
  popSynth: any;
  chordSynth: any;
  errorSynth: any;
  masterVol: any;
  bgmLoop: any;
  bgmSynth: any;
}

export function useAudio() {
  const [toneLoaded, setToneLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtx = useRef<AudioRefs | null>(null);

  useEffect(() => {
    if (window.Tone) {
      setToneLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    script.onload = () => setToneLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const initAudio = useCallback(async () => {
    if (!window.Tone || audioCtx.current) return;
    const T = window.Tone;
    await T.start();

    const compressor = new T.Compressor(-30, 3).toDestination();
    const masterVol = new T.Volume(-5).connect(compressor);

    const reverb = new T.Reverb({ decay: 6, wet: 0.8 }).connect(masterVol);
    const lowPass = new T.Filter(600, 'lowpass').connect(reverb);

    const bgmSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 2, sustain: 0.8, release: 4 },
    }).connect(lowPass);
    bgmSynth.volume.value = -12;

    const chords = [
      ['C3', 'E3', 'G3', 'C4'],
      ['A2', 'C3', 'E3', 'A3'],
      ['F2', 'A2', 'C3', 'F3'],
      ['G2', 'B2', 'D3', 'G3'],
    ];
    let chordIndex = 0;
    const bgmLoop = new T.Loop((time: number) => {
      bgmSynth.triggerAttackRelease(chords[chordIndex], '1m', time);
      chordIndex = (chordIndex + 1) % chords.length;
    }, '2m');
    T.Transport.bpm.value = 65;

    const sfxDelay = new T.FeedbackDelay('8n', 0.4).connect(masterVol);
    sfxDelay.wet.value = 0.2;

    const popSynth = new T.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
    }).connect(sfxDelay);
    popSynth.volume.value = -8;

    const chordSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.2, release: 1 },
    }).connect(reverb);
    chordSynth.volume.value = -10;

    const errorSynth = new T.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.4, sustain: 0.1, release: 0.5 },
    }).connect(masterVol);
    errorSynth.volume.value = -2;

    audioCtx.current = { T, bgmSynth, bgmLoop, popSynth, chordSynth, errorSynth, masterVol };
    setAudioEnabled(true);
    T.Transport.start();
    bgmLoop.start(0);
  }, []);

  const toggleAudio = useCallback(() => {
    if (!audioCtx.current) return;
    const { masterVol } = audioCtx.current;
    masterVol.mute = audioEnabled;
    setAudioEnabled((prev) => !prev);
  }, [audioEnabled]);

  const playSfx = useCallback(
    (type: SfxType) => {
      if (!audioEnabled || !audioCtx.current) return;
      const { popSynth, chordSynth, errorSynth, T } = audioCtx.current;
      const now = T.now();
      switch (type) {
        case 'tap':
          popSynth.triggerAttackRelease('C5', '32n', now);
          break;
        case 'untap':
          popSynth.triggerAttackRelease('A4', '32n', now);
          break;
        case 'correct':
          chordSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '2n', now);
          break;
        case 'wrong':
          errorSynth.triggerAttackRelease('Eb3', '8n', now);
          errorSynth.triggerAttackRelease('C3', '4n', now + 0.2);
          break;
        case 'win':
          chordSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'B4', 'D5'], '1m', now);
          break;
      }
    },
    [audioEnabled]
  );

  return { toneLoaded, audioEnabled, initAudio, toggleAudio, playSfx };
}
