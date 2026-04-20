/**
 * Effect spritesheet registrations.
 *
 * Every VFX sheet under public/assets/effects/ is registered here.
 * Frame dimensions and animation strips are hand-curated — see
 * docs/EFFECT_SPRITES.md for the full per-sheet analysis.
 *
 * Move-binding recommendations live in docs/EFFECT_SPRITES.md.
 * Do NOT add vfx fields to moves/*.json until the engine wires VFX
 * (that is a follow-up task).
 */

/** A single registered effect spritesheet entry. */
interface EffectSheet {
    id: string;
    image: string;
    framesWidth: number;
    framesHeight: number;
    animations: Record<string, { frames: number[]; duration: number }>;
}

// ---------------------------------------------------------------------------
// Root effects
// ---------------------------------------------------------------------------

/** fx_feather_drift — feather.png — 64×16, 16×16px, 4 frames, 1 row */
const fxFeatherDrift: EffectSheet = {
    id: 'fx_feather_drift',
    image: 'assets/effects/feather.png',
    framesWidth: 4,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3], duration: 280 }, // 14 fps → ~71ms/frame × 4
    },
};

/** fx_gas_cloud — gas.png — 64×224, 64×32px, 7 frames, 1 column */
const fxGasCloud: EffectSheet = {
    id: 'fx_gas_cloud',
    image: 'assets/effects/gas.png',
    framesWidth: 1,
    framesHeight: 7,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6], duration: 875 }, // 8 fps → 125ms/frame × 7
    },
};

/** fx_dirt_kickup — dirt.png — 96×32, 32×32px, 3 frames, 1 row */
const fxDirtKickup: EffectSheet = {
    id: 'fx_dirt_kickup',
    image: 'assets/effects/dirt.png',
    framesWidth: 3,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2], duration: 250 }, // 12 fps → ~83ms/frame × 3
    },
};

// ---------------------------------------------------------------------------
// magical/ — elemental orb sets
// ---------------------------------------------------------------------------

/**
 * fx_spell_orbs_v1 — elemental-spellcasting-effects-v1-anti-alias-glow-8x8.png
 * 32×208, 8×8px, 4 cols × 26 rows. Named strips for rows 0–6.
 * Remaining rows (7–25) use row_N naming if needed later.
 */
const fxSpellOrbsV1: EffectSheet = {
    id: 'fx_spell_orbs_v1',
    image: 'assets/effects/magical/elemental-spellcasting-effects-v1-anti-alias-glow-8x8.png',
    framesWidth: 4,
    framesHeight: 26,
    animations: {
        // row 0: blue water orbs (frames 0–3)
        water_orb: { frames: [0, 1, 2, 3], duration: 240 },
        // row 1: pink/magenta orbs (frames 4–7)
        pink_orb: { frames: [4, 5, 6, 7], duration: 240 },
        // row 2: orange fire orbs (frames 8–11)
        fire_orb: { frames: [8, 9, 10, 11], duration: 240 },
        // row 3: wind swirls (frames 12–15)
        wind_swirl: { frames: [12, 13, 14, 15], duration: 240 },
        // row 4: white/grey cloud wisps (frames 16–19)
        cloud_wisp: { frames: [16, 17, 18, 19], duration: 240 },
        // row 5: ice/pale-blue crystals (frames 20–23)
        ice_shard: { frames: [20, 21, 22, 23], duration: 240 },
        // row 6: green leaf/poison orbs (frames 24–27)
        poison_orb: { frames: [24, 25, 26, 27], duration: 240 },
        // default fallback — water orb
        default: { frames: [0, 1, 2, 3], duration: 240 },
    },
};

/**
 * fx_spell_orbs_v2 — elemental-spellcasting-effects-v2-8x8.png
 * 32×208, 8×8px, 4 cols × 26 rows. Stylistic v2 of the same orb set.
 * Used for stronger-tier wawa-suffix moves.
 */
