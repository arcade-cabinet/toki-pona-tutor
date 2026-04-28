/**
 * Dialog pool — fisher role.
 * Fishers found near rivers, lakes, and coasts.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: find_pet, survey (common); fetch_item (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const fisher: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "fisher_g_cl_0_001", role: "fisher", context: "greeting", mood: "calm",    levelBand: 0, text: "Quiet out here, isn't it. You're welcome to sit a while." },
    { id: "fisher_g_wm_0_001", role: "fisher", context: "greeting", mood: "warm",    levelBand: 0, text: "New wanderer! The water's calm today. Good omen." },
    { id: "fisher_g_cu_0_001", role: "fisher", context: "greeting", mood: "curious", levelBand: 0, text: "You heading toward {biome_feature}? Watch for soft mud near the bank." },
    { id: "fisher_g_wy_0_001", role: "fisher", context: "greeting", mood: "weary",   levelBand: 0, text: "Up since dawn. Line's been still. Some days are like that." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "fisher_g_wm_1_001", role: "fisher", context: "greeting", mood: "warm",    levelBand: 1, text: "You're the one they call Rivers? Fitting name for these parts." },
    { id: "fisher_g_cl_1_001", role: "fisher", context: "greeting", mood: "calm",    levelBand: 1, text: "Seen you pass before. The fish barely notice you. That's a good sign." },
    { id: "fisher_g_cu_1_001", role: "fisher", context: "greeting", mood: "curious", levelBand: 1, text: "You been to the upper tributary? I heard there's good spots past the {biome_feature}." },
    { id: "fisher_g_wy_1_001", role: "fisher", context: "greeting", mood: "weary",   levelBand: 1, text: "Storm last night. Still setting tackle back up. Excuse the mess." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "fisher_g_wm_2_001", role: "fisher", context: "greeting", mood: "warm",    levelBand: 2, text: "An experienced wanderer at my favorite spot. High honor." },
    { id: "fisher_g_cl_2_001", role: "fisher", context: "greeting", mood: "calm",    levelBand: 2, text: "Still walking these shores? Good. The water misses familiar faces." },
    { id: "fisher_g_cu_2_001", role: "fisher", context: "greeting", mood: "curious", levelBand: 2, text: "What's the strangest waterway you've crossed?" },
    { id: "fisher_g_wy_2_001", role: "fisher", context: "greeting", mood: "weary",   levelBand: 2, text: "Twenty years on this bank. The good spots change but the peace doesn't." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "fisher_g_wm_3_001", role: "fisher", context: "greeting", mood: "warm",    levelBand: 3, text: "A legend of the roads. Come, the water's fine." },
    { id: "fisher_g_cl_3_001", role: "fisher", context: "greeting", mood: "calm",    levelBand: 3, text: "You've been places that make my fishing hole look small. Sit anyway." },
    { id: "fisher_g_wy_3_001", role: "fisher", context: "greeting", mood: "weary",   levelBand: 3, text: "The roads wear you down eventually. The water always takes you back." },
    { id: "fisher_g_cu_3_001", role: "fisher", context: "greeting", mood: "curious", levelBand: 3, text: "I'd ask where you've been, but I think we'd be here all day." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "fisher_a_cl_0_001", role: "fisher", context: "ambient", mood: "calm",    levelBand: 0, text: "You learn a lot about yourself, waiting for a bite." },
    { id: "fisher_a_wm_0_001", role: "fisher", context: "ambient", mood: "warm",    levelBand: 0, text: "Caught a silver-fin this morning. Beautiful thing. Let it go." },
    { id: "fisher_a_cu_0_001", role: "fisher", context: "ambient", mood: "curious", levelBand: 0, text: "There's something big moving under the {biome_feature} crossing. Never caught it." },
    { id: "fisher_a_wy_0_001", role: "fisher", context: "ambient", mood: "weary",   levelBand: 0, text: "Misty mornings are the hardest. Can't see the line." },
    { id: "fisher_a_wm_0_002", role: "fisher", context: "ambient", mood: "warm",    levelBand: 0, text: "The river sounds different every season. Never gets old." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "fisher_a_cl_1_001", role: "fisher", context: "ambient", mood: "calm",    levelBand: 1, text: "Water level's dropped. Something upstream has changed." },
    { id: "fisher_a_wm_1_001", role: "fisher", context: "ambient", mood: "warm",    levelBand: 1, text: "My father taught me to read the current. Best lesson I ever had." },
    { id: "fisher_a_cu_1_001", role: "fisher", context: "ambient", mood: "curious", levelBand: 1, text: "Strange tracks near the bank. Not anything I recognize." },
    { id: "fisher_a_wy_1_001", role: "fisher", context: "ambient", mood: "weary",   levelBand: 1, text: "Nets snagged twice this week. Something's moved in beneath the rocks." },
    { id: "fisher_a_wm_1_002", role: "fisher", context: "ambient", mood: "warm",    levelBand: 1, text: "The heron comes by every morning. We have an understanding." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "fisher_a_cl_2_001", role: "fisher", context: "ambient", mood: "calm",    levelBand: 2, text: "I mapped every bend of this river years ago. Still surprises me." },
    { id: "fisher_a_wm_2_001", role: "fisher", context: "ambient", mood: "warm",    levelBand: 2, text: "A {species} came to drink at dusk yesterday. Magnificent." },
    { id: "fisher_a_cu_2_001", role: "fisher", context: "ambient", mood: "curious", levelBand: 2, text: "The current carries seeds from far upstream. Who knows what grows there." },
    { id: "fisher_a_wy_2_001", role: "fisher", context: "ambient", mood: "weary",   levelBand: 2, text: "The swamp near {biome_feature} has been restless. Water's murky." },
    { id: "fisher_a_wm_2_002", role: "fisher", context: "ambient", mood: "warm",    levelBand: 2, text: "Best time to fish is just before rain. The whole world holds its breath." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "fisher_a_cl_3_001", role: "fisher", context: "ambient", mood: "calm",    levelBand: 3, text: "Rivers remember everything they've carried. So do I." },
    { id: "fisher_a_wm_3_001", role: "fisher", context: "ambient", mood: "warm",    levelBand: 3, text: "Every wanderer ends up at the water eventually. Something pulls you here." },
    { id: "fisher_a_cu_3_001", role: "fisher", context: "ambient", mood: "curious", levelBand: 3, text: "I heard the deep lake past {biome_feature} has no bottom. Think that's true?" },
    { id: "fisher_a_wy_3_001", role: "fisher", context: "ambient", mood: "weary",   levelBand: 3, text: "Forty seasons on this bank. The river looks the same. I don't." },
    { id: "fisher_a_wm_3_002", role: "fisher", context: "ambient", mood: "warm",    levelBand: 3, text: "The water's always been a good listener. Better than most folk." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "fisher_r_cu_0_001", role: "fisher", context: "rumor", mood: "curious", levelBand: 0, text: "Something under the {biome_feature} crossing splashed my boat last night." },
    { id: "fisher_r_cl_0_001", role: "fisher", context: "rumor", mood: "calm",    levelBand: 0, text: "The old fisher upstream hasn't come by. I hope he's all right." },
    { id: "fisher_r_wm_0_001", role: "fisher", context: "rumor", mood: "warm",    levelBand: 0, text: "They say there's a pool past {biome_feature} that never freezes. Dream spot." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "fisher_r_cu_1_001", role: "fisher", context: "rumor", mood: "curious", levelBand: 1, text: "Water runs red near {biome_feature} after heavy rain. Always wondered why." },
    { id: "fisher_r_wy_1_001", role: "fisher", context: "rumor", mood: "weary",   levelBand: 1, text: "Heard the mill dam near {biome_feature} is crumbling. Whole delta might shift." },
    { id: "fisher_r_wm_1_001", role: "fisher", context: "rumor", mood: "warm",    levelBand: 1, text: "A {species} pod was spotted near {biome_feature} at low tide. Rare this far inland." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "fisher_r_cl_2_001", role: "fisher", context: "rumor", mood: "calm",    levelBand: 2, text: "The river bends past {biome_feature} used to be a village. Flooded long ago." },
    { id: "fisher_r_cu_2_001", role: "fisher", context: "rumor", mood: "curious", levelBand: 2, text: "A net came up full of glowing scales near {biome_feature}. No creature attached." },
    { id: "fisher_r_wy_2_001", role: "fisher", context: "rumor", mood: "weary",   levelBand: 2, text: "Strange current near {biome_feature} that flows backward. Plays havoc with boats." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "fisher_r_cl_3_001", role: "fisher", context: "rumor", mood: "calm",    levelBand: 3, text: "Deep maps show a subterranean waterway beneath {biome_feature}. I believe it." },
    { id: "fisher_r_cu_3_001", role: "fisher", context: "rumor", mood: "curious", levelBand: 3, text: "The oldest fisher I knew claimed something spoke to her from {biome_feature}." },
    { id: "fisher_r_wm_3_001", role: "fisher", context: "rumor", mood: "warm",    levelBand: 3, text: "They say a rare {species} only surfaces at {biome_feature} when the moons align." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "fisher_co_wm_0_001", role: "fisher", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My little otter pup swam off near {biome_feature}. Could you look for her?",   tags: ["cause:find_pet"] },
    { id: "fisher_co_cu_0_001", role: "fisher", context: "challenge_offer", mood: "curious", levelBand: 0, text: "I'd love to know what's in the cove past {biome_feature}. Too far for me now.", tags: ["cause:survey"] },
    { id: "fisher_co_cl_0_001", role: "fisher", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "My good hook got tangled and sank near {biome_feature}. Silly, I know.",        tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "fisher_co_wm_1_001", role: "fisher", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "My old cat followed the current toward {biome_feature}. Please find her.",     tags: ["cause:find_pet"] },
    { id: "fisher_co_cu_1_001", role: "fisher", context: "challenge_offer", mood: "curious", levelBand: 1, text: "Could you map the tributaries past {biome_feature}? I want to know what's out there.", tags: ["cause:survey"] },
    { id: "fisher_co_cl_1_001", role: "fisher", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "I need a specific weight of {item} from the trader near {biome_feature}.",      tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "fisher_co_wm_2_001", role: "fisher", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "My fishing hound ran after a {species} toward {biome_feature}. He's lost.",     tags: ["cause:find_pet"] },
    { id: "fisher_co_cl_2_001", role: "fisher", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "The water near {biome_feature} has been strange. Would you go survey it?",      tags: ["cause:survey"] },
    { id: "fisher_co_cu_2_001", role: "fisher", context: "challenge_offer", mood: "curious", levelBand: 2, text: "I heard there are rare {item} reeds near {biome_feature}. Worth finding out.",  tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "fisher_co_wm_3_001", role: "fisher", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "My old companion the heron hasn't been seen near {biome_feature} in days.",    tags: ["cause:find_pet"] },
    { id: "fisher_co_cl_3_001", role: "fisher", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "The deep channels past {biome_feature} have never been properly surveyed.",      tags: ["cause:survey"] },
    { id: "fisher_co_cu_3_001", role: "fisher", context: "challenge_offer", mood: "curious", levelBand: 3, text: "There's a rare tackle component I need from far past {biome_feature}.",         tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "fisher_ct_wm_0_001", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "She's back! Swimming circles around the dock. She's fine.",             tags: ["cause:find_pet"] },
    { id: "fisher_ct_cu_0_001", role: "fisher", context: "challenge_thanks", mood: "curious", levelBand: 0, text: "Your report changes where I'll cast tomorrow. Wonderful.",            tags: ["cause:survey"] },
    { id: "fisher_ct_cl_0_001", role: "fisher", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "Got my hook back. Sentimental, I know, but it matters.",                tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "fisher_ct_wm_1_001", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "She swam back on her own once she heard my whistle. You led her home.", tags: ["cause:find_pet"] },
    { id: "fisher_ct_cl_1_001", role: "fisher", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "That survey opens up three new spots I'd never have found. Well done.",  tags: ["cause:survey"] },
    { id: "fisher_ct_wm_1_002", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "Quality {item}. Where'd you find that stock? It's perfect.",            tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "fisher_ct_wm_2_001", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "Old loyal hound is back where he belongs. Thank you, truly.",            tags: ["cause:find_pet"] },
    { id: "fisher_ct_cu_2_001", role: "fisher", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "Your survey was thorough. I've got notes for the next ten seasons.", tags: ["cause:survey"] },
    { id: "fisher_ct_cl_2_001", role: "fisher", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "Rare find, that {item}. You've made my whole year.",                     tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "fisher_ct_wm_3_001", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The heron landed on my shoulder this morning. She remembered where home is.", tags: ["cause:find_pet"] },
    { id: "fisher_ct_cl_3_001", role: "fisher", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The most complete survey I've ever held. You're a natural at this.",      tags: ["cause:survey"] },
    { id: "fisher_ct_wm_3_002", role: "fisher", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "I didn't think anyone could find those reeds. You proved me wrong.",      tags: ["cause:fetch_item"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "fisher_ia_wm_0_001", role: "fisher", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "She paddles beside the boat every morning now. You brought her back." },
    { id: "fisher_ia_cl_0_001", role: "fisher", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "New spots to try. The water's been good since your survey." },
    { id: "fisher_ia_cu_0_001", role: "fisher", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "That {biome_feature} is still a mystery to me. But less so now." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "fisher_ia_cl_1_001", role: "fisher", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Best catches in months. Thank the survey, and you." },
    { id: "fisher_ia_wm_1_001", role: "fisher", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "She still fishes beside me. I think she knows you helped find her." },
    { id: "fisher_ia_wy_1_001", role: "fisher", context: "idle_after_resolve", mood: "weary", levelBand: 1, text: "Quiet mornings again. The water feels right." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "fisher_ia_cl_2_001", role: "fisher", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "That map you gave me lives in my tackle box. Never goes anywhere without me." },
    { id: "fisher_ia_wm_2_001", role: "fisher", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "He sleeps on my feet at night. Snores like a wagon wheel." },
    { id: "fisher_ia_cu_2_001", role: "fisher", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "Still thinking about what you found out there near {biome_feature}." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "fisher_ia_cl_3_001", role: "fisher", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The whole river feels different since you helped. Better somehow." },
    { id: "fisher_ia_wm_3_001", role: "fisher", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "My best days on the water, lately. You set them in motion." },
    { id: "fisher_ia_wy_3_001", role: "fisher", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long life on the water. A few good deeds make it worth it." },
];
