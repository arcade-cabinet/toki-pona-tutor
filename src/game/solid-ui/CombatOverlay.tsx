/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { ENEMIES, type EnemyDef, type EnemyMove } from '../combat/enemies';
import { masterWord, addXp } from '../ecs/questState';

type Phase = 'intro' | 'menu' | 'resolving' | 'victory' | 'defeat';
type DamagePop = { id: number; amount: number; target: 'enemy' | 'player'; kind: 'normal' | 'crit' | 'heal' };

const PLAYER_MAX_HP = 20;
const PLAYER_DEFENSE = 1;
const PLAYER_SPIRIT = 1;

type PlayerMove = EnemyMove & { desc: string };

const PLAYER_MOVES: PlayerMove[] = [
  { id: 'strike', nameTp: 'utala', nameEn: 'Strike', kind: 'physical', damage: 4, desc: 'Sharp blow. Cuts through armor.' },
  { id: 'calm', nameTp: 'pona', nameEn: 'Calm', kind: 'calm', damage: 3, desc: 'Peaceful word. Soothes hostile hearts.' },
  { id: 'focus', nameTp: 'sona', nameEn: 'Focus', kind: 'spirit', damage: 5, desc: 'Spiritual strike. Bypasses guard.' },
];

function computeDamage(
  move: { kind: EnemyMove['kind']; damage: number },
  target: { defense: number; spirit: number },
): number {
  const resist = move.kind === 'physical' ? target.defense : move.kind === 'calm' ? target.spirit : 0;
  return Math.max(1, move.damage - resist);
}