const fxSpellOrbsV2: EffectSheet = {
    id: 'fx_spell_orbs_v2',
    image: 'assets/effects/magical/elemental-spellcasting-effects-v2-8x8.png',
    framesWidth: 4,
    framesHeight: 26,
    animations: {
        water_orb: { frames: [0, 1, 2, 3], duration: 240 },
        pink_orb: { frames: [4, 5, 6, 7], duration: 240 },
        fire_orb: { frames: [8, 9, 10, 11], duration: 240 },
        wind_swirl: { frames: [12, 13, 14, 15], duration: 240 },
        cloud_wisp: { frames: [16, 17, 18, 19], duration: 240 },
        ice_shard: { frames: [20, 21, 22, 23], duration: 240 },
        poison_orb: { frames: [24, 25, 26, 27], duration: 240 },
        default: { frames: [0, 1, 2, 3], duration: 240 },
    },
};

/**
 * fx_spell_bursts_14 — extra-elemental-spellcasting-effects-14x14.png
 * 56×126, 14×14px, 4 cols × 9 rows. Elemental burst impacts.
 */
const fxSpellBursts14: EffectSheet = {
    id: 'fx_spell_bursts_14',
    image: 'assets/effects/magical/extra-elemental-spellcasting-effects-14x14.png',
    framesWidth: 4,
    framesHeight: 9,
    animations: {
        fire_burst:   { frames: [0, 1, 2, 3], duration: 240 },    // row 0
        dark_burst:   { frames: [4, 5, 6, 7], duration: 240 },    // row 1
        water_burst:  { frames: [8, 9, 10, 11], duration: 240 },  // row 2
        shadow_burst: { frames: [12, 13, 14, 15], duration: 240 }, // row 3
        poison_burst: { frames: [16, 17, 18, 19], duration: 240 }, // row 4
        cure_burst:   { frames: [20, 21, 22, 23], duration: 240 }, // row 5
        ember_burst:  { frames: [24, 25, 26, 27], duration: 240 }, // row 6
        ice_burst:    { frames: [28, 29, 30, 31], duration: 240 }, // row 7
        earth_burst:  { frames: [32, 33, 34, 35], duration: 240 }, // row 8
        default:      { frames: [0, 1, 2, 3], duration: 240 },
    },
};

/**
 * fx_spell_bursts_14_glow — extra-elemental-spellcasting-effects-anti-alias-glow-14x14.png
 * Identical layout to fx_spell_bursts_14 — glow-blended variant for boss fights.
 */
const fxSpellBursts14Glow: EffectSheet = {
    id: 'fx_spell_bursts_14_glow',
    image: 'assets/effects/magical/extra-elemental-spellcasting-effects-anti-alias-glow-14x14.png',
    framesWidth: 4,
    framesHeight: 9,
    animations: {
        fire_burst:   { frames: [0, 1, 2, 3], duration: 240 },
        dark_burst:   { frames: [4, 5, 6, 7], duration: 240 },
        water_burst:  { frames: [8, 9, 10, 11], duration: 240 },
        shadow_burst: { frames: [12, 13, 14, 15], duration: 240 },
        poison_burst: { frames: [16, 17, 18, 19], duration: 240 },
        cure_burst:   { frames: [20, 21, 22, 23], duration: 240 },
        ember_burst:  { frames: [24, 25, 26, 27], duration: 240 },
        ice_burst:    { frames: [28, 29, 30, 31], duration: 240 },
        earth_burst:  { frames: [32, 33, 34, 35], duration: 240 },
        default:      { frames: [0, 1, 2, 3], duration: 240 },
    },
};

// ---------------------------------------------------------------------------
// magical/ — fire explosions
// ---------------------------------------------------------------------------

/** fx_fireball_explosion — fire-explosion-28x28.png — 336×28, 28×28px, 12 frames */
const fxFireballExplosion: EffectSheet = {
    id: 'fx_fireball_explosion',
    image: 'assets/effects/magical/fire-explosion-28x28.png',
    framesWidth: 12,
    framesHeight: 1,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 750 }, // 16 fps
    },
};

/** fx_fireball_explosion_glow — fire-explosion-anti-alias-glow.png — same layout */
const fxFireballExplosionGlow: EffectSheet = {
    id: 'fx_fireball_explosion_glow',
    image: 'assets/effects/magical/fire-explosion-anti-alias-glow.png',
    framesWidth: 12,
    framesHeight: 1,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 750 },
    },
};

/** fx_fireball_explosion_iso — fire-explosion-isometric-28x28.png — 336×28, 28×28px, 12 frames */
const fxFireballExplosionIso: EffectSheet = {
    id: 'fx_fireball_explosion_iso',
    image: 'assets/effects/magical/fire-explosion-isometric-28x28.png',
    framesWidth: 12,
    framesHeight: 1,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 750 },
    },
};

