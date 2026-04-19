import { BookOpen, Play, Music } from 'lucide-react';

interface MenuScreenProps {
  audioEnabled: boolean;
  toneLoaded: boolean;
  onStart: () => void;
  onStudy: () => void;
}

export function MenuScreen({ audioEnabled, toneLoaded, onStart, onStudy }: MenuScreenProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex justify-center space-x-2 text-5xl mb-4 relative">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🧱</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>🧠</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>✨</span>
          {audioEnabled && (
            <Music className="absolute -right-8 -top-4 text-emerald-400 animate-pulse" size={24} />
          )}
        </div>
        <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-none">kama sona</h1>
        <p className="text-lg text-slate-500 font-bold uppercase tracking-widest max-w-xs mx-auto">
          Master the Grammar of Simplicity
        </p>
      </div>

      <div className="flex flex-col w-full max-w-sm space-y-4 mt-8">
        <button
          onClick={onStart}
          disabled={!toneLoaded}
          className="group relative flex items-center justify-center p-4 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl font-bold text-xl border-b-[6px] border-blue-700 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-wait"
        >
          <Play size={28} className="mr-3 fill-white" />
          <span>{toneLoaded ? 'Start Learning' : 'Loading Audio...'}</span>
        </button>

        <button
          onClick={onStudy}
          className="group relative flex items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xl border-b-[6px] border-slate-300 active:border-b-0 active:translate-y-[6px] transition-all"
        >
          <BookOpen size={28} className="mr-3" />
          <span>Dictionary & Rules</span>
        </button>
      </div>
    </div>
  );
}
