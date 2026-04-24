---
title: Story Beats (v1 — archived)
updated: 2026-04-24
status: archived
domain: creative
---

> **Archived.** This doc captured the v1 seven-beat finite spine. v2 is open-world with no finite beats — see `docs/DESIGN.md`. Kept for reference.

# Story Beats

The written spine of Rivers Reckoning. Every meso agent authoring a region dossier
reads this document and the region's row in it; every micro agent authoring a single
NPC reads that NPC's row in `cast.json` plus the region's row here.

This bible is **dense on purpose**. Every location has a name that means something,
every character has a history, every sign carries a clue. Generic names are banned —
if you find one in here, flag it.

## Macro — the arc

**The world** is a river-valley county spread across roughly a day's walk north-to-south,
inherited from several generations of uneasy peace between villagers and the wild
companions that rise from old places. The **Rivergate** is a carved stone arch at the
top of the valley where, a long time ago, someone chained a dragon to the source of
the river. The chain is slipping. Nobody above age thirty says so out loud.

**Rivers** is a kid from Riverside Home, the valley's southmost village, who turned
old enough this spring to carry capture pods. Elder Selby's starter ceremony is the
door to the rest of Rivers's life. The adventure happens because Rivers notices things
the adults have trained themselves not to see: odd tracks, fish moving inland, old
songs sung wrong.

**The five beats of the green-dragon reveal** are the backbone. No beat is told to
the player; each is *earned* by the player noticing something at the right time.

| Beat | Region gate | What the player learns | Hook they carry forward |
|---|---|---|---|
| 1. **Seed** | Riverside Home + Greenwood Road | Adults avoid the word "dragon." A single odd track in tall grass is too big to be any known creature. | The `wild-signs` clue. |
| 2. **Rise** | Highridge Pass | The shrine at the top was built to mark *where the chains were forged*. A stone bearing a claw-scar no catalog creature could make. | The `shrine-stones` clue plus the sense that something above is bigger than the creatures Rivers catches. |
| 3. **Turn** | Lakehaven + Frostvale | The fisher-siblings tell Rivers the fish are moving inland because *something upstream is warming the water*. A Frostvale elder tells Rivers point-blank: that's a dragon path. | Explicit confirmation; `dragon-path` clue. |
| 4. **Confront** | Dreadpeak Cavern | The Dreadpeak master is the last of the four wardens who were charged — generations ago — with keeping the chain tight. The four proofs are literal keys to the Rivergate lock. | Inventory check: Rivers now carries all four proofs. |
| 5. **Reckoning** | Rivergate Approach | The chain has already broken. The dragon can be caught, befriended, or defeated — the story recognizes all three. Elder Selby's final letter (delivered by Rook at the Rivergate entrance) reveals that Selby is the fifth warden. | Endgame. |

Every region-level beat contributes to one clue in `src/content/clues.json`. Every
NPC in a region references their regional beat in at least one dialog state.

## The cast — canonical named characters

