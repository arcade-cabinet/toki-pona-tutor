import { BookOpen, Play, Music } from 'lucide-react';
import { Mascot } from './Mascot';

interface MenuScreenProps {
  audioEnabled: boolean;
  toneLoaded: boolean;
  onStart: () => void;
  onStudy: () => void;
}

export function MenuScreen({ audioEnabled, toneLoaded, onStart, onStudy }: MenuScreenProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center space-y-6 animate-in fade-in duration-500 relative">
      {audioEnabled && (
        <div className="absolute top-0 right-0 text-pink-500 animate-pulse">
          <Music size={22} />
        </div>
      )}

      <div className="relative">
        <Mascot mood="idle" size={120} />
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-6xl text-white drop-shadow-[0_4px_0_rgba(234,88,12,0.9)] tracking-tight leading-none">
          kama sona
        </h1>
        <p className="font-pixel text-xs text-white/90 uppercase tracking-[0.3em]">
          Learn Toki Pona · Level Up · pona mute
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm space-y-3 mt-4">
        <button
          onClick={onStart}
          disabled={!toneLoaded}
          className="group relative flex items-center justify-center p-4 bg-gradient-to-b from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white rounded-2xl font-display text-2xl border-b-[6px] border-pink-800 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-60 disabled:cursor-wait shadow-lg"
        >
          <Play size={26} className="mr-3 fill-white" />
          <span>{toneLoaded ? 'PLAY' : 'Loading…'}</span>
        </button>

        <button
          onClick={onStudy}
          className="group relative flex items-center justify-center p-3 bg-white/90 hover:bg-white text-orange-700 rounded-2xl font-display text-lg border-b-[5px] border-orange-300 active:border-b-0 active:translate-y-[5px] transition-all shadow-md"
        >
          <BookOpen size={22} className="mr-2" />
          <span>Dictionary</span>
        </button>
      </div>

      <div className="font-pixel text-[10px] text-white/70 uppercase tracking-widest absolute bottom-0">
        jan pona · made with aloha
      </div>
    </div>
  );
}
