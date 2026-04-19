import villageData from '../content/village.json';

export type DialogMood = 'happy' | 'sad' | 'thinking' | 'excited';

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
}

export interface NpcData {
  id: string;
  name_tp: string;
  name_en: string;
  greeting: { tp: string; en: string; mood: DialogMood };
}

const data = villageData as unknown as {
  dialog: DialogLine[];
  npcs: NpcData[];
};

export function pickDialogLine(npcId: string, stage: string): DialogLine | null {
  // Match preferred stage, then 'any', then greeting fallback.
  const matching = data.dialog.filter(
    (d) => d.npc_id === npcId && (d.quest_stage === stage || d.quest_stage === 'any')
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