/** fx_fireball_explosion_iso_glow — isometric glow variant */
const fxFireballExplosionIsoGlow: EffectSheet = {
    id: 'fx_fireball_explosion_iso_glow',
    image: 'assets/effects/magical/fire-explosion-isometric-anti-alias-glow-28x28.png',
    framesWidth: 12,
    framesHeight: 1,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 750 },
    },
};

// ---------------------------------------------------------------------------
// magical/ — ice bursts (all 48×48px, 8-frame single row)
// ---------------------------------------------------------------------------

/** fx_ice_burst_crystal — ice-burst-crystal-48x48.png — 384×48, 48×48px, 8 frames */
const fxIceBurstCrystal: EffectSheet = {
    id: 'fx_ice_burst_crystal',
    image: 'assets/effects/magical/ice-burst-crystal-48x48.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 }, // 12 fps
    },
};

/** fx_ice_burst_crystal_glow — glow variant */
const fxIceBurstCrystalGlow: EffectSheet = {
    id: 'fx_ice_burst_crystal_glow',
    image: 'assets/effects/magical/ice-burst-crystal-48x48-anti-alias-glow.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 },
    },
};

/** fx_ice_burst_blue — dark-blue-outline variant — more legible on light backgrounds */
const fxIceBurstBlue: EffectSheet = {
    id: 'fx_ice_burst_blue',
    image: 'assets/effects/magical/ice-burst-dark-blue-outline-48x48.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 },
    },
};

/** fx_ice_burst_grey — light-grey-outline variant — soft ice burst */
const fxIceBurstGrey: EffectSheet = {
    id: 'fx_ice_burst_grey',
    image: 'assets/effects/magical/ice-burst-light-grey-outline-48x48.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 },
    },
};

/** fx_ice_burst_bare — no-outline variant — stark raw ice shards for blizzard */
const fxIceBurstBare: EffectSheet = {
    id: 'fx_ice_burst_bare',
    image: 'assets/effects/magical/ice-burst-no-outline-48x48.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 },
    },
};

/** fx_ice_burst_tblue — transparent-blue-outline variant — compositing layer */
const fxIceBurstTBlue: EffectSheet = {
    id: 'fx_ice_burst_tblue',
    image: 'assets/effects/magical/ice-burst-transparent-blue-outline-48x48.png',
    framesWidth: 8,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 667 },
    },
};

// ---------------------------------------------------------------------------
// magical/ — large fire (looping ambient flame)
// ---------------------------------------------------------------------------

/**
 * fx_large_fire — large-fire-28x28.png — 112×84, 28×28px, 4 cols × 3 rows, 12 frames
 * Loop: sustained flame for seli moves.
 */
const fxLargeFire: EffectSheet = {
    id: 'fx_large_fire',
    image: 'assets/effects/magical/large-fire-28x28.png',
    framesWidth: 4,
    framesHeight: 3,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 1200 }, // 10 fps
    },
};

/** fx_large_fire_glow — anti-alias-glow variant */
const fxLargeFireGlow: EffectSheet = {
    id: 'fx_large_fire_glow',
    image: 'assets/effects/magical/large-fire-anti-alias-glow-28x28.png',
    framesWidth: 4,
    framesHeight: 3,
    animations: {
        play: { frames: Array.from({ length: 12 }, (_, i) => i), duration: 1200 },
    },
};

// ---------------------------------------------------------------------------
// magical/ — lightning (all single-row, non-looping)
// ---------------------------------------------------------------------------

/** fx_lightning_blast — lightning-blast-54x18.png — 486×18, 54×18px, 9 frames */
const fxLightningBlast: EffectSheet = {
    id: 'fx_lightning_blast',
    image: 'assets/effects/magical/lightning-blast-54x18.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 500 }, // 18 fps
    },
};

/** fx_lightning_blast_glow — glow variant */
const fxLightningBlastGlow: EffectSheet = {
    id: 'fx_lightning_blast_glow',
    image: 'assets/effects/magical/lightning-blast-anti-alias-glow-54x18.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 500 },
    },
};

