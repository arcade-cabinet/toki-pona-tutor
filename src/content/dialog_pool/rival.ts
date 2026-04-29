/**
 * Dialog pool — rival role.
 * A fellow wanderer who shows up repeatedly. Competitive but not mean.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Contexts: greeting + ambient only (no challenges per spec).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const rival: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "rival_g_cl_0_001", role: "rival", context: "greeting", mood: "calm",    levelBand: 0, text: "Oh. You again. Small world." },
    { id: "rival_g_wm_0_001", role: "rival", context: "greeting", mood: "warm",    levelBand: 0, text: "Ha! You actually made it this far. Good for you." },
    { id: "rival_g_cu_0_001", role: "rival", context: "greeting", mood: "curious", levelBand: 0, text: "You've got some creatures I haven't seen yet. Where'd you find them?" },
    { id: "rival_g_wy_0_001", role: "rival", context: "greeting", mood: "weary",   levelBand: 0, text: "Rough road. You look about as tired as I feel." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "rival_g_cl_1_001", role: "rival", context: "greeting", mood: "calm",    levelBand: 1, text: "We keep ending up in the same places. Must be something about the roads." },
    { id: "rival_g_wm_1_001", role: "rival", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers! You've gotten better. I'll admit that." },
    { id: "rival_g_cu_1_001", role: "rival", context: "greeting", mood: "curious", levelBand: 1, text: "What's your route been? I'm trying to figure out how you're ahead of me." },
    { id: "rival_g_wy_1_001", role: "rival", context: "greeting", mood: "weary",   levelBand: 1, text: "Ran into something difficult past {biome_feature}. Did you have the same trouble?" },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "rival_g_cl_2_001", role: "rival", context: "greeting", mood: "calm",    levelBand: 2, text: "We've crossed paths enough times I should probably start keeping count." },
    { id: "rival_g_wm_2_001", role: "rival", context: "greeting", mood: "warm",    levelBand: 2, text: "All right, I'll say it — you're impressive. Don't let it go to your head." },
    { id: "rival_g_cu_2_001", role: "rival", context: "greeting", mood: "curious", levelBand: 2, text: "You've been to places I haven't. That irritates me a little." },
    { id: "rival_g_wy_2_001", role: "rival", context: "greeting", mood: "weary",   levelBand: 2, text: "Long roads. We're both still going. That counts for something." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "rival_g_cl_3_001", role: "rival", context: "greeting", mood: "calm",    levelBand: 3, text: "The legend and their rival, meeting again. Classic." },
    { id: "rival_g_wm_3_001", role: "rival", context: "greeting", mood: "warm",    levelBand: 3, text: "You know what? I'm glad it was you who went the furthest. Really." },
    { id: "rival_g_cu_3_001", role: "rival", context: "greeting", mood: "curious", levelBand: 3, text: "We've both been everywhere. What do you think it means?" },
    { id: "rival_g_wy_3_001", role: "rival", context: "greeting", mood: "weary",   levelBand: 3, text: "Still at it after all this time. So am I. We're the same, you and me." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "rival_a_cl_0_001", role: "rival", context: "ambient", mood: "calm",    levelBand: 0, text: "I've caught three {species} this week. What's your count?" },
    { id: "rival_a_wm_0_001", role: "rival", context: "ambient", mood: "warm",    levelBand: 0, text: "I don't hate the competition. Keeps me sharp." },
    { id: "rival_a_cu_0_001", role: "rival", context: "ambient", mood: "curious", levelBand: 0, text: "What's the most useful thing you've learned on the road so far?" },
    { id: "rival_a_wy_0_001", role: "rival", context: "ambient", mood: "weary",   levelBand: 0, text: "My feet are done. But I'll be up and moving before you anyway." },
    { id: "rival_a_wm_0_002", role: "rival", context: "ambient", mood: "warm",    levelBand: 0, text: "Look, you're not bad. Don't tell anyone I said that." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "rival_a_cl_1_001", role: "rival", context: "ambient", mood: "calm",    levelBand: 1, text: "The road past {biome_feature} was my best stretch this season. You?" },
    { id: "rival_a_wm_1_001", role: "rival", context: "ambient", mood: "warm",    levelBand: 1, text: "You've got a {species} I've been trying to find for months. How?" },
    { id: "rival_a_cu_1_001", role: "rival", context: "ambient", mood: "curious", levelBand: 1, text: "I've been to {biome_feature} twice. You've been once and know more. Annoying." },
    { id: "rival_a_wy_1_001", role: "rival", context: "ambient", mood: "weary",   levelBand: 1, text: "This stretch of road tests you. I bet you handled it better than I did." },
    { id: "rival_a_wm_1_002", role: "rival", context: "ambient", mood: "warm",    levelBand: 1, text: "My best creature right now? Yeah, I'll tell you. We're rivals, not enemies." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "rival_a_cl_2_001", role: "rival", context: "ambient", mood: "calm",    levelBand: 2, text: "You and I have been doing this long enough that I notice when you do something new." },
    { id: "rival_a_wm_2_001", role: "rival", context: "ambient", mood: "warm",    levelBand: 2, text: "I've been telling people about you. Competitor's respect. Deserved." },
    { id: "rival_a_cu_2_001", role: "rival", context: "ambient", mood: "curious", levelBand: 2, text: "What's the furthest you've been in one stretch? I'm trying to beat it." },
    { id: "rival_a_wy_2_001", role: "rival", context: "ambient", mood: "weary",   levelBand: 2, text: "Long roads. I think we've covered the same ground in different orders." },
    { id: "rival_a_wm_2_002", role: "rival", context: "ambient", mood: "warm",    levelBand: 2, text: "Look, if you ever need a second on a tough stretch — I've got you. Not that you need it." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "rival_a_cl_3_001", role: "rival", context: "ambient", mood: "calm",    levelBand: 3, text: "I've spent years catching up to you. I think I've accepted the gap." },
    { id: "rival_a_wm_3_001", role: "rival", context: "ambient", mood: "warm",    levelBand: 3, text: "Rivals as long as I can remember. Glad it was with someone worth it." },
    { id: "rival_a_cu_3_001", role: "rival", context: "ambient", mood: "curious", levelBand: 3, text: "Where do you go next? I'll find my own route. Parallel as always." },
    { id: "rival_a_wy_3_001", role: "rival", context: "ambient", mood: "weary",   levelBand: 3, text: "All this road and we're still both going. I find that genuinely inspiring." },
    { id: "rival_a_wm_3_002", role: "rival", context: "ambient", mood: "warm",    levelBand: 3, text: "You're the best. I'm second best. That's a fine life for both of us." },
];
