/**
 * Dialog pool — elder role.
 * Village elders, respected and deeply rooted in community lore.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: recover_heirloom, deliver_message, settle_dispute (common).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const elder: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "elder_g_cl_0_001", role: "elder", context: "greeting", mood: "calm",    levelBand: 0, text: "A young wanderer. The world is full of surprises. Welcome." },
    { id: "elder_g_wm_0_001", role: "elder", context: "greeting", mood: "warm",    levelBand: 0, text: "Come, sit. I don't get many visitors who've seen the outside lately." },
    { id: "elder_g_cu_0_001", role: "elder", context: "greeting", mood: "curious", levelBand: 0, text: "New to the roads? The first season is the hardest." },
    { id: "elder_g_wy_0_001", role: "elder", context: "greeting", mood: "weary",   levelBand: 0, text: "My bones tell me the weather's turning. Come in before it does." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "elder_g_wm_1_001", role: "elder", context: "greeting", mood: "warm",    levelBand: 1, text: "The wanderer grows. I can see it in your eyes. Sit with me." },
    { id: "elder_g_cl_1_001", role: "elder", context: "greeting", mood: "calm",    levelBand: 1, text: "You've been around. The road changes a person. For the better, I'd say." },
    { id: "elder_g_cu_1_001", role: "elder", context: "greeting", mood: "curious", levelBand: 1, text: "What have the younger generations made of the old roads?" },
    { id: "elder_g_wy_1_001", role: "elder", context: "greeting", mood: "weary",   levelBand: 1, text: "A seasoned traveler. Good. Sit. My news-bearer knee acts up." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "elder_g_wm_2_001", role: "elder", context: "greeting", mood: "warm",    levelBand: 2, text: "An experienced wanderer honors my door. Please, come." },
    { id: "elder_g_cl_2_001", role: "elder", context: "greeting", mood: "calm",    levelBand: 2, text: "The world-walker. I've been hoping you'd pass through." },
    { id: "elder_g_cu_2_001", role: "elder", context: "greeting", mood: "curious", levelBand: 2, text: "You've seen things I only read about. Tell me something." },
    { id: "elder_g_wm_2_002", role: "elder", context: "greeting", mood: "warm",    levelBand: 2, text: "Every village should be so lucky as to have a wanderer like you visit." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "elder_g_wm_3_001", role: "elder", context: "greeting", mood: "warm",    levelBand: 3, text: "A legend comes to see an old elder. My day is made." },
    { id: "elder_g_cl_3_001", role: "elder", context: "greeting", mood: "calm",    levelBand: 3, text: "I've outlived most of my stories. Yours, though — yours continue." },
    { id: "elder_g_wy_3_001", role: "elder", context: "greeting", mood: "weary",   levelBand: 3, text: "Old bones, old welcome. The door is always open for you." },
    { id: "elder_g_cu_3_001", role: "elder", context: "greeting", mood: "curious", levelBand: 3, text: "I wonder if you realize what you've built out there. Sit. Let me tell you." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "elder_a_cl_0_001", role: "elder", context: "ambient", mood: "calm",    levelBand: 0, text: "This village stood before I was born. It will stand after I'm gone." },
    { id: "elder_a_wm_0_001", role: "elder", context: "ambient", mood: "warm",    levelBand: 0, text: "When I was young, I wandered too. Then this place pulled me back." },
    { id: "elder_a_cu_0_001", role: "elder", context: "ambient", mood: "curious", levelBand: 0, text: "What drives a young wanderer to keep walking when the road gets hard?" },
    { id: "elder_a_wy_0_001", role: "elder", context: "ambient", mood: "weary",   levelBand: 0, text: "The young think old age is slow. It isn't. It's just quieter." },
    { id: "elder_a_wm_0_002", role: "elder", context: "ambient", mood: "warm",    levelBand: 0, text: "Every creature you catch has a spirit. Treat it well." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "elder_a_cl_1_001", role: "elder", context: "ambient", mood: "calm",    levelBand: 1, text: "The land has a memory. Wander long enough and you'll feel it." },
    { id: "elder_a_wm_1_001", role: "elder", context: "ambient", mood: "warm",    levelBand: 1, text: "You've been making friends along the way. That's the real treasure." },
    { id: "elder_a_cu_1_001", role: "elder", context: "ambient", mood: "curious", levelBand: 1, text: "The {biome_feature} wasn't always as it is now. Older maps show something else." },
    { id: "elder_a_wy_1_001", role: "elder", context: "ambient", mood: "weary",   levelBand: 1, text: "I've seen this village quarrel over the same things for sixty years." },
    { id: "elder_a_wm_1_002", role: "elder", context: "ambient", mood: "warm",    levelBand: 1, text: "The young people here look up to wanderers. You carry more than your pack." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "elder_a_cl_2_001", role: "elder", context: "ambient", mood: "calm",    levelBand: 2, text: "The roads you've walked were footpaths once. Someone paved them — wanderers like you." },
    { id: "elder_a_wm_2_001", role: "elder", context: "ambient", mood: "warm",    levelBand: 2, text: "There's a wisdom that only comes from going far and returning." },
    { id: "elder_a_cu_2_001", role: "elder", context: "ambient", mood: "curious", levelBand: 2, text: "Have you seen the old standing stones near {biome_feature}? I'd like a fresh account." },
    { id: "elder_a_wy_2_001", role: "elder", context: "ambient", mood: "weary",   levelBand: 2, text: "I've made every decision this village needed for forty years. It weighs on you." },
    { id: "elder_a_wm_2_002", role: "elder", context: "ambient", mood: "warm",    levelBand: 2, text: "Stories you bring become part of this place. You don't always know that." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "elder_a_cl_3_001", role: "elder", context: "ambient", mood: "calm",    levelBand: 3, text: "I've watched wanderers come and go my whole life. You're the rarest kind." },
    { id: "elder_a_wm_3_001", role: "elder", context: "ambient", mood: "warm",    levelBand: 3, text: "The world is better for having you in it. I say that without flattery." },
    { id: "elder_a_cu_3_001", role: "elder", context: "ambient", mood: "curious", levelBand: 3, text: "When the time comes to stop wandering, what will you do?" },
    { id: "elder_a_wy_3_001", role: "elder", context: "ambient", mood: "weary",   levelBand: 3, text: "Old age is full of mending things that mattered. You help with that." },
    { id: "elder_a_wm_3_002", role: "elder", context: "ambient", mood: "warm",    levelBand: 3, text: "Some people live lives worth remembering. You're one. Keep going." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "elder_r_cl_0_001", role: "elder", context: "rumor", mood: "calm",    levelBand: 0, text: "Old records show a second settlement once stood near {biome_feature}. Gone now." },
    { id: "elder_r_wm_0_001", role: "elder", context: "rumor", mood: "warm",    levelBand: 0, text: "My grandmother spoke of a {species} that sang at night near {biome_feature}." },
    { id: "elder_r_cu_0_001", role: "elder", context: "rumor", mood: "curious", levelBand: 0, text: "The old maps mark a well near {biome_feature} that no one has found in living memory." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "elder_r_cl_1_001", role: "elder", context: "rumor", mood: "calm",    levelBand: 1, text: "There was a great gathering near {biome_feature} once. The stones still hold the marks." },
    { id: "elder_r_cu_1_001", role: "elder", context: "rumor", mood: "curious", levelBand: 1, text: "I've heard the ridge past {biome_feature} holds ruins no wanderer has named yet." },
    { id: "elder_r_wy_1_001", role: "elder", context: "rumor", mood: "weary",   levelBand: 1, text: "The old road near {biome_feature} was sealed decades ago. For good reason, they said." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "elder_r_cl_2_001", role: "elder", context: "rumor", mood: "calm",    levelBand: 2, text: "These lands were mapped differently before the {biome_feature} flood. What's under there?" },
    { id: "elder_r_cu_2_001", role: "elder", context: "rumor", mood: "curious", levelBand: 2, text: "The migration path of {species} used to pass directly through {biome_feature}. Changed." },
    { id: "elder_r_wm_2_001", role: "elder", context: "rumor", mood: "warm",    levelBand: 2, text: "The grove near {biome_feature} was a sacred site. I feel it's still active somehow." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "elder_r_cl_3_001", role: "elder", context: "rumor", mood: "calm",    levelBand: 3, text: "The deep histories all converge near {biome_feature}. I suspect you already know." },
    { id: "elder_r_cu_3_001", role: "elder", context: "rumor", mood: "curious", levelBand: 3, text: "What happens past {biome_feature} at the solstice? Even the old texts are vague." },
    { id: "elder_r_wm_3_001", role: "elder", context: "rumor", mood: "warm",    levelBand: 3, text: "The rarest {species} is said to come to {biome_feature} only when called by trust." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "elder_co_wm_0_001", role: "elder", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My father's walking stick was taken. It means everything. Could you find it?",   tags: ["cause:recover_heirloom"] },
    { id: "elder_co_cl_0_001", role: "elder", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "A message must reach the elder of the next village before the next full moon.",   tags: ["cause:deliver_message"] },
    { id: "elder_co_cu_0_001", role: "elder", context: "challenge_offer", mood: "curious", levelBand: 0, text: "Two families have been at odds for a season now. Could you hear both sides?",     tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "elder_co_wm_1_001", role: "elder", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "My late wife's ring went missing near {biome_feature}. I cannot go there myself.", tags: ["cause:recover_heirloom"] },
    { id: "elder_co_cl_1_001", role: "elder", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "This decree needs to reach {named_NPC} beyond {biome_feature}. Sensitive matter.",  tags: ["cause:deliver_message"] },
    { id: "elder_co_wy_1_001", role: "elder", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "A dispute over the old mill has gone on too long. Could you arbitrate?",            tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "elder_co_cl_2_001", role: "elder", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "Our village seal was lost near {biome_feature} during the storm. We need it back.", tags: ["cause:recover_heirloom"] },
    { id: "elder_co_wm_2_001", role: "elder", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "A delicate peace agreement must reach {named_NPC}. I trust only you.",               tags: ["cause:deliver_message"] },
    { id: "elder_co_cu_2_001", role: "elder", context: "challenge_offer", mood: "curious", levelBand: 2, text: "Three villages, one argument. I've spent years failing. Could you try?",             tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "elder_co_cl_3_001", role: "elder", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "The founding charter of this village is gone. Without it, we lose the land.",       tags: ["cause:recover_heirloom"] },
    { id: "elder_co_wm_3_001", role: "elder", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "Word from me must reach {named_NPC} before the winter assembly. Life-critical.",    tags: ["cause:deliver_message"] },
    { id: "elder_co_wy_3_001", role: "elder", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "A generations-old feud between two lines. You may be the only outsider they'll hear.", tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "elder_ct_wm_0_001", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "You found it. I didn't dare hope. Thank you, truly.",                   tags: ["cause:recover_heirloom"] },
    { id: "elder_ct_cl_0_001", role: "elder", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "The message was received. Peace is a little more possible now.",          tags: ["cause:deliver_message"] },
    { id: "elder_ct_wm_0_002", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "They came to an agreement. You have patience beyond your years.",         tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "elder_ct_wm_1_001", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "My wife's ring is home. I'll wear it again for the first time in years.", tags: ["cause:recover_heirloom"] },
    { id: "elder_ct_cl_1_001", role: "elder", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "{named_NPC} responded with gratitude. The road ahead is smoother.",       tags: ["cause:deliver_message"] },
    { id: "elder_ct_wy_1_001", role: "elder", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "First handshake between those families in a decade. You managed that.",   tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "elder_ct_wm_2_001", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The seal is back where it belongs. You've secured our future.",            tags: ["cause:recover_heirloom"] },
    { id: "elder_ct_cl_2_001", role: "elder", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "A peace agreement, carried and received without incident. Masterful.",     tags: ["cause:deliver_message"] },
    { id: "elder_ct_cu_2_001", role: "elder", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "Three elders, one accord. You did what councils couldn't. Remarkable.", tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "elder_ct_wm_3_001", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The charter is restored. This village will stand another hundred years.",  tags: ["cause:recover_heirloom"] },
    { id: "elder_ct_cl_3_001", role: "elder", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "A message that could have meant war, delivered as peace. Only you.",       tags: ["cause:deliver_message"] },
    { id: "elder_ct_wm_3_002", role: "elder", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "Generations of bitterness, resolved in one visit. I'll remember this.",    tags: ["cause:settle_dispute"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "elder_ia_wm_0_001", role: "elder", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "It sits right here where it belongs. I sleep easier." },
    { id: "elder_ia_cl_0_001", role: "elder", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "Word came back — the message changed things. Your doing." },
    { id: "elder_ia_wm_0_002", role: "elder", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "They share meals now, those two families. Small miracles." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "elder_ia_cl_1_001", role: "elder", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "The village has been at peace since. Longer than I expected." },
    { id: "elder_ia_wm_1_001", role: "elder", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "I wear the ring every morning now. It reminds me of you." },
    { id: "elder_ia_cu_1_001", role: "elder", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "The young ones ask what it was like before. Better to show them." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "elder_ia_cl_2_001", role: "elder", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "The record books of this village now include your name. Deservedly." },
    { id: "elder_ia_wm_2_001", role: "elder", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "Peace took root here after what you did. Watch it grow someday." },
    { id: "elder_ia_wy_2_001", role: "elder", context: "idle_after_resolve", mood: "weary", levelBand: 2, text: "One thing off my list, thanks to you. Fewer left each year." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "elder_ia_cl_3_001", role: "elder", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "When I am gone, this village will remember what you did. I'll make sure." },
    { id: "elder_ia_wm_3_001", role: "elder", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "The best thing about a long life is occasionally being surprised. You did that." },
    { id: "elder_ia_wy_3_001", role: "elder", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "I've carried that worry for years. You lifted it in a season. Remarkable." },
];
