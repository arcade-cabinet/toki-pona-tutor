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
      <div className="flex items-center space-x-3 mb-4 shrink-0">
        <button
          onClick={() => {
            playSfx('untap');
            onBack();
          }}
          className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 transition-colors active:scale-95 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={22} strokeWidth={3} />
        </button>
        <h2 className="text-2xl font-black text-slate-800">Dictionary</h2>
      </div>

      <div className="relative mb-4 shrink-0">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search words or meanings..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-2 border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-5 min-h-0">
        <section className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl">
          <h3 className="font-black text-lg text-blue-800 mb-1">Grammar: Adjectives follow Nouns</h3>
          <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-slate-700 text-sm">
            jan pona = <span className="text-blue-600">person good</span> (friend)
          </div>
        </section>
        <section className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl">
          <h3 className="font-black text-lg text-emerald-800 mb-1">Grammar: "li" verb marker</h3>
          <p className="text-emerald-900 text-sm font-medium mb-2">
            Use <strong>li</strong> before the verb UNLESS the subject is 'mi' or 'sina'.
          </p>
          <ul className="space-y-1">
            <li className="bg-white p-2 rounded-lg shadow-sm font-bold text-slate-700 text-sm">
              mi moku (I eat — no 'li')
            </li>
            <li className="bg-white p-2 rounded-lg shadow-sm font-bold text-slate-700 text-sm">
              soweli <span className="text-emerald-500 font-black">li</span> moku (The animal eats)
            </li>
          </ul>
        </section>
        <section className="bg-purple-50 border-2 border-purple-200 p-4 rounded-2xl">
          <h3 className="font-black text-lg text-purple-800 mb-1">Grammar: "e" object marker</h3>
          <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-slate-700 text-sm">
            mi lukin <span className="text-purple-500 font-black">e</span> kili (I see the fruit)
          </div>
        </section>

        <section>
          <h3 className="font-black text-lg text-slate-700 mb-2 sticky top-0 bg-white py-1">
            Words ({filtered.length})
          </h3>
          <ul className="space-y-2">
            {filtered.map((w) => (
              <li
                key={w.word}
                className="bg-white border-2 border-slate-200 p-3 rounded-xl"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-black text-lg text-slate-800">{w.word}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    {w.usage_category} · {w.book}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-snug">{w.definition}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
