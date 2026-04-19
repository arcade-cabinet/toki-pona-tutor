/**
 * Legacy shim. `village.json` was deleted as part of the declarative
 * content pipeline pivot. The engine will be rewired against
 * `src/content/generated/world.json` in Wave 3 (see docs/STATE.md);
 * until then this module returns empty data so consumers compile.
 */

export type DialogMood = 'happy' | 'sad' | 'thinking' | 'excited';

export interface DialogBeat {
  tp: string;
  en: string;
  /** Optional sitelen-pona glyph to foreground as a grammar lesson. */
  glyph?: string;
}

export interface DialogLine {
  id: string;
  npc: string | null;
  npc_id: string | null;
  quest_stage?: string;
  location_id?: string;
  tp: string;
  en: string;
  mood: DialogMood;
  triggers_quest_accept?: boolean;
  triggers_quest_complete?: boolean;
  triggers_item_pickup?: string;
  triggers_tutorial_complete?: boolean;
  /** Multi-beat sequence — if present, the dialog advances through each
   *  beat in order before closing. The top-level tp/en is used for beat 1
   *  so existing single-beat lines continue to work unchanged. */
  beats?: DialogBeat[];
}

export interface NpcData {
  id: string;
  name_tp: string;
  name_en: string;
  greeting: { tp: string; en: string; mood: DialogMood };
}

const data: { dialog: DialogLine[]; npcs: NpcData[] } = {
  dialog: [],
  npcs: [],
};

export function pickDialogLine(
  npcId: string,
  stage: string,
  opts: { tutorialComplete?: boolean } = {},
): DialogLine | null {
  // Match preferred stage, then 'any', then greeting fallback. jan Sewi has
  // stage-like values 'tutorial' and 'tutorial_done' that gate the diegetic
  // onboarding sequence on the tutorialComplete quest-state flag.
  const resolvedStage =
    npcId === 'jan_sewi'
      ? opts.tutorialComplete
        ? 'tutorial_done'
        : 'tutorial'
      : stage;
  const matching = data.dialog.filter(
    (d) =>
      d.npc_id === npcId &&
      (d.quest_stage === resolvedStage || d.quest_stage === 'any'),
  );
  if (matching.length > 0) return matching[0];

  const npc = data.npcs.find((n) => n.id === npcId);
  if (npc) {
    return {
      id: `${npcId}_greeting`,
      npc: npc.name_tp,
      npc_id: npcId,
      tp: npc.greeting.tp,
      en: npc.greeting.en,
      mood: npc.greeting.mood,
    };
  }
  return null;
}

export function getNpc(npcId: string): NpcData | undefined {
  return data.npcs.find((n) => n.id === npcId);
}
