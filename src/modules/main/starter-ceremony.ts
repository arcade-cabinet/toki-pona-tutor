import type { RpgPlayer } from '@rpgjs/server';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { recordMasteredWord, setFlag, addToParty, addToInventory } from '../../platform/persistence/queries';
import { playDialog } from './dialog';

const STARTERS = [
    { id: 'kon_moli', label: 'kon moli' },
    { id: 'telo_jaki', label: 'telo jaki' },
    { id: 'jan_ike_lili', label: 'jan ike lili' },
] as const;

export async function runStarterCeremony(player: RpgPlayer): Promise<void> {
    const already = await preferences.get(KEYS.starterChosen);
    if (already) {
        await playDialog(player, 'jan_sewi_after_pick');
        return;
    }

    await playDialog(player, 'jan_sewi_starter_intro');

    const choice = await player.showChoices('?', STARTERS.map((s) => ({
        text: s.label,
        value: s.id,
    })));

    if (!choice) return;
    const picked = STARTERS.find((s) => s.id === choice.value);
    if (!picked) return;

    // Write the completion flag to both stores atomically-ish: preferences is
    // the re-entry guard (read on next onAction), SQLite flag drives the warp
    // gate. Both must agree or the player gets stuck (ceremony skipped, warp
    // closed). If either write throws, the unhandled rejection surfaces to
    // the RPG.js event system and neither side commits.
    await preferences.set(KEYS.starterChosen, picked.id);
    await setFlag('starter_chosen', '1');

    // Grant the chosen creature at level 5 and seed the poki_lili supply
    // (3 nets) per the beat-1 spec in docs/JOURNEY.md / journey.json narrative.
    await addToParty(picked.id, 5);
    await addToInventory('poki_lili', 3);

    for (const word of picked.id.split('_')) {
        await recordMasteredWord(word);
    }
    await recordMasteredWord('poki');

    await player.showNotification(picked.label, { time: 3500 });
}
