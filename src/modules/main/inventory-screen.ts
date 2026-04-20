import type { RpgPlayer } from '@rpgjs/server';
import { getFlag, getParty } from '../../platform/persistence/queries';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { PARTY_SIZE_MAX } from '../../platform/persistence/constants';

const BADGE_DEFINITIONS = [
    { flag: 'badge_sewi', label: 'sewi', region: 'nena sewi' },
    { flag: 'badge_telo', label: 'telo', region: 'ma telo' },
    { flag: 'badge_lete', label: 'lete', region: 'ma lete' },
    { flag: 'badge_suli', label: 'suli', region: 'nena suli' },
] as const;

/**
 * Second pause-menu screen — shows the player's progress:
 *   - earned badges (badge_sewi / badge_telo / badge_lete / badge_suli)
 *   - current journey beat pointer
 *   - party roster with level (max 6 slots)
 *
 * Uses plain showText rather than a custom GUI because v5's GUI
 * layer is Vue and the shell stays minimal. Bound to the 'inventory'
 * input action (mapped by the client default controls — falls
 * through if unavailable).
 */
export async function showInventory(player: RpgPlayer): Promise<void> {
    const earned = await Promise.all(
        BADGE_DEFINITIONS.map(async (b) => ({ ...b, held: Boolean(await getFlag(b.flag)) })),
    );
    const held = earned.filter((b) => b.held);
    const party = await getParty();
    const beat = await preferences.get(KEYS.journeyBeat);

    const header = `badges: ${held.length} / ${BADGE_DEFINITIONS.length}`;
    const badgeLines = earned
        .map((b) => `  ${b.held ? '✓' : '·'}  ${b.label}  (${b.region})`)
        .join('\n');
    await player.showText(`${header}\n${badgeLines}`);

    if (beat) {
        await player.showText(`beat: ${beat}`);
    }

    if (party.length === 0) {
        await player.showText('poki: (empty — catch some!)');
        return;
    }

    const partyHeader = `poki: ${party.length} / ${PARTY_SIZE_MAX}`;
    const partyLines = party
        .map((p) => `  ${p.slot + 1}.  ${p.species_id.replace(/_/g, ' ')}  L${p.level}`)
        .join('\n');
    await player.showText(`${partyHeader}\n${partyLines}`);
}
