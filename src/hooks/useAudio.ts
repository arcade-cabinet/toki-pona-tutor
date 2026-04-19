import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import type { SfxType } from '../types';

declare global {
  interface Window {
    Tone?: any;
  }
}

interface SfxRefs {
  T: any;
  popSynth: any;
  chordSynth: any;
  errorSynth: any;
  starSynth: any;
  masterVol: any;
}

export type BgmTrack = 'menu' | 'lesson' | 'results' | 'gameover';

const AUDIO_BASE = `${import.meta.env.BASE_URL}audio`;
const SFX_BASE = `${import.meta.env.BASE_URL}sfx`;

const BGM_SOURCES: Record<BgmTrack, string[]> = {
  menu: [`${AUDIO_BASE}/bgm-menu-kenney.ogg`, `${AUDIO_BASE}/bgm-menu-kenney.mp3`],
  lesson: [`${AUDIO_BASE}/bgm-lesson-kenney.ogg`, `${AUDIO_BASE}/bgm-lesson-kenney.mp3`],
  results: [`${AUDIO_BASE}/bgm-victory-kenney.ogg`, `${AUDIO_BASE}/bgm-victory-kenney.mp3`],
  gameover: [`${AUDIO_BASE}/bgm-gameover-kenney.ogg`, `${AUDIO_BASE}/bgm-gameover-kenney.mp3`],
};

const SAMPLE_SFX_SOURCES = {
  click: [`${SFX_BASE}/click.ogg`, `${SFX_BASE}/click.mp3`],
  confirm: [`${SFX_BASE}/confirm.ogg`, `${SFX_BASE}/confirm.mp3`],
  error: [`${SFX_BASE}/error.ogg`, `${SFX_BASE}/error.mp3`],
  drop: [`${SFX_BASE}/drop.ogg`, `${SFX_BASE}/drop.mp3`],
} as const;

const BGM_VOLUME = 0.35;
const CROSSFADE_MS = 600;

export function useAudio() {
  const [toneLoaded, setToneLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const sfxRefs = useRef<SfxRefs | null>(null);
  const bgmRefs = useRef<Record<BgmTrack, Howl> | null>(null);
  const sampleSfxRefs = useRef<Record<keyof typeof SAMPLE_SFX_SOURCES, Howl> | null>(null);
  const currentTrack = useRef<BgmTrack | null>(null);

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
    if (!window.Tone || sfxRefs.current) return;
    const T = window.Tone;
    await T.start();

    const compressor = new T.Compressor(-30, 3).toDestination();
    const masterVol = new T.Volume(-6).connect(compressor);
    const reverb = new T.Reverb({ decay: 4, wet: 0.6 }).connect(masterVol);
    const sfxDelay = new T.FeedbackDelay('16n', 0.2).connect(masterVol);

    const popSynth = new T.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
    }).connect(sfxDelay);
    popSynth.volume.value = -6;

    const chordSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.8 },
    }).connect(reverb);
    chordSynth.volume.value = -8;

    const errorSynth = new T.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.3 },
    }).connect(masterVol);
    errorSynth.volume.value = -4;

    const starSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 },
    }).connect(reverb);
    starSynth.volume.value = -5;

    sfxRefs.current = { T, popSynth, chordSynth, errorSynth, starSynth, masterVol };

    const tracks = {} as Record<BgmTrack, Howl>;
    for (const key of Object.keys(BGM_SOURCES) as BgmTrack[]) {
      tracks[key] = new Howl({
        src: BGM_SOURCES[key],
        loop: true,
        volume: 0,
        html5: false,
        preload: true,
      });
    }
    bgmRefs.current = tracks;

    const samples = {} as Record<keyof typeof SAMPLE_SFX_SOURCES, Howl>;
    for (const key of Object.keys(SAMPLE_SFX_SOURCES) as (keyof typeof SAMPLE_SFX_SOURCES)[]) {
      samples[key] = new Howl({
        src: [...SAMPLE_SFX_SOURCES[key]],
        volume: 0.5,
        preload: true,
      });
    }
    sampleSfxRefs.current = samples;

    setAudioEnabled(true);
  }, []);

  const playBgm = useCallback(
    (track: BgmTrack) => {
      if (!bgmRefs.current || !audioEnabled) return;
      if (currentTrack.current === track) return;

      const next = bgmRefs.current[track];
      if (currentTrack.current) {
        const prev = bgmRefs.current[currentTrack.current];
        prev.fade(prev.volume(), 0, CROSSFADE_MS);
        prev.once('fade', () => prev.stop());
      }

      if (!next.playing()) next.play();
      next.fade(0, BGM_VOLUME, CROSSFADE_MS);
      currentTrack.current = track;
    },
    [audioEnabled]
  );

  const toggleAudio = useCallback(() => {
    if (!sfxRefs.current || !bgmRefs.current) return;
    const willEnable = !audioEnabled;
    sfxRefs.current.masterVol.mute = !willEnable;
    for (const howl of Object.values(bgmRefs.current)) {
      howl.mute(!willEnable);
    }
    if (sampleSfxRefs.current) {
      for (const howl of Object.values(sampleSfxRefs.current)) {
        howl.mute(!willEnable);
      }
    }
    setAudioEnabled(willEnable);
  }, [audioEnabled]);

  const playSfx = useCallback(
    (type: SfxType) => {
      if (!audioEnabled || !sfxRefs.current) return;
      const { chordSynth, starSynth, T } = sfxRefs.current;
      const samples = sampleSfxRefs.current;
      const now = T.now();
      switch (type) {
        case 'tap':
          samples?.click.play();
          break;
        case 'untap':
          samples?.drop.play();
          break;
        case 'correct':
          samples?.confirm.play();
          chordSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n', now);
          starSynth.triggerAttackRelease('E6', '16n', now + 0.05);
          starSynth.triggerAttackRelease('G6', '16n', now + 0.1);
          starSynth.triggerAttackRelease('C7', '16n', now + 0.15);
          break;
        case 'wrong':
          samples?.error.play();
          break;
        case 'win':
          chordSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'B4', 'D5'], '1m', now);
          starSynth.triggerAttackRelease(['E6', 'G6', 'C7'], '2n', now + 0.3);
          break;
      }
    },
    [audioEnabled]
  );

  return { toneLoaded, audioEnabled, initAudio, toggleAudio, playSfx, playBgm };
}
