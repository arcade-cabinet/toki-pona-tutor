/**
 * Ambient world events — T7-07.
 *
 * Two independent ambient systems the overworld layer consults:
 *
 * 1. **Day/night cycle.** A single real-time minute in-game equals ~4
 *    game-hours, giving a full 24-hour cycle in 6 real minutes. The
 *    engine renders an RGB tint based on the current phase (night =
 *    deep blue, dawn/dusk = amber, day = no tint). Some NPCs check
 *    phase before speaking (owls wake, shopkeepers sleep).
 *
 * 2. **Weather.** Per-biome wet/dry-chance table; a deterministic PRNG
 *    keyed by the current real-time hour so the same player seeing the
 *    same map at the same wall-clock moment gets the same weather. Rain
 *    in kasi biomes, snow in lete, clear in seli/desert.
 *
 * Both are pure functions. The runtime owns the wall clock; this module
 * translates (t, biome) → (phase, tint, weather) without reading the
 * clock itself. That keeps everything testable and prevents ambient
 * state from silently drifting across save/load.
 */
import { AMBIENT_CONFIG } from "../../content/gameplay";

export type DayPhase = "night" | "dawn" | "day" | "dusk";
export type Weather = "clear" | "rain" | "snow" | "fog";
export type Biome = "village" | "kasi" | "lete" | "seli" | "telo" | "nena" | "indoor";

export interface AmbientState {
    phase: DayPhase;
    weather: Weather;
    /** Tint applied to the world layer as rgba(r,g,b,a) — a=0 when off. */
    tint: { r: number; g: number; b: number; a: number };
}

/** Minutes per in-game day. One real minute ≈ 4 in-game hours. */
const DAY_LENGTH_MINUTES = AMBIENT_CONFIG.day_length_minutes;

/**
 * Map a real-time Date to the current day phase. Uses the minute-
 * within-the-day-cycle (mod DAY_LENGTH_MINUTES) to carve the 6-minute
 * cycle into 4 phases: dawn (0-1), day (1-3), dusk (3-4), night (4-6).
 *
 * @example
 * phaseAt(new Date('2026-04-20T00:00:00Z'))  // → 'dawn'  (minute 0 of cycle)
 * phaseAt(new Date('2026-04-20T00:02:00Z'))  // → 'day'   (minute 2 of cycle)
 * phaseAt(new Date('2026-04-20T00:05:30Z'))  // → 'night' (minute 5.5 of cycle)
 */
export function phaseAt(now: Date): DayPhase {
    const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
    const cycleMinute = totalMinutes % DAY_LENGTH_MINUTES;
    if (cycleMinute < 1) return "dawn";
    if (cycleMinute < 3) return "day";
    if (cycleMinute < 4) return "dusk";
    return "night";
}

/**
 * RGBA tint for a phase. Day is fully transparent (a=0) so the biome
 * renders as-is. Other phases add subtle warm/cool overlays.
 */
export function tintForPhase(phase: DayPhase): AmbientState["tint"] {
    return AMBIENT_CONFIG.phase_tints[phase];
}

/**
 * Weather roll for a (biome, hour) pair. Deterministic — same inputs
 * always produce the same output so the weather is consistent during a
 * single in-game hour regardless of how many times a player walks in
 * and out of the map. Cheap LCG over `hour ^ biome.length` keeps the
 * seed derivation pure-math.
 */
export function weatherFor(biome: Biome, hour: number): Weather {
    if (biome === "indoor") return "clear";

    // Deterministic pseudo-random: hash biome + hour to [0, 1).
    const seed = ((hour * 9301 + biomeCode(biome) * 49297) >>> 0) % 233280;
    const roll = seed / 233280;

    const table = weatherTable(biome);
    let accum = 0;
    for (const [w, weight] of Object.entries(table) as [Weather, number][]) {
        accum += weight;
        if (roll < accum) return w;
    }
    return "clear";
}

function biomeCode(biome: Biome): number {
    return AMBIENT_CONFIG.biome_codes[biome];
}

function weatherTable(biome: Biome): Partial<Record<Weather, number>> {
    return AMBIENT_CONFIG.weather_tables[biome];
}

/** Convenience bundle the overworld can apply in one call. */
export function ambientAt(now: Date, biome: Biome): AmbientState {
    const phase = phaseAt(now);
    return {
        phase,
        weather: weatherFor(biome, now.getUTCHours()),
        tint: tintForPhase(phase),
    };
}
