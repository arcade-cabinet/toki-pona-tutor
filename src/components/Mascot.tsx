import { useEffect, useRef, useState } from 'react';

const MASCOT_SRC = `${import.meta.env.BASE_URL}sprites/mascot.png`;
const EMOTE_BASE = `${import.meta.env.BASE_URL}sprites`;

export type MascotMood = 'idle' | 'correct' | 'wrong' | 'streak' | 'hint' | 'gameover';

const MOOD_EMOTE: Record<MascotMood, string | null> = {
  idle: null,
  correct: `${EMOTE_BASE}/emote-hearts.png`,
  wrong: `${EMOTE_BASE}/emote-sad.png`,
  streak: `${EMOTE_BASE}/emote-stars.png`,
  hint: `${EMOTE_BASE}/emote-idea.png`,
  gameover: `${EMOTE_BASE}/emote-sad.png`,
};

interface MascotProps {
  mood: MascotMood;
  size?: number;
  className?: string;
}

export function Mascot({ mood, size = 72, className = '' }: MascotProps) {
  const [reactKey, setReactKey] = useState(0);
  const [emoteKey, setEmoteKey] = useState(0);
  const prevMood = useRef<MascotMood>(mood);
  const activeEmote = MOOD_EMOTE[mood];

  useEffect(() => {
    if (mood !== prevMood.current) {
      setReactKey((k) => k + 1);
      if (MOOD_EMOTE[mood]) setEmoteKey((k) => k + 1);
      prevMood.current = mood;
    }
  }, [mood]);

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <img
        key={reactKey}
        src={MASCOT_SRC}
        alt="soweli mascot"
        width={size}
        height={size}
        className={`w-full h-full select-none ${
          mood === 'idle' ? 'animate-float-bob' : 'animate-mascot-react'
        } ${mood === 'gameover' ? 'grayscale opacity-70' : ''}`}
        draggable={false}
      />
      {activeEmote && (
        <img
          key={emoteKey}
          src={activeEmote}
          alt=""
          aria-hidden
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-14 h-14 select-none pointer-events-none animate-emote-float"
          draggable={false}
        />
      )}
    </div>
  );
}
