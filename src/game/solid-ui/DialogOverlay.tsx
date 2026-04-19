/** @jsxImportSource solid-js */
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { gameBus } from '../GameBus';
import { selectDialog, getNpc } from '../content/loader';
import type { DialogNode, Npc } from '../../content/schema';
import { getSave, setFlag, advanceQuest, addItem } from '../ecs/saveState';
import { giftToParty } from '../scenes/RegionScene';
import { sitelenFor, toSitelenPona } from '../../lib/sitelen';

const TYPE_MS = 22;

/**
 * Declarative dialog overlay.
 *
 * Opens on `dialog:open` with an NPC id, picks the matching dialog node
 * from the current region (flag + quest conditions filter which node
 * fires, priority breaks ties), typewriters through its beats, and on
 * close fires any triggers on the node (set_flag / advance_quest /
 * give_item / add_party).
 *
 * No more hard-coded gate screens — everything the dialog needs to do
 * is declared in the node's `triggers` object in the spine JSON.
 */
export function DialogOverlay() {
  const [node, setNode] = createSignal<DialogNode | null>(null);
  const [npc, setNpc] = createSignal<Npc | null>(null);
  const [beatIndex, setBeatIndex] = createSignal(0);
  const [typed, setTyped] = createSignal(0);
  const [showEn, setShowEn] = createSignal(false);
  let typeTimer: number | undefined;

  const currentBeat = () => {
    const n = node();
    if (!n) return null;
    return n.beats[beatIndex()] ?? null;
  };
  const hasMoreBeats = () => {
    const n = node();
    return !!n && beatIndex() + 1 < n.beats.length;
  };

  createEffect(() => {
    const n = node();
    beatIndex();
    if (typeTimer) clearInterval(typeTimer);
    if (!n) return;
    const beat = currentBeat();
    const text = beat?.text.tp ?? beat?.text.en ?? '';
    setTyped(0);
    typeTimer = window.setInterval(() => {
      setTyped((t) => {
        if (t >= text.length) {
          if (typeTimer) clearInterval(typeTimer);
          return t;
        }
        return t + 1;
      });
    }, TYPE_MS);
  });

  onCleanup(() => {
    if (typeTimer) clearInterval(typeTimer);
  });

  const revealNow = () => {
    const beat = currentBeat();
    if (!beat) return;
    if (typeTimer) clearInterval(typeTimer);
    const text = beat.text.tp ?? beat.text.en;
    setTyped(text.length);
  };

  const isTyping = () => {
    const beat = currentBeat();
    if (!beat) return false;
    const text = beat.text.tp ?? beat.text.en;
    return typed() < text.length;
  };

  onMount(() => {
    const unsub = gameBus.on('dialog:open', ({ npcId }) => {
      const save = getSave();
      const chosen = selectDialog(save.current_region_id, npcId, save.flags, save.quests);
      if (!chosen) return;
      const npcDef = getNpc(save.current_region_id, npcId);
      setNpc(npcDef);
      setBeatIndex(0);
      setShowEn(false);
      setNode(chosen);
    });
    onCleanup(unsub);
  });

  const close = () => {
    const n = node();
    if (n?.triggers) {
      const t = n.triggers;
      if (t.set_flag) {
        for (const [key, value] of Object.entries(t.set_flag)) setFlag(key, value);
      }
      if (t.advance_quest) {
        advanceQuest(t.advance_quest.quest_id, t.advance_quest.stage);
      }
      if (t.give_item) {
        addItem(t.give_item.item_id, t.give_item.count);
        gameBus.emit('toast:show', {
          kind: 'celebration',
          title: `+ ${t.give_item.count} ${t.give_item.item_id}`,
          ttlMs: 2200,
        });
      }
      if (t.add_party) {
        const ok = giftToParty(t.add_party.species_id, t.add_party.level);
        if (ok) {
          gameBus.emit('toast:show', {
            kind: 'celebration',
            title: `+ ${t.add_party.species_id} joined your party`,
            ttlMs: 2800,
          });
        }
      }
    }
    setNode(null);
    setNpc(null);
    gameBus.emit('dialog:close', undefined);
  };

  const advanceOrClose = () => {
    if (isTyping()) {
      revealNow();
      return;
    }
    if (hasMoreBeats()) {
      setBeatIndex(beatIndex() + 1);
      return;
    }
    close();
  };

  const moodColor = (mood: string | undefined) => {
    switch (mood) {
      case 'happy':
        return 'from-pink-400 to-orange-400';
      case 'excited':
        return 'from-yellow-400 to-pink-500';
      case 'sad':
        return 'from-slate-400 to-slate-500';
      case 'thinking':
      default:
        return 'from-indigo-400 to-purple-500';
    }
  };

  return (
    <Show when={node()}>
      {(_) => (
        <div class="absolute inset-0 z-30 flex items-end justify-center pointer-events-none p-3 pb-6">
          <div
            class="relative max-w-md w-full pointer-events-auto animate-in slide-in-from-bottom-4 duration-200"
            style={{
              background: 'linear-gradient(180deg, #fff7e5 0%, #fdeccb 100%)',
              'border-radius': '18px 22px 16px 20px',
              'box-shadow': '0 6px 0 rgba(120,53,15,0.18), 0 14px 30px -8px rgba(0,0,0,0.35)',
              border: '2px solid rgba(180,120,60,0.35)',
            }}
          >
            <div
              class={`absolute -top-3 left-4 px-3 py-0.5 text-white font-display text-xs tracking-wider rounded-full shadow-md bg-gradient-to-r ${moodColor(currentBeat()?.mood)}`}
            >
              {npc()?.name_tp ?? 'speaker'}
            </div>

            <div class="p-4 pt-5 space-y-2.5 cursor-pointer" onClick={advanceOrClose}>
              <Show when={currentBeat()?.glyph}>
                <div class="flex flex-col items-center gap-1 py-2 rounded-xl bg-emerald-50 border-2 border-dashed border-emerald-300">
                  <span class="font-sitelen text-5xl text-emerald-800 leading-none">
                    {sitelenFor(currentBeat()?.glyph ?? '')}
                  </span>
                  <span class="font-tile text-xs text-emerald-900">
                    {currentBeat()?.glyph ?? ''}
                  </span>
                </div>
              </Show>
              <div class="font-sitelen text-3xl text-emerald-800 leading-tight min-h-[1.5em]">
                {toSitelenPona((currentBeat()?.text.tp ?? currentBeat()?.text.en ?? '').slice(0, typed()))}
              </div>
              <div class="font-tile text-base text-amber-900 leading-snug min-h-[1.3em]">
                "{(currentBeat()?.text.tp ?? currentBeat()?.text.en ?? '').slice(0, typed())}
                <Show when={isTyping()}>
                  <span class="inline-block w-0.5 h-[1em] bg-amber-700 ml-0.5 align-middle animate-pulse" />
                </Show>
                <Show when={!isTyping()}>"</Show>
              </div>
              <Show when={showEn() && !isTyping()}>
                <div class="text-sm text-amber-800/70 italic border-l-2 border-amber-400 pl-3 animate-in fade-in duration-200">
                  {currentBeat()?.text.en}
                </div>
              </Show>
              <Show when={(node()?.beats.length ?? 0) > 1}>
                <div class="text-[10px] text-center text-amber-700/60 font-display uppercase tracking-widest">
                  {beatIndex() + 1} / {node()?.beats.length ?? 1}
                </div>
              </Show>
              <div class="flex gap-2 pt-1 items-center">
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setShowEn(!showEn());
                  }}
                  class="flex-1 py-2 rounded-xl bg-amber-50 border-b-[4px] border-amber-300 text-amber-800 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all"
                >
                  {showEn() ? 'hide English' : 'show English'}
                </button>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    advanceOrClose();
                  }}
                  class="flex-1 py-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 border-b-[4px] border-emerald-900 text-amber-50 font-display text-xs uppercase tracking-wide active:border-b-0 active:translate-y-[4px] transition-all relative"
                >
                  {hasMoreBeats() ? 'next' : 'o tawa →'}
                  <Show when={!isTyping()}>
                    <span class="absolute -bottom-1 right-2 text-amber-100 text-xs advance-cursor pointer-events-none">
                      ▼
                    </span>
                  </Show>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
