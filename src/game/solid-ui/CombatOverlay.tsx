/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { ENEMIES, type EnemyDef, type EnemyMove } from '../combat/enemies';
import { masterWord, addXp } from '../ecs/questState';

type Phase = 'menu' | 'resolving' | 'victory' | 'defeat';

const PLAYER_MAX_HP = 20;
const PLAYER_DEFENSE = 1;
const PLAYER_SPIRIT = 1;

interface PlayerMove extends EnemyMove {}

const PLAYER_MOVES: PlayerMove[] = [
  { id: 'strike', nameTp: 'utala', nameEn: 'Strike', kind: 'physical', damage: 4 },
  { id: 'calm', nameTp: 'pona', nameEn: 'Calm', kind: 'calm', damage: 3 },
  { id: 'focus', nameTp: 'sona', nameEn: 'Focus', kind: 'spirit', damage: 5 },
];

function computeDamage(move: { kind: EnemyMove['kind']; damage: number }, target: {
  defense: number;
  spirit: number;
}): number {
  const resist = move.kind === 'physical' ? target.defense : move.kind === 'calm' ? target.spirit : 0;
  return Math.max(1, move.damage - resist);
}

export function CombatOverlay() {
  const [enemy, setEnemy] = createSignal<EnemyDef | null>(null);
  const [enemyHp, setEnemyHp] = createSignal(0);
  const [playerHp, setPlayerHp] = createSignal(PLAYER_MAX_HP);
  const [phase, setPhase] = createSignal<Phase>('menu');
  const [log, setLog] = createSignal<string>('');
  const [enemyShake, setEnemyShake] = createSignal(false);
  const [playerShake, setPlayerShake] = createSignal(false);

  onMount(() => {
    const unsub = gameBus.on('combat:enter', ({ enemyId }) => {
      const def = ENEMIES[enemyId];
      if (!def) {
        // Defensive: unknown enemy id would freeze the scene. Emit defeat so
        // VillageScene unlocks input and clears the pending encounter.
        console.warn(`[combat] unknown enemy id: ${enemyId}`);
        gameBus.emit('combat:defeat', { enemyId });
        return;
      }
      setEnemy(def);
      setEnemyHp(def.hp);
      setPlayerHp(PLAYER_MAX_HP);
      setPhase('menu');
      setLog(def.flavorEn);
    });
    onCleanup(unsub);
  });

  const enemyTurn = () => {
    const e = enemy();
    if (!e) return;
    const move = e.moves[Math.floor(Math.random() * e.moves.length)];
    const dmg = computeDamage(move, { defense: PLAYER_DEFENSE, spirit: PLAYER_SPIRIT });
    setPlayerShake(true);
    setTimeout(() => setPlayerShake(false), 300);
    const newHp = Math.max(0, playerHp() - dmg);
    setPlayerHp(newHp);
    setLog(`${e.nameTp} used ${move.nameEn} — ${dmg} dmg.`);
    if (newHp === 0) {
      setPhase('defeat');
    } else {
      setPhase('menu');
    }
  };

  const usePlayerMove = (move: PlayerMove) => {
    const e = enemy();
    if (!e || phase() !== 'menu') return;
    setPhase('resolving');
    const dmg = computeDamage(move, { defense: e.defense, spirit: e.spirit });
    setEnemyShake(true);
    setTimeout(() => setEnemyShake(false), 300);
    const newHp = Math.max(0, enemyHp() - dmg);
    setEnemyHp(newHp);
    setLog(`You used ${move.nameEn} — ${dmg} dmg.`);
    if (newHp === 0) {
      setTimeout(() => {
        setPhase('victory');
        for (const w of e.rewardWords) masterWord(w);
        addXp(e.xpReward);
        gameBus.emit('toast:show', {
          kind: 'celebration',
          title: `pona! ${e.nameTp} li lape.`,
          body: `+${e.xpReward} XP · learned ${e.rewardWords.join(', ')}`,
          ttlMs: 3500,
        });
      }, 500);
    } else {
      setTimeout(enemyTurn, 700);
    }
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
          {/* TOP HALF — battle scene */}
          <div
            class="flex-1 relative overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 50% 80%, #3d5a3d 0%, #1e3a2f 70%, #0f1f1a 100%)',
            }}
          >
            {/* Enemy HP bar */}
            <div class="absolute top-3 left-4 bg-amber-50/95 rounded-lg px-3 py-1.5 shadow">
              <div class="font-display text-xs uppercase tracking-wider text-amber-900">
                {enemy()!.nameTp}
              </div>
              <div class="flex items-center gap-2">
                <div class="w-28 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                    style={{ width: `${(enemyHp() / enemy()!.hp) * 100}%` }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-amber-900">
                  {enemyHp()}/{enemy()!.hp}
                </span>
              </div>
            </div>

            {/* Player HP bar */}
            <div class="absolute bottom-3 right-4 bg-amber-50/95 rounded-lg px-3 py-1.5 shadow">
              <div class="font-display text-xs uppercase tracking-wider text-amber-900">
                jan kama
              </div>
              <div class="flex items-center gap-2">
                <div class="w-28 h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{ width: `${(playerHp() / PLAYER_MAX_HP) * 100}%` }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-amber-900">
                  {playerHp()}/{PLAYER_MAX_HP}
                </span>
              </div>
            </div>

            {/* Enemy portrait */}
            <img
              src={enemy()!.portraitSrc}
              alt={enemy()!.nameEn}
              class={`absolute left-1/2 -translate-x-1/2 top-[38%] -translate-y-1/2 w-40 h-40 object-contain drop-shadow-xl ${
                enemyShake() ? 'animate-wiggle' : ''
              }`}
            />

            {/* Player marker (simple emoji/chip — can swap to sprite later) */}
            <div
              class={`absolute right-8 bottom-20 w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-700 flex items-center justify-center font-sitelen text-3xl text-emerald-900 shadow-lg ${
                playerShake() ? 'animate-wiggle' : ''
              }`}
            >
              jan
            </div>
          </div>

          {/* BOTTOM HALF — parchment command pane */}
          <div
            class="p-3 space-y-2 border-t-4 border-amber-700"
            style={{
              background: 'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
              'min-height': '38%',
            }}
          >
            {/* Log */}
            <div class="bg-amber-50/80 border-l-4 border-amber-500 rounded-r px-3 py-2 min-h-[48px]">
              <div class="text-sm text-amber-900">{log()}</div>
            </div>

            <Show when={phase() === 'menu'}>
              <div class="grid grid-cols-2 gap-2">
                <For each={PLAYER_MOVES}>
                  {(m) => (
                    <button
                      type="button"
                      onClick={() => usePlayerMove(m)}
                      class="py-2 px-3 rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-amber-50 border-b-[4px] border-emerald-800 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all text-left"
                    >
                      <div>{m.nameEn}</div>
                      <div class="text-[10px] opacity-80 normal-case tracking-normal">
                        {m.nameTp} · {m.kind}
                      </div>
                    </button>
                  )}
                </For>
                <button
                  type="button"
                  onClick={run}
                  class="py-2 px-3 rounded-xl bg-gradient-to-b from-amber-300 to-amber-500 text-amber-900 border-b-[4px] border-amber-700 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  Run
                  <div class="text-[10px] opacity-80 normal-case tracking-normal">weka</div>
                </button>
              </div>
            </Show>

            <Show when={phase() === 'resolving'}>
              <div class="text-center py-2 font-display text-amber-700">…</div>
            </Show>

            <Show when={phase() === 'victory'}>
              <div class="text-center py-2 space-y-2">
                <div class="font-display text-xl text-emerald-700">pona mute!</div>
                <div class="text-sm text-amber-800">
                  {enemy()!.nameTp} li lape. +{enemy()!.xpReward} XP
                </div>
                <button
                  onClick={close}
                  class="w-full py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-amber-50 border-b-[4px] border-emerald-900 font-display text-sm uppercase tracking-wide"
                >
                  o tawa →
                </button>
              </div>
            </Show>

            <Show when={phase() === 'defeat'}>
              <div class="text-center py-2 space-y-2">
                <div class="font-display text-xl text-red-700">sina pini</div>
                <div class="text-sm text-amber-800">You fell. Try again?</div>
                <button
                  onClick={close}
                  class="w-full py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-amber-50 border-b-[4px] border-amber-700 font-display text-sm uppercase"
                >
                  weka — leave
                </button>
              </div>
            </Show>
          </div>
        </div>
      )}
    </Show>
  );
}
