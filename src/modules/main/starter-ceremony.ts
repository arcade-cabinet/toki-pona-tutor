import type { RpgPlayer } from '@rpgjs/server';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { recordMasteredWord, setFlag } from '../../platform/persistence/queries';
import { playDialog } from './dialog';

const STARTERS = [
    { id: 'soweli_seli', label: 'soweli seli' },
    { id: 'soweli_telo', label: 'soweli telo' },
    { id: 'kasi_pona', label: 'kasi pona' },
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

    await preferences.set(KEYS.starterChosen, picked.id);
    await setFlag('starter_chosen', '1');
    for (const word of picked.id.split('_')) {
        await recordMasteredWord(word);
    }
    await recordMasteredWord('poki');

    await player.showNotification(picked.label, { time: 3500 });
}
