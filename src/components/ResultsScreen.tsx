import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import type { SfxType } from '../types';
import { HeartDisplay } from './HeartDisplay';

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
    ? 'Give it another go!'
    : stars === 3
    ? 'pona mute a! Perfect run!'
    : stars === 2
    ? 'Great work!'
    : 'Nice effort!';
  const subtitle = gameOver
    ? 'Every attempt builds the path to sona.'
    : stars === 3
    ? "You're mastering Toki Pona grammar."
    : stars === 2
    ? 'Just a few stumbles — keep going!'
    : 'Practice makes pona.';
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (stars >= 2) {
      fired.current = true;
      const burst = (x: number) =>
        confetti({
          particleCount: 100,
          spread: 80,
          startVelocity: 40,
          origin: { x, y: 0.5 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
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
          audioEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
        }`}
        aria-label="Toggle audio"
      >
        {audioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
      </button>

      {/* Stars */}
      <div className="flex gap-2 mb-5">
        {[0, 1, 2].map((i) => {
          const earned = i < stars;
          return (
            <Star
              key={i}
              size={64}
              strokeWidth={2}
              className={`transition-all duration-700 ${
                earned ? 'text-amber-400 fill-amber-400 drop-shadow-md' : 'text-slate-300 fill-slate-200'
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

      <div className="space-y-2 mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{title}</h2>
        <p className="text-sm text-slate-600 font-medium">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
        <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-0.5">
            Score
          </div>
          <div className="text-2xl font-black text-blue-700">
            {score}<span className="text-sm text-blue-400">/{total}</span>
          </div>
          <div className="text-xs text-blue-500 font-bold">{percent}%</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">
            Level
          </div>
          <div className="text-2xl font-black text-amber-600">{level}</div>
          <div className="text-xs text-amber-500 font-bold">{streak > 0 ? `🔥 ${streak} best streak` : 'No streak yet'}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-bold text-slate-500 uppercase">Hearts left</span>
        <HeartDisplay hearts={hearts} max={maxHearts} />
      </div>

      <div className="flex flex-col w-full max-w-xs space-y-3">
        <button
          onClick={onRestart}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white p-3 rounded-2xl text-base font-black border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <RotateCcw size={20} strokeWidth={3} />
          <span>Play Again</span>
        </button>
        <button
          onClick={() => {
            playSfx('tap');
            onMenu();
          }}
          className="flex items-center justify-center space-x-2 bg-slate-200 hover:bg-slate-300 text-slate-700 p-3 rounded-2xl text-base font-black border-b-[6px] border-slate-400 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <span>Main Menu</span>
        </button>
      </div>
    </div>
  );
}
