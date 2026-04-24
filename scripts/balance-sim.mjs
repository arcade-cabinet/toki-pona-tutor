#!/usr/bin/env node
/**
 * Balance simulator (T8 — combat + economy tuning).
 *
 * Monte Carlo over the actual runtime math (src/modules/main/catch-math.ts,
 * xp-curve.ts, wild-combat.ts) using JSON tuning values as inputs. Produces
 * a per-region table of:
 *   - avg turns to kill a common target
 *   - avg throws to catch a whittled common
 *   - avg encounters to reach next gym level
 *   - avg trail_tokens accumulated by end of region
 *   - avg catches needed to fill party to 6
 *
 * The goal is to expose tuning problems (slog sections, trivial sections,
 * economy gaps) without needing a 15-minute browser playthrough per change.
 *
 * Run: `node scripts/balance-sim.mjs`
 *      `node scripts/balance-sim.mjs --trials 50000`
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TRIALS = Number(process.argv.find(a => a.startsWith("--trials="))?.split("=")[1]) || 20000;

const combat = JSON.parse(readFileSync(resolve(ROOT, "src/content/gameplay/combat.json"), "utf8"));
const progression = JSON.parse(readFileSync(resolve(ROOT, "src/content/gameplay/progression.json"), "utf8"));
const shops = JSON.parse(readFileSync(resolve(ROOT, "src/content/gameplay/shops.json"), "utf8"));
const itemDrops = JSON.parse(readFileSync(resolve(ROOT, "src/content/gameplay/item-drops.json"), "utf8"));

const world = JSON.parse(readFileSync(resolve(ROOT, "src/content/generated/world.json"), "utf8"));
const species = Object.fromEntries(world.species.map(s => [s.id, s]));

// ---------- math transplanted from src/modules/main ----------
function wildTargetMaxHp(speciesHp = 40, level) {
    const { base_floor, level_floor, level_multiplier } = combat.wild_combat.target_hp;
    return base_floor + Math.max(level, level_floor) * level_multiplier + speciesHp;
}
function wildFightDamage({ attackerLevel, attackerAttack = 50, defenderDefense = 30, typeMultiplier = 1 }) {
    const c = combat.wild_combat.fight_damage;
    const L = Math.max(attackerLevel, c.attacker_level_floor);
    const statDelta = (attackerAttack - defenderDefense) / c.stat_delta_divisor;
    const pre = Math.max(c.base_damage + L * c.level_multiplier + statDelta, c.pre_multiplier_floor);
    return Math.max(Math.floor(pre * typeMultiplier), c.output_min);
}
function catchProb({ hp, hpMax, catchRate, pokiPower }) {
    if (hpMax <= 0) return 0;
    const hpf = 1 - Math.max(0, Math.min(hp, hpMax)) / hpMax;
    return Math.max(0, Math.min(1, hpf * catchRate * pokiPower));
}
function xpForLevel(n) { return Math.pow(Math.min(n, progression.level_curve.max_level), progression.level_curve.exponent); }
function levelFromXp(xp) {
    for (let n = progression.level_curve.max_level; n >= 1; n--) if (xp >= xpForLevel(n)) return n;
    return 1;
}
globalThis.levelFromXp = levelFromXp;

// ---------- simulators ----------
function simulateSingleEncounter({ attackerLevel, attackerAttack = 52, target, pokiPower = 1, strategy = "fight-to-10pct-then-catch", rng = Math.random }) {
    let hp = wildTargetMaxHp(target.base_stats?.hp, attackerLevel);
    const hpMax = hp;
    let turns = 0;
    let throws = 0;
    let caught = false;
    const MAX_TURNS = 30;

    while (turns < MAX_TURNS) {
        turns++;
        if (strategy === "fight-until-dead") {
            const dmg = wildFightDamage({ attackerLevel, attackerAttack, defenderDefense: target.base_stats?.defense });
            hp = Math.max(0, hp - dmg);
            if (hp <= 0) break;
        } else if (strategy === "fight-to-10pct-then-catch") {
            if (hp / hpMax > 0.15) {
                const dmg = wildFightDamage({ attackerLevel, attackerAttack, defenderDefense: target.base_stats?.defense });
                hp = Math.max(1, hp - dmg); // don't accidentally KO
            } else {
                throws++;
                if (rng() < catchProb({ hp, hpMax, catchRate: target.catch_rate, pokiPower })) { caught = true; break; }
            }
        }
    }
    return { turns, throws, caught, finalHp: hp, hpMax, defeated: hp <= 0 };
}

function monteCarlo(trials, generator) {
    const results = Array.from({ length: trials }, () => generator());
    return results;
}
function avg(arr, key) { return arr.reduce((s, r) => s + (key ? r[key] : r), 0) / arr.length; }
function pctile(arr, p) { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length * p)]; }

// ---------- scenarios ----------
const scenarios = [
    { label: "Greenwood Road (L3-5 commons) vs starter L5", level: 5, speciesIds: ["applepup", "sparrowling", "mossfawn", "dewpad"], enemyLevels: [3, 4, 5] },
    { label: "Highridge Pass (L6-9) vs starter L8", level: 8, speciesIds: ["tarrin", "stoneclaw", "thornling", "warback"], enemyLevels: [6, 7, 8, 9] },
    { label: "Lakehaven (L10-14) vs team L12", level: 12, speciesIds: ["reedfrog", "snapper", "bluefin", "riverdancer"], enemyLevels: [10, 12, 14] },
    { label: "Frostvale (L15-20) vs team L17", level: 17, speciesIds: ["snowhare", "snowbird", "icepuff", "frostclaw"], enemyLevels: [15, 17, 20] },
    { label: "Dreadpeak (L22-28) vs team L25", level: 25, speciesIds: ["nightspike", "cavewing", "ashmote", "shadowmite"], enemyLevels: [22, 25, 28] },
];

console.log(`Balance sim — ${TRIALS.toLocaleString()} trials per cell`);
console.log("=".repeat(88));
console.log("Encounter probability per step:", combat.encounter.probability_per_step);
console.log("Level curve: n^" + progression.level_curve.exponent, `(L5=${xpForLevel(5)}, L10=${xpForLevel(10)}, L20=${xpForLevel(20)})`);
console.log("Shop prices:", shops.shops.shopkeep.stock.map(s => `${s.item_id}=${s.price}`).join(", "));
console.log("Catch probabilities at HP thresholds (common species, cr=0.40, pod power 1.0):");
for (const hpFrac of [1.0, 0.5, 0.25, 0.1, 0.05]) {
    console.log(`   ${(hpFrac*100).toFixed(0).padStart(3)}% HP → p=${catchProb({hp:hpFrac*100,hpMax:100,catchRate:0.40,pokiPower:1}).toFixed(3)}`);
}
console.log();

console.log("SCENARIO ANALYSIS:");
for (const scn of scenarios) {
    const knownSpecies = scn.speciesIds.map(id => species[id]).filter(Boolean);
    if (knownSpecies.length === 0) { console.log(`  SKIP ${scn.label} — no species resolved`); continue; }
    console.log(`\n  ${scn.label}`);

    for (const strategy of ["fight-until-dead", "fight-to-10pct-then-catch"]) {
        const samples = monteCarlo(TRIALS, () => {
            const sp = knownSpecies[Math.floor(Math.random() * knownSpecies.length)];
            const el = scn.enemyLevels[Math.floor(Math.random() * scn.enemyLevels.length)];
            const target = { ...sp };
            return simulateSingleEncounter({ attackerLevel: scn.level, target, strategy });
        });
        const turnsAvg = avg(samples, "turns");
        const turnsP90 = pctile(samples.map(s => s.turns), 0.9);
        const caughtRate = samples.filter(s => s.caught).length / samples.length;
        const defeatedRate = samples.filter(s => s.defeated).length / samples.length;
        const throwsAvg = avg(samples.filter(s => s.throws > 0), "throws") || 0;
        console.log(`    [${strategy.padEnd(30)}] turns μ=${turnsAvg.toFixed(1)} p90=${turnsP90.toFixed(0)} | caught=${(caughtRate*100).toFixed(1)}% | defeated=${(defeatedRate*100).toFixed(1)}% | avg throws=${throwsAvg.toFixed(1)}`);
    }
}

// T8b: scaledEncounterXp matches src/modules/main/encounter.ts
function scaledXp(baseYield, enemyLevel) {
    return Math.max(1, Math.floor(baseYield * Math.max(1, enemyLevel / 5)));
}

console.log("\nXP ECONOMY (level-scaled per scaledEncounterXp in encounter.ts):");
const levels = [5, 8, 12, 17, 25];
for (let i = 0; i < levels.length - 1; i++) {
    const from = levels[i], to = levels[i + 1];
    const xpNeeded = xpForLevel(to) - xpForLevel(from);
    const enemyLvl = scenarios[i].enemyLevels[Math.floor(scenarios[i].enemyLevels.length / 2)];
    const avgBaseXp = avg(scenarios[i].speciesIds.map(id => species[id]?.xp_yield || 60));
    const scaledDefeatXp = scaledXp(avgBaseXp, enemyLvl);
    const scaledCatchXp = Math.floor(scaledDefeatXp / 2);
    const defeatsNeeded = Math.ceil(xpNeeded / scaledDefeatXp);
    const catchesNeeded = Math.ceil(xpNeeded / scaledCatchXp);
    console.log(`  L${from} → L${to}: need ${xpNeeded} XP, enemy L${enemyLvl} yields ${scaledDefeatXp}/defeat ${scaledCatchXp}/catch → ${defeatsNeeded} defeats OR ${catchesNeeded} catches`);
}

console.log("\nGYM MASTERS (one per badge, xp_yield in trainers.json):");
const gymXp = progression.gym_xp_curve;
let cumulative = xpForLevel(5);
for (const [badge, xp] of Object.entries(gymXp)) {
    cumulative += xp;
    console.log(`  ${badge}: +${xp} XP → cumulative ${cumulative} (L${levelFromXp ? levelFromXp(cumulative) : '?'})`);
}

console.log("\nSHOP ECONOMY (earn rate vs prices):");
const coinsPerCommonCatch = 1; // orchard_fruit drop rate 0.18 × avg, token drop on stone/seli = ~0.2
const catchesForHeavyPod = Math.ceil(6 / coinsPerCommonCatch); // heavy_capture_pod = 6 tokens
console.log(`  capture_pod (2 tokens): ~${Math.ceil(2/0.2)} token-yielding defeats`);
console.log(`  heavy_capture_pod (6 tokens): ~${Math.ceil(6/0.2)} token-yielding defeats`);
console.log(`  spring_tonic (4 tokens): ~${Math.ceil(4/0.2)} token-yielding defeats`);
console.log(`  Battle coin rewards: janIke=${shops.battle_coin_rewards.janIke}, badges 6→12, dragon=${shops.battle_coin_rewards.greenDragon}`);
