/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import {
  combatantFromParty,
  combatantFromWild,
  computeDamage,
  pickEnemyMove,
  rollCatch,
  xpForVictory,
  type Combatant,
} from '../combat/engine';
import {
  getSave,
  addToParty,
  addItem,
  consumeItem,
  markSeen,
  markCaught,
  masterWord,
  applyCombatResult,
  xpToReachLevel,
  type PartyMember,
} from '../ecs/saveState';
import { getSpecies } from '../content/loader';
import type { Move } from '../../content/schema';

type Phase = 'intro' | 'menu' | 'resolving' | 'victory' | 'defeat' | 'caught' | 'run';
type DamagePop = { id: number; amount: number; target: 'enemy' | 'player' };

type Action = 'attack' | 'poki' | 'run';

/** HP ratio guarded against max_hp === 0 (which can happen from malformed
 *  content or edge cases during combatant initialization). */
function hpRatio(c: Combatant | null): number {
  if (!c || c.max_hp <= 0) return 0;
  return c.hp / c.max_hp;
}
function hpBarGradient(c: Combatant | null): string {
  const r = hpRatio(c);
  if (r > 0.5) return 'linear-gradient(90deg,#22c55e,#84cc16)';
  if (r > 0.25) return 'linear-gradient(90deg,#facc15,#f97316)';
  return 'linear-gradient(90deg,#ef4444,#dc2626)';
}

/**
 * Pokemon-shape combat overlay.
 *
 * Player's lead party member fights the wild creature that opened the
 * encounter. Commands: a list of the lead's moves, Throw poki (catches
 * wild), Run (ends combat without reward).
 *
 * On combat:enter, if the player's party is empty, we auto-gift the
 * first species in world.json at level 5. This is the vertical-slice
 * starter flow until the diegetic starter ceremony at jan Sewi lands.
 */
