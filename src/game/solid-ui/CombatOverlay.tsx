/** @jsxImportSource solid-js */
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { ENEMIES, type EnemyDef } from '../combat/enemies';
import { classifyDamage, isGrammaticallyValid } from '../combat/grammar';
import { sitelenFor, toSitelenPona } from '../../lib/sitelen';
import { masterWord, addXp } from '../ecs/questState';

const BASE = import.meta.env.BASE_URL;
const TILE = 16;

// Word pool available during combat. Includes the essentials plus creature
// vocab. Later this will be filtered by masteredWords.
const SPELL_BANK = ['mi', 'sina', 'akesi', 'soweli', 'pona', 'wawa', 'lete', 'seli', 'e', 'li', 'wile'];

interface SelectedWord {
  id: string;
  text: string;
}

function framePos(frame: number): string {
  // 12 cols × 11 rows, 0 spacing (we verified this earlier)
  const col = frame % 12;
  const row = Math.floor(frame / 12);
  return `-${col * TILE}px -${row * TILE}px`;
}

export function CombatOverlay() {
  const [enemy, setEnemy] = createSignal<EnemyDef | null>(null);
  const [enemyHp, setEnemyHp] = createSignal(0);
  const [playerHp, setPlayerHp] = createSignal(3);
  const [bank, setBank] = createSignal<SelectedWord[]>([]);
  const [answer, setAnswer] = createSignal<SelectedWord[]>([]);
  const [hintLevel, setHintLevel] = createSignal(0);
  const [feedback, setFeedback] = createSignal<'idle' | 'weak' | 'normal' | 'partial'>('idle');
  const [outcome, setOutcome] = createSignal<'active' | 'victory' | 'defeat'>('active');
  const [enemyShake, setEnemyShake] = createSignal(false);

  onMount(() => {
    const unsub = gameBus.on('combat:enter', ({ enemyId }) => {
      const def = ENEMIES[enemyId];
      if (!def) return;
      setEnemy(def);
      setEnemyHp(def.hp);
      setPlayerHp(3);
      setHintLevel(0);
      setFeedback('idle');
      setOutcome('active');
      setBank(SPELL_BANK.map((text, i) => ({ id: `w${i}-${text}`, text })));
      setAnswer([]);
    });
    onCleanup(unsub);
  });

  const pickFromBank = (w: SelectedWord) => {
    if (outcome() !== 'active') return;
    setBank((prev) => prev.filter((b) => b.id !== w.id));
    setAnswer((prev) => [...prev, w]);
  };
  const returnFromAnswer = (w: SelectedWord) => {
    if (outcome() !== 'active') return;
    setAnswer((prev) => prev.filter((b) => b.id !== w.id));
    setBank((prev) => [...prev, w]);
  };

  const cast = () => {
    const e = enemy();
    if (!e || outcome() !== 'active') return;
    const tokens = answer().map((a) => a.text);
    if (tokens.length === 0) return;

    const tier = classifyDamage(tokens, e.weakPattern);
    const damage = tier === 'weak' ? 2 : tier === 'normal' ? 1 : 0;
    setFeedback(tier);
    setEnemyShake(true);
    setTimeout(() => setEnemyShake(false), 400);

    // Apply damage
    const newHp = Math.max(0, enemyHp() - damage);
    setEnemyHp(newHp);

    // Enemy counter-attack only on partial hits (failed sentences)
    if (tier === 'partial' && newHp > 0) {
      setPlayerHp((hp) => Math.max(0, hp - 1));
    }

    // Resolve outcome
    if (newHp === 0) {
      setOutcome('victory');
      masterWord(e.calmReward);
      addXp(e.xpReward);
      gameBus.emit('toast:show', {
        kind: 'celebration',
        title: `pona! ${e.nameTp} li kama pona.`,
        body: `+${e.xpReward} XP · learned ${e.calmReward}`,
        ttlMs: 3500,
      });
    } else if (playerHp() === 0) {
      setOutcome('defeat');
    }

    // Reset answer tray after a beat for the next spell
    setTimeout(() => {
      if (outcome() === 'active') {
        setAnswer([]);
        setBank(SPELL_BANK.map((text, i) => ({ id: `w${i}-${text}`, text })));
        setFeedback('idle');
      }
    }, 900);
  };

  const showHint = () => {
    setHintLevel((h) => Math.min(h + 1, 3));
  };

  const close = () => {
    const e = enemy();
    setEnemy(null);
    if (outcome() === 'victory' && e) {
      gameBus.emit('combat:victory', { enemyId: e.id });
    } else if (outcome() === 'defeat' && e) {
      gameBus.emit('combat:defeat', { enemyId: e.id });
    }
  };

  return (
    <Show when={enemy()}>
      {(_) => (
        <div class="absolute inset-0 z-40 flex flex-col pointer-events-auto">
          {/* TOP HALF — enemy scene */}
          <div
            class="flex-1 relative overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 50% 80%, #3d5a3d 0%, #1e3a2f 70%, #0f1f1a 100%)',
            }}
          >
            {/* flavor text at top */}
            <div class="absolute top-3 left-4 right-4 bg-amber-50/95 rounded-xl px-3 py-2 shadow-md">
              <div class="font-sitelen text-lg text-emerald-800 leading-tight">
                {toSitelenPona(enemy()!.flavorTp)}
              </div>
              <div class="font-tile text-xs text-amber-900 mt-0.5">
                "{enemy()!.flavorTp}"
              </div>
              <div class="text-[10px] text-amber-700/70 italic mt-0.5">
                {enemy()!.flavorEn}
              </div>
            </div>
            {/* Enemy HP */}
            <div class="absolute top-24 right-4 bg-amber-50/90 rounded-lg px-2.5 py-1 shadow">
              <div class="font-display text-[10px] uppercase tracking-wider text-amber-900">
                {enemy()!.nameTp}
              </div>
              <div class="flex items-center gap-1">
                <div class="w-24 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
                    style={{
                      width: `${(enemyHp() / enemy()!.hp) * 100}%`,
                    }}
                  />
                </div>
                <span class="font-pixel text-[10px] text-amber-900">
                  {enemyHp()}/{enemy()!.hp}
                </span>
              </div>
            </div>
            {/* Enemy sprite — centered, pixel-art */}
            <div
              class={`absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-32 h-32 ${
                enemyShake() ? 'animate-wiggle' : ''
              }`}
              style={{
                'image-rendering': 'pixelated',
                background: `url('${BASE}rpg/tiles/dungeon_packed.png')`,
                'background-position': framePos(enemy()!.spriteFrame),
                'background-size': `${12 * TILE * 8}px auto`,
              }}
            />
            {/* Feedback */}
            <Show when={feedback() !== 'idle'}>
              <div class="absolute top-1/3 left-1/2 -translate-x-1/2 font-display text-3xl animate-points-pop pointer-events-none">
                <span
                  class={
                    feedback() === 'weak'
                      ? 'text-yellow-300 drop-shadow-[0_2px_0_rgba(234,88,12,0.8)]'
                      : feedback() === 'normal'
                      ? 'text-emerald-300 drop-shadow-[0_2px_0_rgba(6,95,70,0.6)]'
                      : 'text-red-400 drop-shadow-[0_2px_0_rgba(127,29,29,0.6)]'
                  }
                >
                  {feedback() === 'weak'
                    ? 'pona mute!'
                    : feedback() === 'normal'
                    ? 'pona.'
                    : 'ike!'}
                </span>
              </div>
            </Show>
          </div>

          {/* BOTTOM HALF — parchment command pane */}
          <div
            class="p-3 space-y-2 border-t-4 border-amber-700"
            style={{
              background: 'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
              'min-height': '44%',
            }}
          >
            {/* Player HP */}
            <div class="flex items-center gap-2">
              <span class="font-display text-[10px] uppercase tracking-wider text-amber-800">
                You
              </span>
              <div class="flex gap-0.5">
                <For each={[0, 1, 2]}>
                  {(i) => (
                    <span class={`text-lg ${i < playerHp() ? 'text-pink-500' : 'text-amber-300'}`}>
                      ♥
                    </span>
                  )}
                </For>
              </div>
              <div class="flex-1" />
              <button
                type="button"
                onClick={showHint}
                class="text-xs text-amber-700 font-display uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 border-b-[3px] border-amber-300 active:border-b-0 active:translate-y-[3px] transition-all"
              >
                ? hint ({3 - hintLevel()})
              </button>
            </div>

            {/* Hint line */}
            <Show when={hintLevel() > 0 && enemy()}>
              <div class="text-xs text-amber-800/80 italic bg-amber-100/60 rounded-lg px-2 py-1 border-l-2 border-amber-400">
                💡 {enemy()!.hintLines[hintLevel() - 1]}
              </div>
            </Show>

            <Show when={outcome() === 'active'}>
              {/* Answer slot */}
              <div class="min-h-[44px] p-1.5 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/80 flex flex-wrap gap-1.5">
                <Show when={answer().length === 0} fallback={null}>
                  <span class="font-tile text-xs text-amber-600/60 m-auto">
                    tap words to build your sentence
                  </span>
                </Show>
                <For each={answer()}>
                  {(w) => (
                    <button
                      type="button"
                      onClick={() => returnFromAnswer(w)}
                      class="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border-b-[3px] border-emerald-400 text-emerald-900 rounded-lg active:border-b-0 active:translate-y-[3px] transition-all"
                    >
                      <span class="font-sitelen text-lg leading-none">{sitelenFor(w.text)}</span>
                      <span class="font-tile text-xs">{w.text}</span>
                    </button>
                  )}
                </For>
              </div>

              {/* Word bank */}
              <div class="flex flex-wrap gap-1.5">
                <For each={bank()}>
                  {(w) => (
                    <button
                      type="button"
                      onClick={() => pickFromBank(w)}
                      class="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border-b-[3px] border-amber-300 text-amber-900 rounded-lg active:border-b-0 active:translate-y-[3px] transition-all"
                    >
                      <span class="font-sitelen text-lg leading-none text-emerald-700">
                        {sitelenFor(w.text)}
                      </span>
                      <span class="font-tile text-xs">{w.text}</span>
                    </button>
                  )}
                </For>
              </div>

              {/* Cast button */}
              <button
                type="button"
                onClick={cast}
                disabled={answer().length === 0}
                class="w-full py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-amber-50 border-b-[4px] border-emerald-900 font-display text-sm uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all disabled:opacity-40"
              >
                toki — speak
              </button>
              <div class="text-[10px] text-amber-700/50 text-center italic">
                {isGrammaticallyValid(answer().map((a) => a.text))
                  ? '✓ grammatically valid'
                  : answer().length > 0
                  ? 'check grammar — order matters'
                  : ''}
              </div>
            </Show>

            <Show when={outcome() === 'victory'}>
              <div class="text-center py-3 space-y-2">
                <div class="font-display text-xl text-emerald-700">pona mute!</div>
                <div class="text-sm text-amber-800">
                  {enemy()!.nameTp} li kama pona. Learned: <b>{enemy()!.calmReward}</b>
                </div>
                <button
                  onClick={close}
                  class="w-full py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-amber-50 border-b-[4px] border-emerald-900 font-display text-sm uppercase tracking-wide"
                >
                  o tawa →
                </button>
              </div>
            </Show>

            <Show when={outcome() === 'defeat'}>
              <div class="text-center py-3 space-y-2">
                <div class="font-display text-xl text-red-700">toki li ike</div>
                <div class="text-sm text-amber-800">
                  The words didn't reach. Try again?
                </div>
                <button
                  onClick={() => {
                    setOutcome('active');
                    setPlayerHp(3);
                    const e = enemy();
                    if (e) setEnemyHp(e.hp);
                  }}
                  class="w-full py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-amber-50 border-b-[4px] border-amber-700 font-display text-sm uppercase"
                >
                  sin (again)
                </button>
                <button
                  onClick={close}
                  class="w-full py-1 text-xs text-amber-700 font-display uppercase"
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
