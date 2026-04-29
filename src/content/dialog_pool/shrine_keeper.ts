/**
 * Dialog pool — shrine_keeper role.
 * Keepers of shrines and sacred sites. Contemplative and gentle.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: guard_spot, recover_heirloom (common); deliver_message (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const shrine_keeper: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "shrine_keeper_g_cl_0_001", role: "shrine_keeper", context: "greeting", mood: "calm",    levelBand: 0, text: "The shrine welcomes all who come in peace." },
    { id: "shrine_keeper_g_wm_0_001", role: "shrine_keeper", context: "greeting", mood: "warm",    levelBand: 0, text: "Welcome. Take a moment if you need one." },
    { id: "shrine_keeper_g_cu_0_001", role: "shrine_keeper", context: "greeting", mood: "curious", levelBand: 0, text: "A wanderer seeking the shrine. What brought you here?" },
    { id: "shrine_keeper_g_wy_0_001", role: "shrine_keeper", context: "greeting", mood: "weary",   levelBand: 0, text: "Long watch tonight. Your arrival is a blessing." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "shrine_keeper_g_cl_1_001", role: "shrine_keeper", context: "greeting", mood: "calm",    levelBand: 1, text: "You return to the shrine. The path here knows your step." },
    { id: "shrine_keeper_g_wm_1_001", role: "shrine_keeper", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers. The shrine has been well since your last visit." },
    { id: "shrine_keeper_g_cu_1_001", role: "shrine_keeper", context: "greeting", mood: "curious", levelBand: 1, text: "What have the roads taught you since we last spoke?" },
    { id: "shrine_keeper_g_wy_1_001", role: "shrine_keeper", context: "greeting", mood: "weary",   levelBand: 1, text: "Quiet week here. Your company breaks the stillness gently." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "shrine_keeper_g_cl_2_001", role: "shrine_keeper", context: "greeting", mood: "calm",    levelBand: 2, text: "An experienced wanderer at the shrine. You carry the road with you." },
    { id: "shrine_keeper_g_wm_2_001", role: "shrine_keeper", context: "greeting", mood: "warm",    levelBand: 2, text: "The shrine feels different when you're here. Stiller, somehow." },
    { id: "shrine_keeper_g_cu_2_001", role: "shrine_keeper", context: "greeting", mood: "curious", levelBand: 2, text: "Do you feel it, coming to places like this after so long on the road?" },
    { id: "shrine_keeper_g_wy_2_001", role: "shrine_keeper", context: "greeting", mood: "weary",   levelBand: 2, text: "Years of keeping. A wanderer of your caliber is always welcome." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "shrine_keeper_g_cl_3_001", role: "shrine_keeper", context: "greeting", mood: "calm",    levelBand: 3, text: "The oldest wanderer on the roads, at the oldest shrine. I'm honored." },
    { id: "shrine_keeper_g_wm_3_001", role: "shrine_keeper", context: "greeting", mood: "warm",    levelBand: 3, text: "Rivers. Even the shrine seems to acknowledge you. Rest here." },
    { id: "shrine_keeper_g_cu_3_001", role: "shrine_keeper", context: "greeting", mood: "curious", levelBand: 3, text: "A life of wandering and you still come to shrines. That tells me much." },
    { id: "shrine_keeper_g_wy_3_001", role: "shrine_keeper", context: "greeting", mood: "weary",   levelBand: 3, text: "Long vigils. Long roads for you. We've both kept faith." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "shrine_keeper_a_cl_0_001", role: "shrine_keeper", context: "ambient", mood: "calm",    levelBand: 0, text: "The shrine has stood for longer than any name for it has existed." },
    { id: "shrine_keeper_a_wm_0_001", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 0, text: "Creatures come here at dusk. They seem to know it's a safe place." },
    { id: "shrine_keeper_a_cu_0_001", role: "shrine_keeper", context: "ambient", mood: "curious", levelBand: 0, text: "Do you feel something when you pass places like this? Most wanderers do." },
    { id: "shrine_keeper_a_wy_0_001", role: "shrine_keeper", context: "ambient", mood: "weary",   levelBand: 0, text: "The vigil candles burn low. The night feels longer lately." },
    { id: "shrine_keeper_a_wm_0_002", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 0, text: "The offering bowl is full today. The village has been generous." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "shrine_keeper_a_cl_1_001", role: "shrine_keeper", context: "ambient", mood: "calm",    levelBand: 1, text: "The shrine near {biome_feature} is a sister site. They share the same origin." },
    { id: "shrine_keeper_a_wm_1_001", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 1, text: "A {species} made its home in the alcove this season. We leave it undisturbed." },
    { id: "shrine_keeper_a_cu_1_001", role: "shrine_keeper", context: "ambient", mood: "curious", levelBand: 1, text: "Has the energy at {biome_feature} changed? I've been sensing something from here." },
    { id: "shrine_keeper_a_wy_1_001", role: "shrine_keeper", context: "ambient", mood: "weary",   levelBand: 1, text: "Keeping a shrine is quiet work. You notice everything. That's its own exhaustion." },
    { id: "shrine_keeper_a_wm_1_002", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 1, text: "Wanderers who stop here always seem to leave a little lighter." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "shrine_keeper_a_cl_2_001", role: "shrine_keeper", context: "ambient", mood: "calm",    levelBand: 2, text: "The old network of shrines was once a road in itself. I'm still mapping it." },
    { id: "shrine_keeper_a_wm_2_001", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 2, text: "I've kept this shrine for twenty years. Each season is different." },
    { id: "shrine_keeper_a_cu_2_001", role: "shrine_keeper", context: "ambient", mood: "curious", levelBand: 2, text: "There are sites past {biome_feature} that no keeper has watched in generations." },
    { id: "shrine_keeper_a_wy_2_001", role: "shrine_keeper", context: "ambient", mood: "weary",   levelBand: 2, text: "The nearest shrine keeper is two days away. We look out for each other." },
    { id: "shrine_keeper_a_wm_2_002", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 2, text: "Each creature that rests here trusts the peace. So do I." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "shrine_keeper_a_cl_3_001", role: "shrine_keeper", context: "ambient", mood: "calm",    levelBand: 3, text: "After all this time, I still don't fully understand what I'm keeping. That's right." },
    { id: "shrine_keeper_a_wm_3_001", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 3, text: "The wanderers who've stopped here over the years — you're among the finest." },
    { id: "shrine_keeper_a_cu_3_001", role: "shrine_keeper", context: "ambient", mood: "curious", levelBand: 3, text: "I wonder if shrines come into being because keepers watch them, or the reverse." },
    { id: "shrine_keeper_a_wy_3_001", role: "shrine_keeper", context: "ambient", mood: "weary",   levelBand: 3, text: "The long watch is its own journey. Just a different kind." },
    { id: "shrine_keeper_a_wm_3_002", role: "shrine_keeper", context: "ambient", mood: "warm",    levelBand: 3, text: "Whatever peace you carry back from here — it's yours to keep." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "shrine_keeper_r_cl_0_001", role: "shrine_keeper", context: "rumor", mood: "calm",    levelBand: 0, text: "There's an untended shrine past {biome_feature}. I worry about it." },
    { id: "shrine_keeper_r_cu_0_001", role: "shrine_keeper", context: "rumor", mood: "curious", levelBand: 0, text: "The creatures near {biome_feature} gather in unusual patterns near dusk." },
    { id: "shrine_keeper_r_wm_0_001", role: "shrine_keeper", context: "rumor", mood: "warm",    levelBand: 0, text: "A {species} was seen resting at the marker stone near {biome_feature}. Rare." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "shrine_keeper_r_cl_1_001", role: "shrine_keeper", context: "rumor", mood: "calm",    levelBand: 1, text: "The old crossing near {biome_feature} was once a ritual path. Still feels sacred." },
    { id: "shrine_keeper_r_cu_1_001", role: "shrine_keeper", context: "rumor", mood: "curious", levelBand: 1, text: "The signal fires near {biome_feature} have been unlit. Something disrupted the keeper." },
    { id: "shrine_keeper_r_wy_1_001", role: "shrine_keeper", context: "rumor", mood: "weary",   levelBand: 1, text: "Three shrines went dark near {biome_feature} last season. I'm still unsettled." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "shrine_keeper_r_cl_2_001", role: "shrine_keeper", context: "rumor", mood: "calm",    levelBand: 2, text: "An ancient shrine near {biome_feature} is said to require a keeper who wanders." },
    { id: "shrine_keeper_r_cu_2_001", role: "shrine_keeper", context: "rumor", mood: "curious", levelBand: 2, text: "The {biome_feature} site hums on certain nights. Not unpleasant. Just present." },
    { id: "shrine_keeper_r_wm_2_001", role: "shrine_keeper", context: "rumor", mood: "warm",    levelBand: 2, text: "A {species} herd shelters near {biome_feature} each season. Peaceful tradition." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "shrine_keeper_r_cl_3_001", role: "shrine_keeper", context: "rumor", mood: "calm",    levelBand: 3, text: "The deepest shrine in the network is supposedly near {biome_feature}. Untouched." },
    { id: "shrine_keeper_r_cu_3_001", role: "shrine_keeper", context: "rumor", mood: "curious", levelBand: 3, text: "What lies at the heart of {biome_feature}? I've dreamed of it." },
    { id: "shrine_keeper_r_wm_3_001", role: "shrine_keeper", context: "rumor", mood: "warm",    levelBand: 3, text: "A rare {species} is said to guard the old shrine near {biome_feature}. Willingly." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "shrine_keeper_co_cl_0_001", role: "shrine_keeper", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "An offering stone was taken from the shrine near {biome_feature}. Could you find it?",   tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_co_wm_0_001", role: "shrine_keeper", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "I need someone to watch the eastern marker tonight. I can't leave here.",                  tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_co_cu_0_001", role: "shrine_keeper", context: "challenge_offer", mood: "curious", levelBand: 0, text: "A message for the keeper at the {biome_feature} shrine — could you carry it?",             tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "shrine_keeper_co_cl_1_001", role: "shrine_keeper", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "The old lantern from this shrine was taken. It's been here generations.",                   tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_co_wm_1_001", role: "shrine_keeper", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "The shrine near {biome_feature} is unguarded and vulnerable. Would you watch it?",          tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_co_cu_1_001", role: "shrine_keeper", context: "challenge_offer", mood: "curious", levelBand: 1, text: "Correspondence for {named_NPC} at the {biome_feature} shrine. Sacred timing.",              tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "shrine_keeper_co_cl_2_001", role: "shrine_keeper", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "A ritual vessel from the old shrine near {biome_feature} has disappeared.",                  tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_co_wm_2_001", role: "shrine_keeper", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "The {biome_feature} shrine will be exposed for three days. I need a trusted guardian.",     tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_co_cu_2_001", role: "shrine_keeper", context: "challenge_offer", mood: "curious", levelBand: 2, text: "A time-sensitive message for {named_NPC} at the deep shrine. Only certain wanderers go.", tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "shrine_keeper_co_cl_3_001", role: "shrine_keeper", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "The founding stone of this shrine has been lost. Without it, the lineage breaks.",           tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_co_wm_3_001", role: "shrine_keeper", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "The deepest shrine near {biome_feature} must not be left unwatched. You'd understand.", tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_co_cu_3_001", role: "shrine_keeper", context: "challenge_offer", mood: "curious", levelBand: 3, text: "A message for {named_NPC} past {biome_feature} — the most sacred correspondence I hold.", tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "shrine_keeper_ct_cl_0_001", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "The stone is back. The shrine feels whole again.",              tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_ct_wm_0_001", role: "shrine_keeper", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "The site was undisturbed all night. I felt it from here. Thank you.", tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_ct_cl_0_002", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "The message was received. The keeper's circle is maintained.",     tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "shrine_keeper_ct_cl_1_001", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "The lantern burns again. Three generations, unbroken.",            tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_ct_wm_1_001", role: "shrine_keeper", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "The shrine held safe. Nothing disturbed it. You have a gift for this.", tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_ct_cu_1_001", role: "shrine_keeper", context: "challenge_thanks", mood: "curious", levelBand: 1, text: "{named_NPC} received the message at the right moment. Gratitude.", tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "shrine_keeper_ct_cl_2_001", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The vessel is returned. The ritual can continue. My relief is immense.", tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_ct_wm_2_001", role: "shrine_keeper", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The shrine was safe the entire time. Your presence held it.",           tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_ct_cl_2_002", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The message reached {named_NPC}. The sacred exchange is complete.",    tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "shrine_keeper_ct_cl_3_001", role: "shrine_keeper", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The founding stone is home. The lineage continues. You saved it.",      tags: ["cause:recover_heirloom"] },
    { id: "shrine_keeper_ct_wm_3_001", role: "shrine_keeper", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The deep shrine was protected. That matters more than I can say.",       tags: ["cause:guard_spot"] },
    { id: "shrine_keeper_ct_cu_3_001", role: "shrine_keeper", context: "challenge_thanks", mood: "curious", levelBand: 3, text: "The most sacred message, delivered perfectly. You understood its weight.", tags: ["cause:deliver_message"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "shrine_keeper_ia_cl_0_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "The shrine rests easier now. As do I." },
    { id: "shrine_keeper_ia_wm_0_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "Creatures are returning to the site. A good sign." },
    { id: "shrine_keeper_ia_cu_0_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "I noticed something in the site after you left. The calm felt different." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "shrine_keeper_ia_cl_1_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "The watch has been undisturbed since. The shrine is quiet and safe." },
    { id: "shrine_keeper_ia_wm_1_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "The keeper's circle holds. Your role in that won't be forgotten." },
    { id: "shrine_keeper_ia_wy_1_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "weary", levelBand: 1, text: "Long vigils. Knowing the shrine is protected changes the weight of them." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "shrine_keeper_ia_cl_2_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "The ritual resumed without interruption. I'm grateful for your part in that." },
    { id: "shrine_keeper_ia_wm_2_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "The site has felt at peace since you watched over it. Genuinely." },
    { id: "shrine_keeper_ia_cu_2_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "I've been meditating on what you did. There's more to you than roads." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "shrine_keeper_ia_cl_3_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The founding stone anchors everything. You restored that. Quietly heroic." },
    { id: "shrine_keeper_ia_wm_3_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "The shrine endures because of you. Wanderers make the world sacred." },
    { id: "shrine_keeper_ia_wy_3_001", role: "shrine_keeper", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long years of keeping. What you did gave them meaning." },
];
