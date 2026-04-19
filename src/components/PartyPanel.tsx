import { useEffect, useState } from 'react';
import { X, Heart, Zap, TrendingUp } from 'lucide-react';
import {
  getSave,
  subscribeSave,
  xpToReachLevel,
  type PartyMember,
} from '../game/ecs/saveState';
import { getSpecies, getMove } from '../game/content/loader';

interface PartyPanelProps {
  open: boolean;
  onClose: () => void;
}

function xpProgress(m: PartyMember): { into: number; span: number; pct: number } {
  const start = xpToReachLevel(m.level);
  const next = xpToReachLevel(m.level + 1);
  const span = Math.max(1, next - start);
  const into = Math.max(0, m.xp - start);
  return { into, span, pct: Math.min(100, (into / span) * 100) };
}

/**
 * Full-screen party roster: each creature in the player's party shown
 * with level, HP bar, XP-to-next-level bar, known moves, and sitelen-pona
 * glyph for its TP name. Invoked from the overworld via the party count
 * button in the HUD or by pressing `P`.
 */
export function PartyPanel({ open, onClose }: PartyPanelProps) {
  const [, tick] = useState(0);
  useEffect(() => subscribeSave(() => tick((n) => n + 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const s = getSave();
  const party = s.party;

  return (
    <div
      className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-amber-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-amber-100 px-4 py-2 flex items-center justify-between border-b-2 border-amber-200 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="font-sitelen text-2xl text-amber-900">jan ale</span>
            <span className="font-display text-sm text-amber-700">— {party.length}/6</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-amber-200 text-amber-900"
            aria-label="Close party panel"
          >
            <X size={20} />
          </button>
        </div>

        {party.length === 0 ? (
          <div className="p-8 text-center text-amber-800 font-display">
            No creatures yet. Visit jan Sewi in ma tomo lili.
          </div>
        ) : (
          <ul className="divide-y divide-amber-200">
            {party.map((m, i) => {
              const species = getSpecies(m.species_id);
              const tpName = species?.name.tp ?? m.species_id;
              const xp = xpProgress(m);
              const hpPct = m.max_hp > 0 ? (m.hp / m.max_hp) * 100 : 0;
              const hpColor =
                hpPct > 50
                  ? 'bg-emerald-500'
                  : hpPct > 25
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
              return (
                <li key={m.instance_id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-3">
                      <span className="font-sitelen text-3xl text-emerald-900">{tpName}</span>
                      <span className="font-display text-xs text-slate-500">
                        {species?.type ?? '?'} · #{i + 1} lead{i === 0 ? '' : ''}
                      </span>
                    </div>
                    <span className="font-display text-sm text-amber-800">
                      <TrendingUp size={12} className="inline mr-1" />
                      Lv {m.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Heart size={12} className="text-rose-500 shrink-0" />
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${hpColor} transition-all`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-slate-600 w-14 text-right">
                      {m.hp} / {m.max_hp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Zap size={12} className="text-sky-500 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all"
                        style={{ width: `${xp.pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-600 w-14 text-right">
                      {xp.into} / {xp.span}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.moves.map((moveId, mi) => {
                      const move = getMove(moveId);
                      const tp = move?.name.tp ?? moveId;
                      const pp = m.pp[mi] ?? 0;
                      const maxPp = move?.pp ?? pp;
                      const depleted = pp === 0;
                      return (
                        <span
                          key={moveId}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-display flex items-center gap-1 ${
                            depleted
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          <span className="font-sitelen text-sm leading-none">{tp}</span>
                          <span className="font-mono">
                            {pp}/{maxPp}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="px-4 py-2 bg-amber-100 text-[10px] text-amber-700 text-center rounded-b-2xl">
          P or Esc to close
        </div>
      </div>
    </div>
  );
}