export function CombatOverlay() {
  const [player, setPlayer] = createSignal<Combatant | null>(null);
  const [enemy, setEnemy] = createSignal<Combatant | null>(null);
  const [enemyIdSignal, setEnemyIdSignal] = createSignal<string>('');
  /** Which party member is in the fight — we need the id to persist XP. */
  const [activeMemberId, setActiveMemberId] = createSignal<string>('');
  /** XP to award on close if the player won. */
  const [pendingXp, setPendingXp] = createSignal<number>(0);
  const [phase, setPhase] = createSignal<Phase>('intro');
  const [log, setLog] = createSignal('');
  const [view, setView] = createSignal<'commands' | 'moves'>('commands');
  const [selectedAction, setSelectedAction] = createSignal<Action>('attack');
  const [selectedMove, setSelectedMove] = createSignal(0);
  const [enemyShake, setEnemyShake] = createSignal(false);
  const [playerShake, setPlayerShake] = createSignal(false);
  const [playerLunge, setPlayerLunge] = createSignal(false);
  const [flashScreen, setFlashScreen] = createSignal(false);
  const [damagePops, setDamagePops] = createSignal<DamagePop[]>([]);
  const [wipe, setWipe] = createSignal(false);
  const [caughtToast, setCaughtToast] = createSignal<string | null>(null);

  let popId = 0;
  const timers = new Set<number>();
  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  onCleanup(() => {
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
  });

  const spawnDamage = (amount: number, target: 'enemy' | 'player') => {
    const id = ++popId;
    setDamagePops((prev) => [...prev, { id, amount, target }]);
    schedule(() => setDamagePops((prev) => prev.filter((p) => p.id !== id)), 1000);
  };

  /** Auto-gift the first species at level 5 if the player has no party.
   *  Bridge until the diegetic starter ceremony lands. */
  function ensureStarter(): PartyMember | null {
    const save = getSave();
    if (save.party.length > 0) return save.party[0];
    // Pick the first starter-type species we can find (catch_rate === 0.45
    // is our convention for starters) or fall back to the first species.
    const world = save; // just to suppress lint, we use save for party check
    void world;
    // Import loader lazily to avoid a circular ref at module-load time.
    const species = getSpecies('soweli_seli') ?? null;
    if (!species) return null;
    const moves = species.learnset.filter((l) => l.level <= 5).map((l) => l.move_id).slice(-4);
    const starter: PartyMember = {
      instance_id: `starter-${Date.now()}`,
      species_id: species.id,
      level: 5,
      // Seed xp to match the starting level so awarding XP next fight
      // moves the creature UP rather than dropping it to level 1.
      xp: xpToReachLevel(5),
      hp: species.base_stats.hp + 8,
      max_hp: species.base_stats.hp + 8,
      moves,
      pp: moves.map(() => 15),
    };
    addToParty(starter);
    // Also give the player a starter-kit of 3 nets
    addItem('poki_lili', 3);
    gameBus.emit('toast:show', {
      kind: 'celebration',
      title: `jan Sewi gave you ${species.name.tp ?? species.id}`,
      body: 'And three poki to catch more with.',
      ttlMs: 3200,
    });
    return starter;
  }

  onMount(() => {
    const unsub = gameBus.on('combat:enter', ({ enemyId, level }) => {
      setEnemyIdSignal(enemyId);
      // Build the wild combatant from species registry.
      const wild = combatantFromWild(enemyId, level ?? 3);
      if (!wild) {
        console.warn(`[combat] unknown species: ${enemyId}`);
        gameBus.emit('combat:defeat', { enemyId });
        return;
      }
      markSeen(enemyId);

      // Player's lead — ensure there's one.
      const starter = ensureStarter();
      if (!starter) {
        console.error('[combat] no party and no starter available');
        gameBus.emit('combat:defeat', { enemyId });
        return;
      }
      setActiveMemberId(starter.instance_id);
      setPendingXp(0);
      setPlayer(combatantFromParty(starter));
      setEnemy(wild);
      setSelectedAction('attack');
      setSelectedMove(0);
      setView('commands');
      setPhase('intro');
      setLog(`A wild ${wild.species.name.tp ?? wild.species.id} appeared!`);
      setWipe(true);
      schedule(() => setWipe(false), 700);
      schedule(() => {
        setPhase('menu');
        setLog('What will you do?');
      }, 900);
    });
    onCleanup(unsub);
  });

  const enemyTurn = () => {
    const e = enemy();
    const p = player();
    if (!e || !p) return;
    const pick = pickEnemyMove(e);
    if (!pick) {
      // No PP — they struggle (skip turn). Rare; we just continue.
      setLog(`${e.species.name.tp ?? e.species.id} has no moves left.`);
      schedule(() => setPhase('menu'), 600);
      return;
    }
    const { move, index } = pick;
    setLog(`${e.species.name.tp ?? e.species.id} uses ${move.name.tp ?? move.name.en}!`);
    schedule(() => {
      const dmg = computeDamage(move, e, p);
      setPlayerShake(true);
      setFlashScreen(true);
      spawnDamage(dmg, 'player');
      schedule(() => setPlayerShake(false), 350);
      schedule(() => setFlashScreen(false), 200);
      const newHp = Math.max(0, p.hp - dmg);
      setPlayer({ ...p, hp: newHp });
      // Decrement enemy PP
      const nextPp = [...e.pp];
      nextPp[index] = Math.max(0, nextPp[index] - 1);
      setEnemy({ ...e, pp: nextPp });
      setLog(`${e.species.name.tp ?? e.species.id} hit for ${dmg}.`);
      if (newHp === 0) {
        schedule(() => setPhase('defeat'), 500);
      } else {
        schedule(() => setPhase('menu'), 500);
      }
    }, 400);
  };

  const usePlayerMove = (move: Move, moveIndex: number) => {
    const e = enemy();
    const p = player();
    if (!e || !p || phase() !== 'menu') return;
    if ((p.pp[moveIndex] ?? 0) <= 0) {
      setLog('No PP left for that move.');
      return;
    }
    setPhase('resolving');
    setView('commands');
    setLog(`${p.species.name.tp ?? p.species.id} uses ${move.name.tp ?? move.name.en}!`);
    setPlayerLunge(true);
    schedule(() => setPlayerLunge(false), 550);
    schedule(() => {
      const dmg = computeDamage(move, p, e);
      setEnemyShake(true);
      setFlashScreen(true);
      spawnDamage(dmg, 'enemy');
      schedule(() => setEnemyShake(false), 350);
      schedule(() => setFlashScreen(false), 200);
      const newHp = Math.max(0, e.hp - dmg);
      setEnemy({ ...e, hp: newHp });
      // Decrement player PP
      const nextPp = [...p.pp];
      nextPp[moveIndex] = Math.max(0, nextPp[moveIndex] - 1);
      setPlayer({ ...p, pp: nextPp });
      setLog(`Hit for ${dmg}!`);
      if (newHp === 0) {
        schedule(() => {
          setPhase('victory');
          const xp = xpForVictory(e);
          setPendingXp(xp);
          // Master the creature's single-word name.
          masterWord(e.species.name.tp ?? e.species.id);
          gameBus.emit('toast:show', {
            kind: 'celebration',
            title: `${e.species.name.tp ?? e.species.id} is gone!`,
            body: `+${xp} XP for ${p.species.name.tp ?? p.species.id}`,
            ttlMs: 3000,
          });
        }, 700);
      } else {
        schedule(enemyTurn, 700);
      }
    }, 380);
  };

  const throwPoki = () => {
    const e = enemy();
    if (!e || !e.wild || phase() !== 'menu') return;
    const save = getSave();
    // Pick the "best" poki the player has. For now, just any poki item.
    const pokiId = Object.keys(save.inventory).find((k) => k.startsWith('poki'));
    if (!pokiId) {
      setLog('You have no poki to throw.');
      return;
    }
    if (!consumeItem(pokiId)) {
      setLog('You have no poki to throw.');
      return;
    }
    setPhase('resolving');
    setView('commands');
    setLog(`You throw the poki...`);
    schedule(() => {
      const success = rollCatch(e);
      if (success) {
        markCaught(e.species.id);
        // Add the wild creature as a new party member.
        const newMember: PartyMember = {
          instance_id: `caught-${Date.now()}`,
          species_id: e.species.id,
          level: e.level,
          xp: xpToReachLevel(e.level),
          hp: e.hp,
          max_hp: e.max_hp,
          moves: e.moves.map((m) => m.id),
          pp: [...e.pp],
        };
        const ok = addToParty(newMember);
        if (ok) {
          setCaughtToast(e.species.name.tp ?? e.species.id);
          masterWord(e.species.name.tp ?? e.species.id);
          gameBus.emit('toast:show', {
            kind: 'celebration',
            title: `Caught ${e.species.name.tp ?? e.species.id}!`,
            body: 'Added to your party.',
            ttlMs: 3200,
          });
          schedule(() => setPhase('caught'), 900);
        } else {
          setLog('Your party is full — caught, but nowhere to put them.');
          schedule(() => setPhase('menu'), 1200);
        }
      } else {
        setLog('The poki snapped open. The creature escaped!');
        schedule(enemyTurn, 900);
      }
    }, 550);
  };

  const run = () => {
    setPhase('run');
    schedule(() => {
      const e = enemy();
      setEnemy(null);
      setPlayer(null);
      if (e) gameBus.emit('combat:defeat', { enemyId: e.species.id });
    }, 400);
  };

  const close = () => {
    const e = enemy();
    const p = player();
    const id = e?.species.id ?? enemyIdSignal();
    const memberId = activeMemberId();
    const ph = phase();
    // Persist the fight's result back to the party member. Defeat and run
    // still record HP/PP damage so the cost of combat is real. XP only
    // lands on victory or catch.
    if (memberId && p) {
      const xpAward =
        ph === 'victory' || ph === 'caught' ? pendingXp() || (e ? xpForVictory(e) : 0) : 0;
      const levelsGained = applyCombatResult(memberId, {
        xp_gained: xpAward,
        hp: p.hp,
        pp: p.pp,
      });
      if (levelsGained > 0) {
        gameBus.emit('toast:show', {
          kind: 'celebration',
          title: `${p.species.name.tp ?? p.species.id} grew ${levelsGained === 1 ? 'a level' : `${levelsGained} levels`}!`,
          ttlMs: 3400,
        });
      }
    }
    setEnemy(null);
    setPlayer(null);
    setPendingXp(0);
    setActiveMemberId('');
    if (ph === 'victory') gameBus.emit('combat:victory', { enemyId: id });
    else if (ph === 'caught') gameBus.emit('combat:caught', { enemyId: id });
    else gameBus.emit('combat:defeat', { enemyId: id });
    setCaughtToast(null);
  };

  // Keyboard nav for the command menu — arrow keys + Enter.
  const onKeyDown = (ev: KeyboardEvent) => {
    if (!enemy() || phase() !== 'menu') return;
    if (view() === 'commands') {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        const next: Action =
          selectedAction() === 'attack' ? 'poki' : selectedAction() === 'poki' ? 'run' : 'attack';
        setSelectedAction(next);
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const prev: Action =
          selectedAction() === 'attack' ? 'run' : selectedAction() === 'run' ? 'poki' : 'attack';
        setSelectedAction(prev);
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const a = selectedAction();
        if (a === 'attack') setView('moves');
        else if (a === 'poki') throwPoki();
        else run();
      }
    } else {
      const p = player();
      if (!p) return;
      const n = p.moves.length;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        setSelectedMove((i) => (i + 1) % n);
      } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
        ev.preventDefault();
        setSelectedMove((i) => (i - 1 + n) % n);
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const idx = selectedMove();
        if (p.moves[idx]) usePlayerMove(p.moves[idx], idx);
      } else if (ev.key === 'Escape' || ev.key === 'Backspace') {
        ev.preventDefault();
        setView('commands');
      }
    }
  };

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown));
  });

  return (
    <Show when={enemy()}>
      {(_) => (
        <div class="absolute inset-0 z-40 flex flex-col pointer-events-auto">
          <Show when={wipe()}>
            <div class="absolute inset-0 z-50 animate-encounter pointer-events-none" />
          </Show>

          {/* Arena */}
          <div class={`flex-1 relative overflow-hidden combat-arena ${flashScreen() ? 'animate-flash' : ''}`}>
            {/* Enemy nameplate */}
            <div class="absolute top-3 left-4 ff-window px-4 py-2 text-amber-50 min-w-[200px]">
              <div class="font-display text-sm uppercase tracking-wider text-yellow-200">
                {enemy()!.species.name.tp ?? enemy()!.species.id}
              </div>
              <div class="text-[10px] uppercase tracking-widest text-blue-200/80 mb-1">
                Lv. {enemy()!.level} · {enemy()!.species.type}
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-[10px] text-blue-100">HP</span>
                <div class="flex-1 h-2 bg-blue-950/80 border border-blue-300/60 rounded-sm overflow-hidden">
                  <div
                    class="h-full transition-all duration-500"
                    style={{
                      width: `${hpRatio(enemy()) * 100}%`,
                      background: hpBarGradient(enemy()),
                    }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-blue-100 min-w-[44px] text-right">
                  {enemy()!.hp}/{enemy()!.max_hp}
                </span>
              </div>
            </div>

            {/* Player nameplate */}
            <Show when={player()}>
              <div class="absolute bottom-3 right-4 ff-window px-4 py-2 text-amber-50 min-w-[200px]">
                <div class="font-display text-sm uppercase tracking-wider text-yellow-200">
                  {player()!.species.name.tp ?? player()!.species.id}
                </div>
                <div class="text-[10px] uppercase tracking-widest text-blue-200/80 mb-1">
                  Lv. {player()!.level} · {player()!.species.type}
                </div>
                <div class="flex items-center gap-2">
                  <span class="font-pixel text-[10px] text-blue-100">HP</span>
                  <div class="flex-1 h-2 bg-blue-950/80 border border-blue-300/60 rounded-sm overflow-hidden">
                    <div
                      class="h-full transition-all duration-500"
                      style={{
                        width: `${hpRatio(player()) * 100}%`,
                        background: hpBarGradient(player()),
                      }}
                    />
                  </div>
                  <span class="font-pixel text-[10px] text-blue-100 min-w-[44px] text-right">
                    {player()!.hp}/{player()!.max_hp}
                  </span>
                </div>
              </div>
            </Show>

            {/* Enemy sprite */}
            <div
              class={`absolute left-1/2 top-[40%] ${
                phase() === 'intro'
                  ? 'animate-enemy-enter'
                  : enemyShake()
                    ? 'animate-wiggle'
                    : phase() === 'victory' || phase() === 'caught'
                      ? 'animate-victory-glow'
                      : 'animate-idle-breathe'
              }`}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div
                class="w-36 h-36 rounded-full flex items-center justify-center font-sitelen text-5xl drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 70%, #92400e 100%)',
                  color: '#451a03',
                  border: '4px solid #fef3c7',
                  opacity: phase() === 'victory' || phase() === 'caught' ? 0.4 : 1,
                  filter: phase() === 'victory' || phase() === 'caught' ? 'grayscale(0.6)' : 'none',
                  transition: 'opacity 0.8s ease, filter 0.8s ease',
                }}
              >
                {enemy()!.species.name.tp ?? enemy()!.species.id}
              </div>
              <For each={damagePops().filter((p) => p.target === 'enemy')}>
                {(p) => (
                  <div
                    class="absolute left-1/2 top-1/3 font-display text-4xl animate-damage-pop pointer-events-none"
                    style={{
                      color: '#fef3c7',
                      'text-shadow': '0 2px 0 #7c2d12, 0 0 8px rgba(0,0,0,0.8)',
                    }}
                  >
                    {p.amount}
                  </div>
                )}
              </For>
            </div>

            {/* Player chip */}
            <Show when={player()}>
              <div
                class={`absolute right-20 bottom-28 w-24 h-24 rounded-full flex items-center justify-center font-sitelen text-3xl shadow-[0_4px_0_rgba(0,0,0,0.4)] ${
                  playerShake() ? 'animate-wiggle' : playerLunge() ? 'animate-lunge' : ''
                }`}
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #a7f3d0 0%, #34d399 60%, #047857 100%)',
                  color: '#064e3b',
                  border: '3px solid #ecfdf5',
                }}
              >
                {player()!.species.name.tp ?? player()!.species.id}
                <For each={damagePops().filter((p) => p.target === 'player')}>
                  {(p) => (
                    <div
                      class="absolute left-1/2 top-0 font-display text-3xl animate-damage-pop pointer-events-none"
                      style={{ color: '#fca5a5', 'text-shadow': '0 2px 0 #7f1d1d' }}
                    >
                      {p.amount}
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>

          {/* Bottom — command window */}
          <div class="p-3 bg-gradient-to-b from-blue-950 to-black" style={{ 'min-height': '38%' }}>
            <div class="grid grid-cols-[1fr_auto] gap-3 h-full">
              {/* Log */}
              <div class="ff-window px-4 py-3 text-amber-50 flex items-center">
                <div class="font-tile text-base leading-relaxed text-blue-50">{log()}</div>
              </div>

              <Show when={phase() === 'menu' && view() === 'commands'}>
                <div class="ff-window px-2 py-2 text-amber-50 min-w-[220px]">
                  <div class="flex flex-col gap-0.5">
                    <MenuItem
                      label="Attack"
                      subLabel="utala"
                      active={selectedAction() === 'attack'}
                      onEnter={() => setSelectedAction('attack')}
                      onClick={() => setView('moves')}
                    />
                    <MenuItem
                      label="Throw poki"
                      subLabel={`${getSave().inventory['poki_lili'] ?? 0} left`}
                      active={selectedAction() === 'poki'}
                      onEnter={() => setSelectedAction('poki')}
                      onClick={throwPoki}
                    />
                    <MenuItem
                      label="Run"
                      subLabel="weka"
                      active={selectedAction() === 'run'}
                      onEnter={() => setSelectedAction('run')}
                      onClick={run}
                    />
                  </div>
                </div>
              </Show>

              <Show when={phase() === 'menu' && view() === 'moves'}>
                <div class="ff-window px-2 py-2 text-amber-50 min-w-[220px]">
                  <Show when={player()}>
                    <div class="flex flex-col gap-0.5">
                      <For each={player()!.moves}>
                        {(m, i) => (
                          <MenuItem
                            label={m.name.tp ?? m.name.en}
                            subLabel={`${m.type} · ${player()!.pp[i()] ?? 0}/${m.pp} pp`}
                            active={selectedMove() === i()}
                            onEnter={() => setSelectedMove(i())}
                            onClick={() => usePlayerMove(m, i())}
                          />
                        )}
                      </For>
                      <button
                        type="button"
                        class="mt-1 text-left px-3 py-1 rounded-sm text-blue-200/80 hover:bg-blue-800/30 font-display text-[10px] uppercase tracking-widest"
                        onClick={() => setView('commands')}
                      >
                        ← back
                      </button>
                    </div>
                  </Show>
                </div>
              </Show>

              <Show when={phase() === 'intro' || phase() === 'resolving' || phase() === 'run'}>
                <div class="ff-window px-4 py-3 text-amber-50 min-w-[220px] flex items-center justify-center">
                  <span class="font-display text-yellow-200 text-sm uppercase tracking-wider animate-pulse">
                    ···
                  </span>
                </div>
              </Show>

              <Show when={phase() === 'victory' || phase() === 'caught'}>
                <div class="ff-window-amber px-4 py-3 text-amber-50 min-w-[220px] flex flex-col items-center justify-center gap-2">
                  <div class="font-display text-xl text-yellow-200 uppercase tracking-wider">
                    {phase() === 'caught' ? 'Caught!' : 'Victory'}
                  </div>
                  <Show when={phase() === 'caught' && caughtToast()}>
                    <div class="text-xs text-amber-100 text-center">
                      {caughtToast()} joined your party
                    </div>
                  </Show>
                  <button
                    onClick={close}
                    class="mt-1 px-4 py-1 rounded-sm bg-yellow-300 text-amber-900 font-display text-xs uppercase tracking-wider border-b-[3px] border-yellow-600 active:border-b-0 active:translate-y-[3px] transition-all"
                  >
                    o tawa →
                  </button>
                </div>
              </Show>

              <Show when={phase() === 'defeat'}>
                <div class="ff-window px-4 py-3 text-amber-50 min-w-[220px] flex flex-col items-center justify-center gap-2">
                  <div class="font-display text-xl text-red-300 uppercase tracking-wider">
                    sina pini
                  </div>
                  <button
                    onClick={close}
                    class="mt-1 px-4 py-1 rounded-sm bg-red-400 text-red-950 font-display text-xs uppercase tracking-wider border-b-[3px] border-red-700 active:border-b-0 active:translate-y-[3px] transition-all"
                  >
                    weka
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

function MenuItem(props: {
  label: string;
  subLabel?: string;
  active: boolean;
  onEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={props.onEnter}
      onFocus={props.onEnter}
      onClick={props.onClick}
      class={`relative text-left px-3 py-1.5 rounded-sm transition-colors ${
        props.active ? 'bg-blue-700/60 menu-glint' : 'hover:bg-blue-800/40'
      }`}
    >
      <span class={`inline-block w-3 text-yellow-300 ${props.active ? 'opacity-100' : 'opacity-0'}`}>
        ▶
      </span>
      <span class="font-display text-sm uppercase tracking-wider text-yellow-100">
        {props.label}
      </span>
      <Show when={props.subLabel}>
        <span class="ml-2 text-[10px] text-blue-200/70">{props.subLabel}</span>
      </Show>
    </button>
  );
}