| ID | Display name | Role | First region | Voice |
|---|---|---|---|---|
| `selby` | Elder Selby | Starter-ceremony giver, fifth warden | Riverside Home | Quiet, careful with words, uses short sentences; never raises their voice. |
| `piper` | Piper | Village friend, orchard-helper quest giver | Riverside Home | Warm, talkative, a year older than Rivers; treats Rivers like a younger sibling. |
| `wren` | Wren | Village well-tender | Riverside Home | Precise, old-fashioned, uses long words; knows every well in the valley. |
| `oren` | Oren | Village carpenter's kid | Riverside Home | Shy, sentences trail off; carries a ribbon Rivers gave them. |
| `fig` | Fig | Village snack-keeper | Riverside Home | Big laugh, always eating, asks Rivers if they're hungry before anything else. |
| `rook` | Rook | Rival, Greenwood Road → every region | Greenwood Road | Competitive but honest, pushes Rivers without malice; pretends not to care about the dragon story but asks about it every time. |
| `loren` | Loren | Lake-village fisher-sage, Lakehaven master's brother | Lakehaven | Soft, observant; reads wind and water. |
| `shopkeep` | Meza | Lakehaven stall-keeper | Lakehaven | Cheerful, keeps a running tab for kids; Rivers can buy from her on credit. |
| `corvin` | Corvin | Forest-route watcher, greenwood-watch quest giver | Greenwood Road | Weathered, brief; speaks like a ranger. |
| `angler` | Joss | Lake fisher, water-edge quest giver | Lakehaven | Shouts from the pier, can't hear very well. |
| `brindle` | Brindle | Frostvale cold-pod keeper | Frostvale | Dry humor, prepared for everything, lost a brother to the mountain once. |
| `cormorant` | Cormorant | Frostvale botanist, snowbird quest giver | Frostvale | Precise, academic, only happy when taking notes. |
| `graym` | Graym | Dreadpeak cave-mapper | Dreadpeak Cavern | Sparse speech, knows the cavern by smell. |
| `ember` | Ember | Dreadpeak torch-keeper | Dreadpeak Cavern | Stern, lived in the cavern longer than anyone; doesn't trust strangers. |
| `moku` | Moku-Pona | Rivergate lodge-keeper | Rivergate Approach | Grave, welcoming; feeds every traveler. |
| `suno` | Suno-Telo | Rivergate watcher, knows the dragon is coming | Rivergate Approach | Whispers, always looking at the water. |
| `kala_lili` | Kala-Lili | Fisher sibling, small | Lakehaven + Rivergate | Excitable, brags about her brother. |
| `kala_suli` | Kala-Suli | Fisher sibling, big | Lakehaven + Rivergate | Quiet, laughs at his sister; throws the biggest nets. |
| `tarrin` | Tarrin | Highridge shrine-keeper, first region master | Highridge Pass | Gentle, patient; teaches Rivers something about stone every line. |
| `marin` | Marin | Lakehaven harbor-master, second region master | Lakehaven | Formal, measured; carries a harbor-master's tally book. |
| `frost` | Frost | Frostvale trial-keeper, third region master | Frostvale | Warm despite the name, keeps soup on a fire in the shrine. |
| `cliff` | Cliff | Dreadpeak warden, fourth region master | Dreadpeak Cavern | Tired, old, speaks in one-line sentences; the last of the four wardens the player meets. |

Roles, voices, and appearances above are binding for all dialog authoring. Any new
NPC added during implementation must be added to this table first.

## Meso — per-region briefs

Each region's brief below tells a meso agent:
- The region's **sense of place** (what it smells/sounds like, what the light is)
- The **story beat** it owns
- The **NPC roster** that should live there (minimum 6-8 speaking characters for
  populated maps, per `docs/RPG_BENCHMARKS.md`)
- The **signs** (minimum 2-3 per map, lore-carrying)
- The **encounter flavor** (which species belong here and why)
- The **master fight** (for gym regions)
- The **quest anchors** (minimum 2 per region, with cross-region payoffs where called out)

### 1. Riverside Home — the green where Rivers was a child

**Sense of place.** South-bank river village. Clay-tile roofs. A cleared grass common
where kids used to learn to walk. Mornings smell like woodsmoke and river silt. The
Great Elm at the east edge of the plot has names carved into it going back five
generations. Rivers's own name is there. So is Selby's.

**Beat this region owns.** *Seed.* Rivers is a child on the first day of not being
a child. The adults show their unease through absences and deflections — Selby never
quite says "dragon."

