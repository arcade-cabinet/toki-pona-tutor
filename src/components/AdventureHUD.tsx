import { useEffect, useState } from 'react';
import { Scroll, Heart, Users, Award, RefreshCw } from 'lucide-react';
import { getSave, subscribeSave, resetSave } from '../game/ecs/saveState';
import { getRegion } from '../game/content/loader';

/**
 * Top-of-viewport HUD for the overworld: current region name, party
 * summary, badge count, mastered-words count. Replaces the old
 * hungry-friend-specific HUD with a generic party-oriented display.
 */
export function AdventureHUD() {
  const [, tick] = useState(0);
  useEffect(() => subscribeSave(() => tick((n) => n + 1)), []);

  const s = getSave();
  const region = s.current_region_id ? getRegion(s.current_region_id) : null;
  const regionLabel = region?.name_en ?? 'somewhere';
  const partyCount = s.party.length;
  const badgeCount = s.badges.length;
  const masteredCount = s.mastered_words.length;

  return (
    <div className="absolute top-3 left-14 right-3 z-20 flex items-start gap-2 pointer-events-none">
      <div className="bg-amber-50/95 backdrop-blur rounded-xl shadow-md px-3 py-1.5 flex items-center gap-2 pointer-events-auto max-w-[320px]">
        <Scroll size={14} className="text-orange-700 shrink-0" />
        <div className="font-tile text-[11px] text-amber-900 leading-tight truncate">
          {region ? region.name_tp : regionLabel}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!window.confirm('Reset save and start over?')) return;
          resetSave();
          window.location.reload();
        }}
        aria-label="New game"
        className="hidden sm:flex bg-amber-50/95 backdrop-blur rounded-xl shadow-md px-2 py-1 items-center gap-1 text-amber-700 hover:text-amber-900 pointer-events-auto"
      >
        <RefreshCw size={12} />
      </button>

      <div className="flex-1" />

      <div className="bg-white/90 backdrop-blur rounded-xl shadow-md px-2 py-1 flex items-center gap-1 pointer-events-auto">
        <Users size={12} className="text-emerald-600 shrink-0" />
        <span className="font-display text-xs text-slate-700">{partyCount}/6</span>
      </div>
      <div className="bg-white/90 backdrop-blur rounded-xl shadow-md px-2 py-1 flex items-center gap-1 pointer-events-auto">
        <Award size={12} className="text-amber-500 shrink-0" />
        <span className="font-display text-xs text-slate-700">{badgeCount}</span>
      </div>
      <div className="bg-white/90 backdrop-blur rounded-xl shadow-md px-2 py-1 flex items-center gap-1 pointer-events-auto">
        <Heart size={12} className="text-pink-500 fill-pink-400 shrink-0" />
        <span className="font-display text-xs text-slate-700">{masteredCount}</span>
      </div>
    </div>
  );
}
