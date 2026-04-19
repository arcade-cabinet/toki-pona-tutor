import { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { dictionary } from '../lib/challenges';
import type { SfxType } from '../types';

interface DictionaryScreenProps {
  onBack: () => void;
  playSfx: (type: SfxType) => void;
}

export function DictionaryScreen({ onBack, playSfx }: DictionaryScreenProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dictionary;
    return dictionary.filter(
      (w) => w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 min-h-0">
      <div className="flex items-center space-x-3 mb-3 shrink-0">
        <button
          onClick={() => {
            playSfx('untap');
            onBack();
          }}
          className="p-2 bg-white/90 hover:bg-white rounded-xl text-orange-700 transition-colors active:scale-95 shrink-0 shadow-md"
          aria-label="Back"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h2 className="font-display text-2xl text-white drop-shadow-[0_2px_0_rgba(234,88,12,0.85)]">
          DICTIONARY
        </h2>
      </div>

      <div className="relative mb-3 shrink-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words..."
          className="w-full pl-9 pr-3 py-2 bg-white border-b-4 border-orange-300 rounded-xl font-tile text-slate-800 placeholder:text-orange-300 focus:outline-none focus:border-pink-400 shadow-md"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-3 min-h-0">
        <section className="bg-white rounded-2xl p-3 border-b-4 border-pink-300 shadow-md">
          <h3 className="font-display text-sm text-pink-600 mb-1">ADJ FOLLOWS NOUN</h3>
          <div className="bg-pink-50 p-2 rounded-lg font-tile text-sm text-slate-700">
            jan pona = <span className="text-pink-600 font-bold">person good</span> (friend)
          </div>
        </section>
        <section className="bg-white rounded-2xl p-3 border-b-4 border-lime-300 shadow-md">
          <h3 className="font-display text-sm text-lime-600 mb-1">"LI" MARKER</h3>
          <p className="text-xs text-slate-600 mb-2">
            Use <strong>li</strong> before the verb UNLESS subject is mi or sina.
          </p>
          <div className="space-y-1">
            <div className="bg-lime-50 p-2 rounded-lg font-tile text-sm text-slate-700">
              mi moku <span className="text-lime-600">(no li)</span>
            </div>
            <div className="bg-lime-50 p-2 rounded-lg font-tile text-sm text-slate-700">
              soweli <span className="text-lime-600 font-bold">li</span> moku
            </div>
          </div>
        </section>
        <section className="bg-white rounded-2xl p-3 border-b-4 border-orange-300 shadow-md">
          <h3 className="font-display text-sm text-orange-600 mb-1">"E" OBJECT MARKER</h3>
          <div className="bg-orange-50 p-2 rounded-lg font-tile text-sm text-slate-700">
            mi lukin <span className="text-orange-600 font-bold">e</span> kili
          </div>
        </section>

        <section>
          <h3 className="font-display text-base text-white uppercase tracking-wide mb-2 mt-3">
            Words ({filtered.length})
          </h3>
          <ul className="space-y-2">
            {filtered.map((w) => (
              <li
                key={w.word}
                className="bg-white rounded-xl p-2.5 shadow-sm border-l-4 border-pink-400"
              >
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="font-tile text-base text-slate-800">{w.word}</span>
                  <span className="font-pixel text-[9px] uppercase tracking-wider text-orange-400">
                    {w.usage_category} · {w.book}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{w.definition}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