**Sense of scale.** The starter village is the smallest region; that's correct. But
even a small village has 7 named residents (Pokémon's Pallet Town benchmark). Fill
the map.

**NPC roster** (7 speaking):
- **selby** — Elder, starter-ceremony. Multi-state dialog: pre-ceremony, post-starter,
  post-first-gym, post-clear. The post-clear line references being the fifth warden.
- **piper** — Orchard-helper quest giver (catch an Applepup). Reminisces about Rivers
  as a toddler.
- **wren** — Well-tender. Tells Rivers the well has four stones laid by the four
  valley wardens — first mention of "wardens" in the game.
- **oren** — Shy kid by the Great Elm. Hands Rivers a ribbon "in case you need to
  remember home." (Future flag the ribbon as a returnable item.)
- **fig** — Snack keeper. Can sell Rivers an orchard_fruit for a trail_token even
  pre-starter (never wants Rivers to leave hungry).
- **briar** — NEW. The village's eldest dog-handler; sells a capture_pod at the
  shop-stall in exchange for one quest completion. Tells a long rambling story about
  the dragon that every adult tries to shush.
- **mira** — NEW. Rivers's parent. Waves goodbye from the porch of the family house
  and says, literally, "Come back to me." No mechanical function.

**Signs** (3):
- At the spawn point: **RIVERSIDE HOME** / *Where the river remembers your name.*
- At the Great Elm: **THE NAMES** / *Carved here since the first warden. Read them.*
- At the east exit: **GREENWOOD ROAD** / *East out of the village. First rook east of
  the elm.*

**Encounter flavor.** None in the village itself. Tall grass on the east edge (where
greenwood_road begins) carries Applepup, Mirthcat, Songbird, Bramble Imp — all
kasi/grass-type commons that prove the catch mechanic at L3-5.

**Master fight.** None.

**Quest anchors** (2):
- *Orchard Helper* (Piper). Catch an Applepup. Cross-region payoff: later in Lakehaven
  Piper's cousin Joss mentions Piper's recipe.
- *Safe House* (Oren). Catch a Reedfrog (found in Lakehaven's pond). Cross-region
  payoff: forces the player to return to Riverside Home after Lakehaven, which is
  where Selby starts dropping warden lines.

### 2. Greenwood Road — the long green between home and the mountain

**Sense of place.** Old trade route, flanked by Fan-tasy forest. Tall grass in three
distinct clumps. A wooden footbridge over a dry creek. Light filters through leaves
the same color as the valley's old flag. At the east end a stone marker reads
*HIGHRIDGE PASS, NORTH-EAST.*

**Beat this region owns.** *Seed continues.* Rook catches up to Rivers here. The
first odd track in tall grass is found.

**NPC roster** (6 speaking):
- **rook** — Rival. First appearance. Multi-state: pre-defeat (challenges Rivers),
  post-defeat (concedes, warns Rivers about Highridge), post-first-gym, post-second-gym,
  post-clear (Rivergate entrance).
- **corvin** — Route watcher at the west end. Quest: Greenwood Watch (beat Rook).
  Mentions "odd tracks" in the third tall-grass clump — seeds the wild-signs clue.
- **ansel** — NEW. Route walker, coming south. Tells Rivers about the Highridge master
  Tarrin: "They teach. They don't hurt." A friendly NPC, nothing to catch, pure lore.
- **brin** — NEW. Apple cart on the bridge. Sells orchard_fruit at Riverside prices
  (discount). Comments that "the fruits are smaller this year — something upstream is
  thirsty."
- **jan_poki_tomo** → renamed **pod-kid**; a younger kid playing with a capture pod.
  Quest: Field Notes (catch two commons, learn to read tracks).
- **jan_kili_tomo** → renamed **snack-helper**; fig's sibling, lost. Rivers finds them
  in the tall grass; no quest, just flavor.

**Signs** (3):
- West end: **GREENWOOD ROAD** / *Slow walkers welcome. Fast ones too.*
- At the bridge: **BRIDGE OUT IN WINTER** / *Use the north ford when the ice comes.*
- East end: **HIGHRIDGE PASS AHEAD** / *The wind hits harder above the second switchback.*

**Encounter flavor.** Grass-type commons at L3-7: Applepup, Bramble Imp, Thornling,
Mirthcat, Mudgrub, Nightjar, Burrowmole, Mistfox, Bog Wisp, Songbird, Vine Adder,
Hillbuck. Each is either rodent/forest flavor or shadow-edge flavor. No
elementally-odd species here.

**Master fight.** None; Rook is a rival, not a master.

**Quest anchors** (3):
- *Greenwood Watch* (corvin). Beat Rook. XP + trail_token.
- *Field Notes* (pod-kid). Catch two Greenwood commons. Reward: one capture_pod, and
  the pod-kid gives Rivers the `wild-signs` clue.
- *Wild Signs* (corvin, second visit). Return with two captured greenwood commons to
  confirm the tracks Rivers saw. Reward: `wild-signs` clue row matures; corvin says
  the Highridge shrine has a stone that matches.

### 3. Highridge Pass — the shrine at the top of the wind

**Sense of place.** Stone switchbacks climbing a grass-over-granite ridge. The wind
gets audible on the third switchback. Small shrine at the top: four stones in a
square, with a fifth in the middle that's cracked. Tarrin lives in a cut-stone hut
beside the shrine, alone. Crows overhead. Sun washes everything gold at the top.

**Beat this region owns.** *Rise.* Rivers finds a claw-scar on the cracked shrine
stone that matches the "odd tracks" from Greenwood. Tarrin, when asked, says only
"That stone has been cracked since before I was a warden."

**NPC roster** (6 speaking — previously zero):
- **tarrin** — Highridge master. Multi-state dialog: pre-fight (teaches about
  stone-type creatures), post-fight (grants badge_highridge + highridge-proof clue),
  post-second-gym (asks after the fishers), post-clear.
- **breeze** — NEW. Route walker at the second switchback; warns Rivers about the
  wind. Short, practical.
- **stoneminder** — NEW. Quiet old person who carves names into the shrine stones
  for a small fee; hints at the "four wardens" tradition; offers to carve Rivers's
  name for free once they hold one proof.
- **hiker** — NEW. A lost hiker — quest anchor for Lost Hiker. Asks Rivers to carry
  a trail-token-marker down the east path to Loren in Lakehaven.
- **ansel** — Reappears from Greenwood (heading north this time). Reactive dialog
  referencing the player's catches.
- **shrine-kid** — NEW. Tarrin's apprentice. Runs between the huts delivering
  messages. Tells Rivers what the cracked stone means ("We don't know. Tarrin
  doesn't know either.") — **key seed** for the dragon mystery.

**Signs** (4):
- First switchback: **HIGHRIDGE PASS** / *Three switchbacks. Take them slow.*
- At the wind-line: **FEEL THE WIND** / *It's the mountain breathing.*
- At the shrine: **THE FIRST STONE** / *One of four, laid by the first wardens.*
- At the cracked stone: (NO LABEL) — the sign itself is absent, making the cracked
  stone the story-loudest object on the map.

**Encounter flavor.** Stone/rock-type + early frost at L6-9: Pebbleback, Chainback,
Stoneclaw, Mire Brute, Quartz Shell, Twiglet, Drowsy Owl, Ember Adder, Snowhare. Why:
the pass is the transition between forest (kasi) and mountain (wawa/lete) biomes.

**Master fight.** tarrin at the shrine. Stone-type team. Teaches Rivers that type
matchup matters (their stone beats Rivers's grass starter; Rivers has to lean on a
water companion caught in Greenwood).

**Quest anchors** (3):
- *Shrine Stones* (stoneminder). Catch two Pebblebacks. Reward: a heavy_capture_pod,
  and stoneminder carves Rivers's name into the shrine — a **visible diegetic
  reward** showing up in sign text after the quest.
- *Lost Hiker* (hiker). Cross-region delivery of a marker to Loren. Opens Lakehaven's
  Loren dialog earlier than the master-fight path would.
- *Cracked Stone* (tarrin, post-fight only). Tarrin asks Rivers to bring back the
  second region's proof and lay it beside the cracked stone. This ties into the
  turn-beat by making the player SEE that the four proofs belong on the stones.

### 4. Lakehaven — the lake and the fishers

**Sense of place.** A small stone island in the center of a round lake, reached by a
pier. Water everywhere. Lamp-lit even at noon because the fog never fully burns off.
The stall at the pier smells like fresh fish and spring_tonic herbs. Reed beds on
the shore host Reedfrogs.

**Beat this region owns.** *Turn begins.* The fisher-siblings Kala-Lili and
Kala-Suli tell Rivers the fish have been moving inland. Marin, the Lakehaven master,
grants badge_lakehaven and writes Rivers a letter for Frost in Frostvale about
"something moving the water."

**NPC roster** (8 speaking — previously 5, need to add 3):
- **marin** — Lakehaven master. Multi-state: pre-fight (reads weather), post-fight
  (grants badge_lakehaven + lakehaven-proof + a sealed letter to Frost),
  post-third-gym, post-clear.
- **loren** — Fisher-sage. Multi-state: pre-hiker (waits on the pier), post-hiker
  (warmer dialog after Rivers delivers the trail-token marker), post-second-gym
  (reveals he is Marin's brother), post-clear.
- **shopkeep (Meza)** — Stall keeper. Inventory: capture_pod 2, orchard_fruit 1,
  spring_tonic 3, heavy_capture_pod 5. Multi-state: greeting, Rivers-is-low-on-coin
  variant, post-first-purchase thank-you, post-clear.
- **angler (Joss)** — Fisher on the pier; quest giver for Water Edge. Hard of hearing,
  so his dialog repeats phrases ("what did you say? — the frogs, the frogs in the
  reeds").
- **kala_lili** — Small fisher. Enthusiastic, tells Rivers about her brother (below)
  and the fish moving inland.
- **kala_suli** — Big fisher. Quiet, laughs at his sister. Confirms the fish story
  when pressed.
- **piper_cousin** — NEW. Piper's cousin. References Piper's recipe — the Orchard
  Helper cross-region payoff. Sells Rivers a cheap orchard_fruit variant.
- **lodge-keeper** — NEW. Runs the small lodge at the lake's north edge. Lets Rivers
  "rest" (heals party) for one trail_token. Name them.

**Signs** (3):
- At the pier: **LAKEHAVEN** / *Built on the oldest stone in the valley.*
- At the shop: **MEZA'S STALL** / *Fish bought here. Tokens only.*
- At the north dock: **FERRY NORTH** / *Winter only. Walk the ice when it holds.*

**Encounter flavor.** Water-type commons + reed-edge grass at L10-14: Reedfrog,
Bluefin, Snapper, Riverfin, Mudgrub (reed edges), Mireling (rare, deep water),
Bramble Imp (reed banks). Introduce water combat. Introduce the elemental triangle
— Rivers's grass starter is now a *disadvantage* against Marin.

**Master fight.** marin on the pier. Positional combat; narrow space. Multi-phase
reveal (she has a heavy Mireling in phase 2).

**Quest anchors** (3):
- *Lake Delivery* (shopkeep). Deliver an orchard_fruit to loren at the pier. Easy
  intro quest for the region.
- *Water Edge* (angler). Catch two reed-edge creatures. Reward: spring_tonic.
- *Cold Hands* (loren, post-master only). Cross-region prep: loren gives Rivers a
  wind-braid (a flavor item) that Brindle in Frostvale will recognize, unlocking
  Frostvale's cold_hands quest.

### 5. Frostvale — the snowfield and the warmth in the shrine

**Sense of place.** Snow-covered village with timber houses on stilts. Smoke from
every chimney. A fenced herb garden against the north wall still growing in the snow,
tended by Cormorant. Frost's trial-shrine is heated from inside; when Rivers walks in,
steam blooms off their clothes. The Frostvale master has a pot of soup on a stone
brazier and offers Rivers a bowl before the fight.

**Beat this region owns.** *Turn continues.* Frost, reading marin's letter, tells
Rivers directly: "That's a dragon path. They don't walk these in peace." The first
time in the game the word *dragon* is spoken aloud.

**NPC roster** (7 speaking — previously zero):
- **frost** — Frostvale master. Multi-state: pre-fight (reads the letter, names the
  dragon), post-fight (grants badge_frostvale + frostvale-proof + a lantern called
  "Last Light" — usable in Dreadpeak), post-fourth-gym, post-clear.
- **brindle** — Cold-pod keeper. Quest: Cold Hands. Multi-state: greeting, post-Cold-
  Hands (warmer), post-Frost fight (grateful), post-clear.
- **cormorant** — Botanist at the herb garden. Quest: Snowbird Sighting. Multi-state:
  pre-sighting, post-sighting, post-clear.
- **snow-kid** — NEW. Kid sledging near the herb garden. Pure flavor, tells Rivers
  "Dad said the old dragon story is real this year."
- **ember** — NEW first appearance (full arc in Dreadpeak). Traveling through.
  Foreshadows Dreadpeak: "The cavern is colder than this. Bring a light."
- **frost-uncle** — NEW. An elder on the village bench. Tells Rivers the old warden
  story if they sit on the bench — the FIRST place in the game that the four-warden
  system is explained in full.
- **lost-bird** — NEW (not technically an NPC but a named encounter). A wounded
  Snowbird NPC near the garden; the Snowbird Sighting quest ends with Rivers choosing
  to help it. Pure character flavor.

**Signs** (3):
- At the village gate: **FROSTVALE** / *Warmth kept here since the cold came down.*
- At the herb garden: **COLD GARDEN** / *Some plants only grow in winter.*
- At the shrine: **TRIAL OF FROST** / *Warm yourself before the bell rings.*

**Encounter flavor.** Frost/ice commons + stone at L15-20: Frostcoil, Quartz Shell,
Nightspike, Snowbird, Hillbuck, Pebbleback, Glacier Talon, Drowsy Owl. Introduce
frost-status interactions (water-wet enemies take bonus frost damage).

**Master fight.** frost at the shrine. Ice-type team. Multi-phase (frost's phase 2
Nightspike is the hardest fight in the pre-endgame game).

**Quest anchors** (3):
- *Cold Hands* (brindle). Catch two Frostvale commons. Reward: a warm-weather gear
  flavor item that unlocks a free spring_tonic at brindle's shop.
- *Snowbird Sighting* (cormorant). Catch one Snowbird. Reward: cormorant writes
  Rivers a recommendation letter to the Dreadpeak warden, letting Rivers skip the
  cave's first encounter wall.
- *Warden Story* (frost-uncle, post-master only). Rivers sits on the bench and
  frost-uncle tells the full story of the four wardens. No mechanical reward —
  instead, the player can now read the shrine stones at Highridge and see four
  names they couldn't see before. (Trigger a sign-text update on Highridge's shrine
  after this quest.)

### 6. Dreadpeak Cavern — the cavern and the warden's watch

**Sense of place.** Dark cavern with torchlight pools. Cold, but different from
Frostvale — wet cold, not dry. Drip-echoes. The floor is stone but every few steps
there's a deeper stone, polished, set in a pattern. At the final chamber, cliff sits
on a stone bench facing the entrance, waiting.

**Beat this region owns.** *Confront.* cliff, the last of the four valley wardens,
tells Rivers the whole story. The four proofs are literal keys. The Rivergate lock
is a stone door at the Rivergate Approach, and the four shrine-stones in Highridge's
shrine mirror it.

**NPC roster** (6 speaking — previously zero):
- **cliff** — Dreadpeak master, fourth warden. Multi-state: pre-fight (tests Rivers's
  resolve), post-fight (grants badge_dreadpeak + dreadpeak-proof + tells the full
  warden story + points at the Rivergate approach), post-final-boss, post-clear.
- **graym** — Cave-mapper at the cavern entrance. Draws a chalk map for Rivers;
  warns them to pay attention to the polished stones. Quest: Torch Path Survey.
- **ember** — Reappears from Frostvale, now at her home post: Dreadpeak torch-keeper.
  Relights the player's lantern for free. Quest: Cave Shadow.
- **cave-kid** — NEW. A kid sneaking in despite warnings. Wants to fight a Stoneclaw.
  Rivers can either tell them to go home (get a ribbon) or help them catch a safe
  mudgrub. Pure character.
- **torch-bearer** — NEW. Cliff's apprentice, tends the braziers. Tells Rivers to
  mind the polished stones — first hint at the "four keys" mechanic.
- **warden-ghost** — NEW. A carved stone effigy that speaks ONCE, when Rivers stands
  before the final chamber carrying all four proofs. It's the third warden (long
  dead). "Take the four. Open the gate. End this." Single beat; flavor-only.

**Signs** (4):
- At the cavern mouth: **DREADPEAK CAVERN** / *Mind the torches. Mind the stones.*
- At a torch junction: **NORTH PATH — FINAL CHAMBER / SOUTH PATH — LOOPS BACK**.
- At a polished stone: **THE FOURTH STONE** / *One of four. The shrine is twelve
  paces off.* (Meta reference to Highridge — a careful player realizes the Highridge
  shrine and the Dreadpeak cavern are *the same four-stone layout*.)
- At cliff's chamber: (NO LABEL) — as at Highridge, the absence is the loudest sign.

**Encounter flavor.** Heavy elites + cave flavor at L22-28: Mountain Bear, Warback,
Stoneclaw, Fangrunner, Glacier Talon, Coalbeak, Raven Shade, Snowhare, Foxhound,
Boulderhorn, Iron Wraith. Density is the highest in the game. Encounter rate bumps.

**Master fight.** cliff in the final chamber. Stone + shadow team. Multi-phase; his
phase 2 Iron Wraith is the hardest non-endgame fight in the game.

**Quest anchors** (3):
- *Torch Path Survey* (graym). Catch two cave commons while walking the torch path.
  Reward: a map of the cavern + a heavy_capture_pod.
- *Cave Shadow* (ember). Catch two more cave creatures past the torch path. Reward:
  Last Light lantern upgrade (longer burn time).
- *The Four Keys* (cliff, post-fight only). Rivers must carry all four proofs to
  the Rivergate Approach. This is the proof-check that gates the endgame; narrative
  purpose.

### 7. Rivergate Approach — the chain and the dragon

**Sense of place.** Long riverside route. Wild at the west bank: tall reeds, shallow
pools. A deep-water channel threads east-to-west, and a sandbar path crosses it. At
the north end, the Rivergate — a stone arch carved with the shapes of the four
wardens' stones. The arch *hums*. Rivers can feel it in their teeth.

**Beat this region owns.** *Reckoning.* Rook meets Rivers at the entrance, gives
them Selby's final letter (revealing Selby is the fifth warden), and stays behind —
"This is your reckoning, not mine." The green dragon is at the gate. The chain is
broken. Rivers can fight, catch, or simply walk up and the dragon will let them.

**NPC roster** (6 speaking — previously 5):
- **rook** — Final appearance at the south entrance. Multi-state: pre-entrance
  (challenges Rivers one last time), post-entrance-walk (hands over the letter),
  post-final-boss, post-clear.
- **moku** — Lodge-keeper at the south end. Heals Rivers; cooks soup. Multi-state
  around the final-boss flag.
- **suno** — Watcher. Whispers. Tells Rivers the chain snapped "three nights ago,
  I heard it go in my bones."
- **kala_lili** — Reappears. Fishing on the bank. She is terrified; her brother
  isn't here. This is the only time she's afraid in the game.
- **kala_suli** — Found at the deep-water channel, trying to catch the dragon with
  a line. Embarrassed when Rivers arrives. Funny beat — the only humor in the
  final region.
- **green_dragon** — The final boss. Not strictly an NPC but has dialog when
  Rivers approaches carrying all four proofs: *"You're the fifth one. I was
  waiting."*

**Signs** (3):
- At the south entrance: **RIVERGATE APPROACH** / *Beyond here is the source.*
- At the sandbar: **DEEP WATER — USE THE SANDBAR** / *The current above the lock
  is stronger than it looks.*
- At the arch itself: **THE RIVERGATE** / *Four stones make a door. The door
  waits.*

**Encounter flavor.** Endgame mixes at L7-13 (spread intentional — the player may
arrive over-leveled): Bog Wisp, Ashcat, Mireling, Bluefin, Snapper, Reedfrog, Iron
Wraith (rare), Riverfin, Cinderling (rare), Marshjaw (rare legendary), Green Dragon
(set-piece final catch — NOT a random encounter).

**Master fight.** green_dragon at the Rivergate. Multi-phase with a unique defeat
animation. Capture-rate math supports catching.

**Quest anchors** (3):
- *Last Light* (carried over from Frostvale). Plant the lantern at the sandbar
  marker to light the trail to the arch.
- *Companion Bond* (moku). Catch one river creature to fill the party before
  the final fight. Reward: party heal + free soup.
- *Selby's Letter* (rook, at the entrance). Read the letter; it tells Rivers that
  Selby is the fifth warden and the decision — fight, catch, or walk — is Rivers's
  alone. This is **the** key narrative beat of the game.

## Sign inventory — global pass

Target **minimum 20 signs across the valley**. Current game: ~0. Signs are the
cheapest, highest-leverage density lift. Every map spec should add 2-3 signs
per the per-region briefs above.

## Named-encounter inventory

Certain creatures have diegetic names when encountered:
- **green_dragon** at Rivergate: named *Avere* by Selby in the final letter.
- **iron_wraith** when encountered in Dreadpeak: named after the warden-ghost's
  dead companion.
- **marshjaw** legendary at Rivergate: named *the Reedgate Jaw* by Kala-Suli.

No other named encounters for v1.

## Dialog-state coverage checklist

Every non-filler NPC MUST have at minimum these dialog states:
1. **First-meet** (pre-quest-or-fight)
2. **Post-starter** (after badges_all_four is empty but starter_chosen present)
3. **Post-region-gym** (after the region's master is defeated)
4. **Post-clear** (after game_cleared)

Fillers (nameless kids, route walkers) get a single state. The roster tables in
per-region briefs above mark which.

## Word budget target

For **Option A** density (see RPG_BENCHMARKS.md):
- Populated map: ≥200 words of dialog (match Pokémon town baseline)
- Route map: ≥100 words
- Master region: ≥300 words (master dialog drives region beat)

Total target for the valley: **~1,800 words of dialog**, plus **~400 words of sign
copy**, plus **~300 words of refreshed flavor text in ui.json/journey.json**.

Current: ~3,200 words across ALL narrative JSON. Option A target: ~5,000 words.
(~55% increase. A meaningful lift but shippable in 2-3 weeks by parallel agents.)

## Implementation handoff

After this bible is approved, the next work items are:
1. Build `src/content/regions/` scaffolding and Zod schemas (macro structure).
2. Migrate `riverside_home` as proof-of-concept — one dossier, existing tests still
   green.
3. Spawn 6 meso agents (sonnet) in parallel for the remaining 6 regions.
4. Spawn micro agents (haiku) per region for individual NPC dialog-state authoring.
5. Ship content expansion PR matching this bible.
