import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import type { SfxType } from '../types';
import { HeartDisplay } from './HeartDisplay';
import { Mascot } from './Mascot';

interface ResultsScreenProps {
  score: number;
  total: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  level: number;
  xp: number;
  gameOver: boolean;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onRestart: () => void;
  onMenu: () => void;
  playSfx: (type: SfxType) => void;
}

function computeStars(hearts: number, maxHearts: number, gameOver: boolean): number {
  if (gameOver) return 0;
  if (hearts === maxHearts) return 3;
  if (hearts >= 2) return 2;
  return 1;
}

export function ResultsScreen({
  score,
  total,
  streak,
  hearts,
  maxHearts,
  level,
  gameOver,
  audioEnabled,
  onToggleAudio,
  onRestart,
  onMenu,
  playSfx,
}: ResultsScreenProps) {
  const stars = computeStars(hearts, maxHearts, gameOver);
  const percent = Math.round((score / total) * 100);
  const title = gameOver
    ? 'Shake it off!'
    : stars === 3
    ? 'PONA MUTE!'
    : stars === 2
    ? 'NICE RUN!'
    : 'GOOD GO!';
  const subtitle = gameOver
    ? 'Hop back in — every try levels you up.'
    : stars === 3
    ? 'Perfect — you crushed it.'
    : stars === 2
    ? 'Few stumbles — you got this.'
    : 'Practice makes pona.';
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (stars >= 2) {
      fired.current = true;
      const burst = (x: number) =>
        confetti({
          particleCount: 120,
          spread: 90,
          startVelocity: 45,
          origin: { x, y: 0.5 },
          colors: ['#ff6b6b', '#feb47b', '#ffd26f', '#84fab0', '#ec4899'],
        });
      burst(0.2);
      setTimeout(() => burst(0.8), 200);
      if (stars === 3) setTimeout(() => burst(0.5), 400);
    }
  }, [stars]);

  return (
    <div className="flex flex-col h-full items-center justify-center text-center animate-in zoom-in-95 duration-500 relative">
      <button
        onClick={onToggleAudio}
        className={`absolute top-0 right-0 p-2 rounded-xl transition-colors ${
          audioEnabled ? 'bg-white/90 text-pink-600' : 'bg-white/40 text-white'
        }`}
        aria-label="Toggle audio"
      >
        {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      <div className="mb-2">
        <Mascot mood={gameOver ? 'gameover' : stars === 3 ? 'streak' : 'correct'} size={90} />
      </div>

      {/* Stars */}
      <div className="flex gap-2 mb-3">
        {[0, 1, 2].map((i) => {
          const earned = i < stars;
          return (
            <Star
              key={i}
              size={58}
              strokeWidth={2}
              className={`transition-all duration-700 ${
                earned
                  ? 'text-yellow-300 fill-yellow-300 drop-shadow-[0_2px_0_rgba(234,88,12,0.8)]'
                  : 'text-white/30 fill-white/20'
              }`}
              style={{
                animationDelay: `${i * 200}ms`,
                animation: earned ? 'starPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' : undefined,
                animationFillMode: 'both',
              }}
            />
          );
        })}
      </div>

      <div className="space-y-1 mb-5">
        <h2 className="font-display text-4xl text-white drop-shadow-[0_3px_0_rgba(234,88,12,0.85)]">
          {title}
        </h2>
        <p className="text-sm text-white/90 font-medium">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-5">
        <div className="bg-white rounded-2xl p-3 shadow-lg border-b-4 border-orange-300">
          <div className="font-display text-[10px] uppercase tracking-widest text-orange-500 mb-0.5">
            Score
          </div>
          <div className="font-display text-3xl text-pink-600">
            {score}
            <span className="text-sm text-orange-400">/{total}</span>
          </div>
          <div className="font-pixel text-xs text-orange-600">{percent}%</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-lg border-b-4 border-yellow-300">
          <div className="font-display text-[10px] uppercase tracking-widest text-yellow-600 mb-0.5">
            Level
          </div>
          <div className="font-display text-3xl text-orange-600">{level}</div>
          <div className="font-pixel text-xs text-orange-500">
            {streak > 0 ? `🔥 ${streak} streak` : 'No streak'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="font-pixel text-[10px] text-white/90 uppercase">Hearts</span>
        <HeartDisplay hearts={hearts} max={maxHearts} />
      </div>

      <div className="flex flex-col w-full max-w-xs space-y-3">
        <button
          onClick={onRestart}
          className="flex items-center justify-center space-x-2 bg-gradient-to-b from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-white p-3 rounded-2xl font-display text-lg border-b-[6px] border-green-700 active:border-b-0 active:translate-y-[6px] transition-all shadow-lg"
        >
          <RotateCcw size={20} strokeWidth={3} />
          <span>PLAY AGAIN</span>
        </button>
        <button
          onClick={() => {
            playSfx('tap');
            onMenu();
          }}
          className="flex items-center justify-center bg-white/90 hover:bg-white text-orange-700 p-2.5 rounded-2xl font-display text-base border-b-[5px] border-orange-300 active:border-b-0 active:translate-y-[5px] transition-all shadow-md"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
