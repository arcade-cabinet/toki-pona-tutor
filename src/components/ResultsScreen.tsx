import { RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { SfxType } from '../types';

interface ResultsScreenProps {
  score: number;
  total: number;
  streak: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onRestart: () => void;
  onMenu: () => void;
  playSfx: (type: SfxType) => void;
}

export function ResultsScreen({
  score,
  total,
  streak,
  audioEnabled,
  onToggleAudio,
  onRestart,
  onMenu,
  playSfx,
}: ResultsScreenProps) {
  const percent = Math.round((score / total) * 100);
  const message =
    percent === 100 ? 'Perfect! pona mute!' : percent >= 80 ? 'Great work!' : percent >= 50 ? 'Nice try!' : 'Keep practicing.';

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

      <div className="bg-amber-100 p-6 rounded-full mb-5 animate-pulse">
        <Sparkles size={56} className="text-amber-500" />
      </div>

      <div className="space-y-3 mb-8">
        <h2 className="text-3xl font-black text-slate-800">Lesson Complete!</h2>
        <p className="text-lg text-slate-600 font-medium">{message}</p>
        <div className="flex flex-col items-center gap-2">
          <div className="text-xl font-bold text-blue-600 bg-blue-50 px-5 py-2 rounded-2xl border-2 border-blue-100">
            Score: {score} / {total}
          </div>
          {streak > 0 && (
            <div className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-1.5 rounded-xl border-2 border-orange-100">
              🔥 Best streak: {streak}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full max-w-xs space-y-3">
        <button
          onClick={onRestart}
          className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-2xl text-lg font-black border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <RotateCcw size={22} strokeWidth={3} />
          <span>Practice Again</span>
        </button>
        <button
          onClick={() => {
            playSfx('tap');
            onMenu();
          }}
          className="flex items-center justify-center space-x-2 bg-slate-200 hover:bg-slate-300 text-slate-700 p-3 rounded-2xl text-lg font-black border-b-[6px] border-slate-400 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <span>Main Menu</span>
        </button>
      </div>
    </div>
  );
}