export function CombatOverlay() {
  const [enemy, setEnemy] = createSignal<EnemyDef | null>(null);
  const [enemyHp, setEnemyHp] = createSignal(0);
  const [playerHp, setPlayerHp] = createSignal(PLAYER_MAX_HP);
  const [phase, setPhase] = createSignal<Phase>('intro');
  const [log, setLog] = createSignal<string>('');
  const [selectedMove, setSelectedMove] = createSignal(0);
  const [enemyShake, setEnemyShake] = createSignal(false);
  const [playerShake, setPlayerShake] = createSignal(false);
  const [playerLunge, setPlayerLunge] = createSignal(false);
  const [flashScreen, setFlashScreen] = createSignal(false);
  const [damagePops, setDamagePops] = createSignal<DamagePop[]>([]);
  const [wipe, setWipe] = createSignal(false);

  let popId = 0;
  // Track every setTimeout so we can cancel them on unmount — otherwise a fast
  // scene-swap can land mutations after the overlay is gone.
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

  const spawnDamage = (amount: number, target: 'enemy' | 'player', kind: DamagePop['kind'] = 'normal') => {
    const id = ++popId;
    setDamagePops((prev) => [...prev, { id, amount, target, kind }]);
    schedule(() => setDamagePops((prev) => prev.filter((p) => p.id !== id)), 1000);
  };

  // Keyboard nav for the command menu — ↑/↓ to move selection, Enter/Space
  // to confirm. Keeps the RPG menu usable without a mouse.
  const onKeyDown = (ev: KeyboardEvent) => {
    if (!enemy() || phase() !== 'menu') return;
    const total = PLAYER_MOVES.length + 1; // +1 for Run
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      setSelectedMove((i) => (i + 1) % total);
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      setSelectedMove((i) => (i - 1 + total) % total);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      const sel = selectedMove();
      if (sel < PLAYER_MOVES.length) usePlayerMove(PLAYER_MOVES[sel]);
      else run();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown));
    const unsub = gameBus.on('combat:enter', ({ enemyId }) => {
      const def = ENEMIES[enemyId];
      if (!def) {
        console.warn(`[combat] unknown enemy id: ${enemyId}`);
        gameBus.emit('combat:defeat', { enemyId });
        return;
      }
      setEnemy(def);
      setEnemyHp(def.hp);
      setPlayerHp(PLAYER_MAX_HP);
      setSelectedMove(0);
      setPhase('intro');
      setLog(`A wild ${def.nameTp} appeared!`);
      setWipe(true);
      schedule(() => setWipe(false), 700);
      schedule(() => {
        setPhase('menu');
        setLog(def.flavorEn);
      }, 900);
    });
    onCleanup(unsub);
  });

  const enemyTurn = () => {
    const e = enemy();
    if (!e) return;
    const move = e.moves[Math.floor(Math.random() * e.moves.length)];
    setLog(`${e.nameTp} uses ${move.nameEn}!`);
    schedule(() => {
      const dmg = computeDamage(move, { defense: PLAYER_DEFENSE, spirit: PLAYER_SPIRIT });
      setPlayerShake(true);
      setFlashScreen(true);
      spawnDamage(dmg, 'player');
      schedule(() => setPlayerShake(false), 350);
      schedule(() => setFlashScreen(false), 200);
      const newHp = Math.max(0, playerHp() - dmg);
      setPlayerHp(newHp);
      setLog(`${e.nameTp} uses ${move.nameEn} — ${dmg} dmg.`);
      if (newHp === 0) {
        schedule(() => setPhase('defeat'), 500);
      } else {
        schedule(() => setPhase('menu'), 500);
      }
    }, 400);
  };

  const usePlayerMove = (move: PlayerMove) => {
    const e = enemy();
    if (!e || phase() !== 'menu') return;
    setPhase('resolving');
    setLog(`You use ${move.nameEn}!`);
    setPlayerLunge(true);
    schedule(() => setPlayerLunge(false), 550);
    schedule(() => {
      const dmg = computeDamage(move, { defense: e.defense, spirit: e.spirit });
      setEnemyShake(true);
      setFlashScreen(true);
      spawnDamage(dmg, 'enemy');
      schedule(() => setEnemyShake(false), 350);
      schedule(() => setFlashScreen(false), 200);
      const newHp = Math.max(0, enemyHp() - dmg);
      setEnemyHp(newHp);
      setLog(`${move.nameEn} hits for ${dmg}!`);
      if (newHp === 0) {
        schedule(() => {
          setPhase('victory');
          for (const w of e.rewardWords) masterWord(w);
          addXp(e.xpReward);
          gameBus.emit('toast:show', {
            kind: 'celebration',
            title: `pona! ${e.nameTp} li lape.`,
            body: `+${e.xpReward} XP · learned ${e.rewardWords.join(', ')}`,
            ttlMs: 3500,
          });
        }, 700);
      } else {
        schedule(enemyTurn, 700);
      }
    }, 380);
  };

  const run = () => {
    const e = enemy();
    if (!e) return;
    setEnemy(null);
    gameBus.emit('combat:defeat', { enemyId: e.id });
  };

  const close = () => {
    const e = enemy();
    if (!e) return;
    setEnemy(null);
    if (phase() === 'victory') gameBus.emit('combat:victory', { enemyId: e.id });
    else gameBus.emit('combat:defeat', { enemyId: e.id });
  };

  return (
    <Show when={enemy()}>
      {(_) => (
        <div class="absolute inset-0 z-40 flex flex-col pointer-events-auto">
          <Show when={wipe()}>
            <div class="absolute inset-0 z-50 animate-encounter pointer-events-none" />
          </Show>
          {/* TOP — the arena */}
          <div class={`flex-1 relative overflow-hidden combat-arena ${flashScreen() ? 'animate-flash' : ''}`}>
            {/* Enemy nameplate — top-left FF-style window */}
            <div class="absolute top-3 left-4 ff-window px-4 py-2 text-amber-50 min-w-[180px]">
              <div class="font-display text-sm uppercase tracking-wider text-yellow-200">
                {enemy()!.nameTp}
              </div>
              <div class="text-[10px] uppercase tracking-widest text-blue-200/80 mb-1">
                {enemy()!.nameEn}
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-[10px] text-blue-100">HP</span>
                <div class="flex-1 h-2 bg-blue-950/80 border border-blue-300/60 rounded-sm overflow-hidden">
                  <div
                    class="h-full transition-all duration-500"
                    style={{
                      width: `${(enemyHp() / enemy()!.hp) * 100}%`,
                      background:
                        enemyHp() / enemy()!.hp > 0.5
                          ? 'linear-gradient(90deg, #22c55e, #84cc16)'
                          : enemyHp() / enemy()!.hp > 0.25
                          ? 'linear-gradient(90deg, #facc15, #f97316)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-blue-100 min-w-[40px] text-right">
                  {enemyHp()}/{enemy()!.hp}
                </span>
              </div>
            </div>

            {/* Player nameplate — bottom-right */}
            <div class="absolute bottom-3 right-4 ff-window px-4 py-2 text-amber-50 min-w-[180px]">
              <div class="font-display text-sm uppercase tracking-wider text-yellow-200">
                jan kama
              </div>
              <div class="text-[10px] uppercase tracking-widest text-blue-200/80 mb-1">
                Lv. 1
              </div>
              <div class="flex items-center gap-2">
                <span class="font-pixel text-[10px] text-blue-100">HP</span>
                <div class="flex-1 h-2 bg-blue-950/80 border border-blue-300/60 rounded-sm overflow-hidden">
                  <div
                    class="h-full transition-all duration-500"
                    style={{
                      width: `${(playerHp() / PLAYER_MAX_HP) * 100}%`,
                      background:
                        playerHp() / PLAYER_MAX_HP > 0.5
                          ? 'linear-gradient(90deg, #22c55e, #84cc16)'
                          : playerHp() / PLAYER_MAX_HP > 0.25
                          ? 'linear-gradient(90deg, #facc15, #f97316)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                    }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-blue-100 min-w-[40px] text-right">
                  {playerHp()}/{PLAYER_MAX_HP}
                </span>
              </div>
            </div>

            {/* Enemy sprite */}
            <div
              class={`absolute left-1/2 top-[40%] ${
                phase() === 'intro'
                  ? 'animate-enemy-enter'
                  : enemyShake()
                  ? 'animate-wiggle'
                  : phase() === 'victory'
                  ? 'animate-victory-glow'
                  : 'animate-idle-breathe'
              }`}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <img
                src={enemy()!.portraitSrc}
                alt={enemy()!.nameEn}
                class="w-44 h-44 object-contain drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]"
                style={{
                  opacity: phase() === 'victory' ? 0.4 : 1,
                  filter: phase() === 'victory' ? 'grayscale(0.6)' : 'none',
                  transition: 'opacity 0.8s ease, filter 0.8s ease',
                }}
              />
              <For each={damagePops().filter((p) => p.target === 'enemy')}>
                {(p) => (
                  <div
                    class="absolute left-1/2 top-1/3 font-display text-4xl animate-damage-pop pointer-events-none"
                    style={{
                      color: p.kind === 'crit' ? '#fde047' : '#fef3c7',
                      'text-shadow':
                        '0 2px 0 #7c2d12, 0 0 8px rgba(0,0,0,0.8), 2px 0 0 #7c2d12, -2px 0 0 #7c2d12',
                    }}
                  >
                    {p.amount}
                  </div>
                )}
              </For>
            </div>

            {/* Player chip */}
            <div
              class={`absolute right-20 bottom-28 w-24 h-24 rounded-full flex items-center justify-center font-sitelen text-4xl shadow-[0_4px_0_rgba(0,0,0,0.4)] ${
                playerShake() ? 'animate-wiggle' : playerLunge() ? 'animate-lunge' : ''
              }`}
              style={{
                background: 'radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 70%, #92400e 100%)',
                color: '#451a03',
                border: '3px solid #fef3c7',
              }}
            >
              jan
              <For each={damagePops().filter((p) => p.target === 'player')}>
                {(p) => (
                  <div
                    class="absolute left-1/2 top-0 font-display text-3xl animate-damage-pop pointer-events-none"
                    style={{
                      color: '#fca5a5',
                      'text-shadow':
                        '0 2px 0 #7f1d1d, 0 0 8px rgba(0,0,0,0.8), 2px 0 0 #7f1d1d, -2px 0 0 #7f1d1d',
                    }}
                  >
                    {p.amount}
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* BOTTOM — FF-style command window */}
          <div class="p-3 bg-gradient-to-b from-blue-950 to-black" style={{ 'min-height': '38%' }}>
            <div class="grid grid-cols-[1fr_auto] gap-3 h-full">
              {/* Left — log / message window */}
              <div class="ff-window px-4 py-3 text-amber-50 flex items-center">
                <div class="font-tile text-base leading-relaxed text-blue-50">
                  {log()}
                </div>
              </div>

              {/* Right — command menu */}
              <Show when={phase() === 'menu'}>
                <div class="ff-window px-2 py-2 text-amber-50 min-w-[220px]">
                  <div class="flex flex-col gap-0.5">
                    <For each={PLAYER_MOVES}>
                      {(m, i) => (
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedMove(i())}
                          onFocus={() => setSelectedMove(i())}
                          onClick={() => usePlayerMove(m)}
                          class={`relative text-left px-3 py-1.5 rounded-sm transition-colors ${
                            selectedMove() === i()
                              ? 'bg-blue-700/60 menu-glint'
                              : 'hover:bg-blue-800/40'
                          }`}
                        >
                          <span
                            class={`inline-block w-3 text-yellow-300 ${
                              selectedMove() === i() ? 'opacity-100' : 'opacity-0'
                            }`}
                          >
                            ▶
                          </span>
                          <span class="font-display text-sm uppercase tracking-wider text-yellow-100">
                            {m.nameEn}
                          </span>
                          <span class="ml-2 text-[10px] text-blue-200/70">
                            {m.nameTp}
                          </span>
                        </button>
                      )}
                    </For>
                    <button
                      type="button"
                      onMouseEnter={() => setSelectedMove(PLAYER_MOVES.length)}
                      onFocus={() => setSelectedMove(PLAYER_MOVES.length)}
                      onClick={run}
                      class={`relative text-left px-3 py-1.5 rounded-sm transition-colors ${
                        selectedMove() === PLAYER_MOVES.length
                          ? 'bg-blue-700/60 menu-glint'
                          : 'hover:bg-blue-800/40'
                      }`}
                    >
                      <span
                        class={`inline-block w-3 text-yellow-300 ${
                          selectedMove() === PLAYER_MOVES.length ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        ▶
                      </span>
                      <span class="font-display text-sm uppercase tracking-wider text-yellow-100">
                        Run
                      </span>
                      <span class="ml-2 text-[10px] text-blue-200/70">weka</span>
                    </button>
                  </div>
                  <Show when={selectedMove() < PLAYER_MOVES.length}>
                    <div class="mt-2 pt-2 border-t border-blue-400/30 text-[10px] text-blue-200 italic px-2">
                      {PLAYER_MOVES[selectedMove()].desc}
                    </div>
                  </Show>
                </div>
              </Show>

              <Show when={phase() === 'intro' || phase() === 'resolving'}>
                <div class="ff-window px-4 py-3 text-amber-50 min-w-[220px] flex items-center justify-center">
                  <span class="font-display text-yellow-200 text-sm uppercase tracking-wider animate-pulse">
                    ···
                  </span>
                </div>
              </Show>

              <Show when={phase() === 'victory'}>
                <div class="ff-window-amber px-4 py-3 text-amber-50 min-w-[220px] flex flex-col items-center justify-center gap-2">
                  <div class="font-display text-xl text-yellow-200 uppercase tracking-wider">
                    Victory!
                  </div>
                  <div class="text-xs text-amber-100 text-center">
                    +{enemy()!.xpReward} XP
                  </div>
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
