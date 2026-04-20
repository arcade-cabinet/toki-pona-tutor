import type { RpgPlayer } from '@rpgjs/server';
import {
    getSitelenOverlay,
    setSitelenOverlay,
    getTextSpeed,
    setTextSpeed,
    getHighContrast,
    setHighContrast,
    getBgmVolume,
    setBgmVolume,
    getSfxVolume,
    setSfxVolume,
} from '../../platform/persistence/settings';

/**
 * Settings screen — T3-06 + T3-09 partial + BRAND.md §Chrome patterns.
 *
 * Pause-menu overlay reached via the `settings` input action (or from
 * the in-progress T3-09 full pause menu when it lands). Uses the same
 * plain-showText + showChoices pattern as vocabulary-screen.ts and
 * inventory-screen.ts — no Vue GUI dependency, and the brand theme
 * in brand.css already tints these native RPG.js overlays via the
 * @rpgjs/ui-css token overrides.
 *
 * Layout (per BRAND.md §Chrome patterns):
 *   1. Header: current values summary
 *   2. Choice list: `awen` (sitelen overlay) / `wawa` (contrast) /
 *      `kalama` (volumes) / `tenpo` (text speed) / `tawa` (back)
 *
 * Choice labels use single TP dictionary words per BRAND.md §UI
 * principle 5 (TP first, English is a fallback).
 */

export async function showSettings(player: RpgPlayer): Promise<void> {
    const [sitelen, textSpeed, highContrast, bgm, sfx] = await Promise.all([
        getSitelenOverlay(),
        getTextSpeed(),
        getHighContrast(),
        getBgmVolume(),
        getSfxVolume(),
    ]);

    const summary = [
        'nasin:',
        `  sitelen    ${sitelen ? 'lon' : 'ala'}`,
        `  tenpo      ${textSpeed} / sec`,
        `  wawa       ${highContrast ? 'lon' : 'ala'}`,
        `  kalama     bgm ${bgm}   sfx ${sfx}`,
    ].join('\n');

    await player.showText(summary);

    const choice = await player.showChoices('?', [
        { text: `sitelen  ${sitelen ? '[lon]' : '[ala]'}`, value: 'sitelen' },
        { text: `tenpo   ${textSpeed}`, value: 'text_speed' },
        { text: `wawa    ${highContrast ? '[lon]' : '[ala]'}`, value: 'contrast' },
        { text: `kalama bgm ${bgm}`, value: 'bgm' },
        { text: `kalama sfx ${sfx}`, value: 'sfx' },
        { text: 'tawa', value: 'cancel' },
    ]);
    if (!choice) return;

    switch (choice.value) {
        case 'sitelen':
            await setSitelenOverlay(!sitelen);
            break;
        case 'contrast':
            await setHighContrast(!highContrast);
            break;
        case 'text_speed':
            await cycleTextSpeed(player, textSpeed);
            break;
        case 'bgm':
            await cycleVolume(player, 'bgm', bgm);
            break;
        case 'sfx':
            await cycleVolume(player, 'sfx', sfx);
            break;
        case 'cancel':
            return;
    }

    // Re-render so the player sees the change immediately.
    await showSettings(player);
}

async function cycleTextSpeed(player: RpgPlayer, current: number): Promise<void> {
    // Four presets: 0 (instant) / 24 (slow) / 48 (default) / 96 (fast).
    const presets = [0, 24, 48, 96];
    const next = presets[(presets.indexOf(current) + 1) % presets.length] ?? 48;
    await setTextSpeed(next);
    await player.showText(`tenpo · ${next === 0 ? 'wawa' : next + ' / sec'}`);
}

async function cycleVolume(player: RpgPlayer, bus: 'bgm' | 'sfx', current: number): Promise<void> {
    // Four presets: 0 (mute) / 30 / 60 / 100.
    const presets = [0, 30, 60, 100];
    const next = presets[(presets.indexOf(current) + 1) % presets.length] ?? 70;
    if (bus === 'bgm') await setBgmVolume(next);
    else await setSfxVolume(next);
    await player.showText(`kalama ${bus} · ${next === 0 ? 'ala' : next}`);
}
