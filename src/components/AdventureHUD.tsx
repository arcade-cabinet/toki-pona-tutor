import { useEffect, useState } from 'react';
import { Scroll, Heart } from 'lucide-react';
import { getQuestState, subscribeQuest } from '../game/ecs/questState';

const STAGE_DESCRIPTION: Record<string, string> = {
  not_started: 'Find jan Pona in the village',
  accepted: 'Find a kili in the mushroom garden',
  item_found: 'Bring the kili back to jan Pona',
  complete: 'pona mute — quest complete!',
};

export function AdventureHUD() {
  const [, tick] = useState(0);
  useEffect(() => subscribeQuest(() => tick((n) => n + 1)), []);

  const s = getQuestState();
  const objective = STAGE_DESCRIPTION[s.hungryFriend];
  const masteredCount = s.masteredWords.length;

  return (
    <div className="absolute top-3 left-14 right-3 z-20 flex items-start gap-2 pointer-events-none">
      <div className="bg-amber-50/95 backdrop-blur rounded-xl shadow-md px-3 py-1.5 flex items-center gap-2 pointer-events-auto max-w-[420px]">
        <Scroll size={14} className="text-orange-700 shrink-0" />
        <div className="font-tile text-[11px] text-amber-900 leading-tight">
          {objective}
        </div>
      </div>
      <div className="flex-1" />
      <div className="bg-white/90 backdrop-blur rounded-xl shadow-md px-2 py-1 flex items-center gap-1 pointer-events-auto">
        <Heart size={12} className="text-pink-500 fill-pink-400 shrink-0" />
        <span className="font-display text-xs text-slate-700">{masteredCount}</span>
      </div>
    </div>
  );
}