/** fx_lightning_energy — lightning-energy-48x48.png — 432×48, 48×48px, 9 frames */
const fxLightningEnergy: EffectSheet = {
    id: 'fx_lightning_energy',
    image: 'assets/effects/magical/lightning-energy-48x48.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 643 }, // 14 fps
    },
};

/** fx_lightning_energy_glow — glow variant */
const fxLightningEnergyGlow: EffectSheet = {
    id: 'fx_lightning_energy_glow',
    image: 'assets/effects/magical/lightning-energy-anti-alias-glow-48x48.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 643 },
    },
};

/** fx_red_energy — red-energy-48x48.png — 432×48, 48×48px, 9 frames */
const fxRedEnergy: EffectSheet = {
    id: 'fx_red_energy',
    image: 'assets/effects/magical/red-energy-48x48.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 643 },
    },
};

/** fx_red_energy_glow — glow variant */
const fxRedEnergyGlow: EffectSheet = {
    id: 'fx_red_energy_glow',
    image: 'assets/effects/magical/red-energy-anti-alias-glow-48x48.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 643 },
    },
};

/** fx_red_lightning_blast — red-lightning-blast-54x18.png — 486×18, 54×18px, 9 frames */
const fxRedLightningBlast: EffectSheet = {
    id: 'fx_red_lightning_blast',
    image: 'assets/effects/magical/red-lightning-blast-54x18.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 500 },
    },
};

/** fx_red_lightning_blast_glow — glow variant */
const fxRedLightningBlastGlow: EffectSheet = {
    id: 'fx_red_lightning_blast_glow',
    image: 'assets/effects/magical/red-lightning-blast-anti-alias-glow-54x18.png',
    framesWidth: 9,
    framesHeight: 1,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], duration: 500 },
    },
};

// ---------------------------------------------------------------------------
// weapon/ effects
// ---------------------------------------------------------------------------

/**
 * fx_sword_slash — slash-attack-effect-1.png — 50×126, 25×14px, 2 cols × 9 rows, 18 frames
 * Crescent arc slash sweep — physical melee hit.
 */
const fxSwordSlash: EffectSheet = {
    id: 'fx_sword_slash',
    image: 'assets/effects/weapon/slash-attack-effect-1.png',
    framesWidth: 2,
    framesHeight: 9,
    animations: {
        play: { frames: Array.from({ length: 18 }, (_, i) => i), duration: 1125 }, // 16 fps
    },
};

/**
 * fx_staff_swish — staff-attack-effect-1.png — 32×64, 16×16px, 2 cols × 4 rows, 8 frames
 * Light arc puff — staff or wand tap impact.
 */
const fxStaffSwish: EffectSheet = {
    id: 'fx_staff_swish',
    image: 'assets/effects/weapon/staff-attack-effect-1.png',
    framesWidth: 2,
    framesHeight: 4,
    animations: {
        play: { frames: [0, 1, 2, 3, 4, 5, 6, 7], duration: 571 }, // 14 fps
    },
};

// ---------------------------------------------------------------------------
// Exported array — spread into spritesheets[] in config.client.ts
// ---------------------------------------------------------------------------

export const effectSpritesheets: EffectSheet[] = [
    // root effects
    fxFeatherDrift,
    fxGasCloud,
    fxDirtKickup,
    // magical — elemental orbs
    fxSpellOrbsV1,
    fxSpellOrbsV2,
    fxSpellBursts14,
    fxSpellBursts14Glow,
    // magical — fire explosions
    fxFireballExplosion,
    fxFireballExplosionGlow,
    fxFireballExplosionIso,
    fxFireballExplosionIsoGlow,
    // magical — ice bursts
    fxIceBurstCrystal,
    fxIceBurstCrystalGlow,
    fxIceBurstBlue,
    fxIceBurstGrey,
    fxIceBurstBare,
    fxIceBurstTBlue,
    // magical — large fire
    fxLargeFire,
    fxLargeFireGlow,
    // magical — lightning
    fxLightningBlast,
    fxLightningBlastGlow,
    fxLightningEnergy,
    fxLightningEnergyGlow,
    fxRedEnergy,
    fxRedEnergyGlow,
    fxRedLightningBlast,
    fxRedLightningBlastGlow,
    // weapon
    fxSwordSlash,
    fxStaffSwish,
];
