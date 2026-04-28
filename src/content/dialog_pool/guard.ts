/**
 * Dialog pool — guard role.
 * Guards at village gates, roads, and outposts.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: defeat_threat, escort (common); guard_spot (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const guard: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "guard_g_cl_0_001", role: "guard", context: "greeting", mood: "calm",    levelBand: 0, text: "State your business. Peaceable folk are welcome here." },
    { id: "guard_g_wm_0_001", role: "guard", context: "greeting", mood: "warm",    levelBand: 0, text: "Traveler! You made it in one piece. Road can be rough." },
    { id: "guard_g_wy_0_001", role: "guard", context: "greeting", mood: "weary",   levelBand: 0, text: "Long shift. Come through, you're fine." },
    { id: "guard_g_cu_0_001", role: "guard", context: "greeting", mood: "curious", levelBand: 0, text: "Wanderer? What's it like out there past the ridge?" },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "guard_g_cl_1_001", role: "guard", context: "greeting", mood: "calm",    levelBand: 1, text: "Ah, Rivers. The gate's always open for you." },
    { id: "guard_g_wm_1_001", role: "guard", context: "greeting", mood: "warm",    levelBand: 1, text: "Welcome back. Heard good things about you from the last village." },
    { id: "guard_g_wy_1_001", role: "guard", context: "greeting", mood: "weary",   levelBand: 1, text: "Another night, another post. Good to see a familiar wanderer." },
    { id: "guard_g_cu_1_001", role: "guard", context: "greeting", mood: "curious", levelBand: 1, text: "Any trouble on the roads south? We've had reports." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "guard_g_wm_2_001", role: "guard", context: "greeting", mood: "warm",    levelBand: 2, text: "An experienced wanderer. The village feels safer already." },
    { id: "guard_g_cl_2_001", role: "guard", context: "greeting", mood: "calm",    levelBand: 2, text: "Rivers. You probably know these roads better than I do." },
    { id: "guard_g_wy_2_001", role: "guard", context: "greeting", mood: "weary",   levelBand: 2, text: "Three on, one off since last week. You'd think threats would take a holiday." },
    { id: "guard_g_cu_2_001", role: "guard", context: "greeting", mood: "curious", levelBand: 2, text: "We've been getting strange reports from near {biome_feature}. You pass through?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "guard_g_wm_3_001", role: "guard", context: "greeting", mood: "warm",    levelBand: 3, text: "A legend approaches the gate. Glad you're on our side." },
    { id: "guard_g_cl_3_001", role: "guard", context: "greeting", mood: "calm",    levelBand: 3, text: "Rivers. Your reputation walks ahead of you. Good reputation." },
    { id: "guard_g_wy_3_001", role: "guard", context: "greeting", mood: "weary",   levelBand: 3, text: "Long posting. Knowing folk like you wander out there helps." },
    { id: "guard_g_cu_3_001", role: "guard", context: "greeting", mood: "curious", levelBand: 3, text: "What's the most dangerous thing you've encountered? Off the record." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "guard_a_cl_0_001", role: "guard", context: "ambient", mood: "calm",    levelBand: 0, text: "Watch yourself past the north road after dark." },
    { id: "guard_a_wm_0_001", role: "guard", context: "ambient", mood: "warm",    levelBand: 0, text: "Village is peaceful. Let's keep it that way." },
    { id: "guard_a_cu_0_001", role: "guard", context: "ambient", mood: "curious", levelBand: 0, text: "My captain says strange creatures have been spotted near {biome_feature}." },
    { id: "guard_a_wy_0_001", role: "guard", context: "ambient", mood: "weary",   levelBand: 0, text: "Been standing here since second bell. Feet aren't happy." },
    { id: "guard_a_cl_0_002", role: "guard", context: "ambient", mood: "calm",    levelBand: 0, text: "The village is quiet but I'd never call it boring. You learn to look closer." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "guard_a_cl_1_001", role: "guard", context: "ambient", mood: "calm",    levelBand: 1, text: "The {biome_feature} crossing has been seeing odd traffic lately." },
    { id: "guard_a_wm_1_001", role: "guard", context: "ambient", mood: "warm",    levelBand: 1, text: "Patrol found nothing last night. Quiet is a luxury." },
    { id: "guard_a_cu_1_001", role: "guard", context: "ambient", mood: "curious", levelBand: 1, text: "Someone reported a {species} near the market. How does a wanderer catch one?" },
    { id: "guard_a_wy_1_001", role: "guard", context: "ambient", mood: "weary",   levelBand: 1, text: "Second consecutive night shift. I'd pay good gold for a nap." },
    { id: "guard_a_wm_1_002", role: "guard", context: "ambient", mood: "warm",    levelBand: 1, text: "The young recruits are eager. That's sweet. It fades." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "guard_a_cl_2_001", role: "guard", context: "ambient", mood: "calm",    levelBand: 2, text: "The roads aren't as safe as they look. You know that, I'm sure." },
    { id: "guard_a_wm_2_001", role: "guard", context: "ambient", mood: "warm",    levelBand: 2, text: "Every village I've posted at, wanderers made it safer. You included." },
    { id: "guard_a_cu_2_001", role: "guard", context: "ambient", mood: "curious", levelBand: 2, text: "Beastmasters used to help clear roads. Any interest?" },
    { id: "guard_a_wy_2_001", role: "guard", context: "ambient", mood: "weary",   levelBand: 2, text: "Twelve years guarding gates. Some days I want to walk out one myself." },
    { id: "guard_a_wm_2_002", role: "guard", context: "ambient", mood: "warm",    levelBand: 2, text: "We had a rough patch last month. Much calmer now." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "guard_a_cl_3_001", role: "guard", context: "ambient", mood: "calm",    levelBand: 3, text: "A good gate sees everything and lets the right things through." },
    { id: "guard_a_wm_3_001", role: "guard", context: "ambient", mood: "warm",    levelBand: 3, text: "Knowing you wander these roads makes my job feel less thankless." },
    { id: "guard_a_cu_3_001", role: "guard", context: "ambient", mood: "curious", levelBand: 3, text: "What's the trick to it? Wandering that long without losing yourself?" },
    { id: "guard_a_wy_3_001", role: "guard", context: "ambient", mood: "weary",   levelBand: 3, text: "I thought I'd have moved on by now. The village needs me, so I stay." },
    { id: "guard_a_wm_3_002", role: "guard", context: "ambient", mood: "warm",    levelBand: 3, text: "The new guards look up to stories about wanderers like you." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "guard_r_cl_0_001", role: "guard", context: "rumor", mood: "calm",    levelBand: 0, text: "Report came in about noise near {biome_feature}. Probably nothing." },
    { id: "guard_r_cu_0_001", role: "guard", context: "rumor", mood: "curious", levelBand: 0, text: "Merchant was spooked coming through {biome_feature}. Wouldn't say by what." },
    { id: "guard_r_wy_0_001", role: "guard", context: "rumor", mood: "weary",   levelBand: 0, text: "Night patrol avoided the {biome_feature} crossing. Not like them." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "guard_r_cl_1_001", role: "guard", context: "rumor", mood: "calm",    levelBand: 1, text: "Tracks found near {biome_feature} that our scouts didn't make." },
    { id: "guard_r_cu_1_001", role: "guard", context: "rumor", mood: "curious", levelBand: 1, text: "A {species} drove off three carts near {biome_feature} last week. Wild." },
    { id: "guard_r_wy_1_001", role: "guard", context: "rumor", mood: "weary",   levelBand: 1, text: "Lost contact with the outpost past {biome_feature}. Captain's sending a team." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "guard_r_cl_2_001", role: "guard", context: "rumor", mood: "calm",    levelBand: 2, text: "Something's nesting in the ruins past {biome_feature}. Too big for normal patrol." },
    { id: "guard_r_cu_2_001", role: "guard", context: "rumor", mood: "curious", levelBand: 2, text: "They say the {biome_feature} road at night has lights no one lit." },
    { id: "guard_r_wy_2_001", role: "guard", context: "rumor", mood: "weary",   levelBand: 2, text: "The {biome_feature} garrison hasn't sent a report in a week. Something's wrong." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "guard_r_cl_3_001", role: "guard", context: "rumor", mood: "calm",    levelBand: 3, text: "Old garrison near {biome_feature} — supposed to be abandoned. Someone's in there." },
    { id: "guard_r_cu_3_001", role: "guard", context: "rumor", mood: "curious", levelBand: 3, text: "A {species} the size of a barn was seen crossing the {biome_feature} ridge. Not a rumor." },
    { id: "guard_r_wy_3_001", role: "guard", context: "rumor", mood: "weary",   levelBand: 3, text: "The valley past {biome_feature} — something changed there. Even birds avoid it." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "guard_co_cl_0_001", role: "guard", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "A wild {species} has been spooking villagers near {biome_feature}. Could you deal with it?", tags: ["cause:defeat_threat"] },
    { id: "guard_co_wm_0_001", role: "guard", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "An elder needs safe passage to the next settlement. Would you escort them?",                  tags: ["cause:escort"] },
    { id: "guard_co_wy_0_001", role: "guard", context: "challenge_offer", mood: "weary",   levelBand: 0, text: "I'm needed here but the east road has trouble. Could someone keep watch there?",             tags: ["cause:guard_spot"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "guard_co_cl_1_001", role: "guard", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "Something's been harassing the grain stores near {biome_feature}. We need it gone.",         tags: ["cause:defeat_threat"] },
    { id: "guard_co_wm_1_001", role: "guard", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "Can you get {named_NPC} safely to the shrine past {biome_feature}? Roads aren't safe.",      tags: ["cause:escort"] },
    { id: "guard_co_wy_1_001", role: "guard", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "The west checkpoint is unmanned tonight. Anyone staying near {biome_feature}?",              tags: ["cause:guard_spot"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "guard_co_cl_2_001", role: "guard", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "The {biome_feature} threat has been building for weeks. Time for someone good to act.",      tags: ["cause:defeat_threat"] },
    { id: "guard_co_wm_2_001", role: "guard", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "A merchant caravan needs an experienced escort past {biome_feature}. You'd be perfect.",    tags: ["cause:escort"] },
    { id: "guard_co_cu_2_001", role: "guard", context: "challenge_offer", mood: "curious", levelBand: 2, text: "Our post near {biome_feature} needs watching for just one night. Any takers?",               tags: ["cause:guard_spot"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "guard_co_cl_3_001", role: "guard", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "Whatever's in the {biome_feature} ruins is stronger than our patrol. Your call.",           tags: ["cause:defeat_threat"] },
    { id: "guard_co_wm_3_001", role: "guard", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "{named_NPC} is traveling alone to the far settlement. A legend as escort would reassure them.", tags: ["cause:escort"] },
    { id: "guard_co_wy_3_001", role: "guard", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "The deep crossing at {biome_feature} hasn't had a watch in months. I'm asking you personally.", tags: ["cause:guard_spot"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "guard_ct_cl_0_001", role: "guard", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "It's quiet now. You handled that well.",                               tags: ["cause:defeat_threat"] },
    { id: "guard_ct_wm_0_001", role: "guard", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "{named_NPC} arrived safely. You've got a real talent for this.",       tags: ["cause:escort"] },
    { id: "guard_ct_wy_0_001", role: "guard", context: "challenge_thanks", mood: "weary", levelBand: 0, text: "The post held. Nothing got through. You've got my gratitude.",         tags: ["cause:guard_spot"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "guard_ct_cl_1_001", role: "guard", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "Reports came back clear. Whatever that was, it's gone.",                tags: ["cause:defeat_threat"] },
    { id: "guard_ct_wm_1_001", role: "guard", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "The whole caravan made it through unscathed. Outstanding work.",        tags: ["cause:escort"] },
    { id: "guard_ct_wy_1_001", role: "guard", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "All clear at the post. You kept it secure all night. Thank you.",      tags: ["cause:guard_spot"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "guard_ct_cl_2_001", role: "guard", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The whole {biome_feature} corridor is safe again. Genuine thanks.",     tags: ["cause:defeat_threat"] },
    { id: "guard_ct_wm_2_001", role: "guard", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "Every merchant got through. Your reputation is well earned.",            tags: ["cause:escort"] },
    { id: "guard_ct_cl_2_002", role: "guard", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The checkpoint was in good hands. I'll sleep better knowing that.",     tags: ["cause:guard_spot"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "guard_ct_cl_3_001", role: "guard", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "Years of trouble at that ruin, resolved. I owe you.",                   tags: ["cause:defeat_threat"] },
    { id: "guard_ct_wm_3_001", role: "guard", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "{named_NPC} called it the safest journey of their life. Your doing.",  tags: ["cause:escort"] },
    { id: "guard_ct_wy_3_001", role: "guard", context: "challenge_thanks", mood: "weary", levelBand: 3, text: "That crossing has needed watching for years. You're the first to do it.", tags: ["cause:guard_spot"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "guard_ia_cl_0_001", role: "guard", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "Quiet since you sorted that out. Best stretch of duty in months." },
    { id: "guard_ia_wm_0_001", role: "guard", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "Folks feel safer now. You did that." },
    { id: "guard_ia_wy_0_001", role: "guard", context: "idle_after_resolve", mood: "weary", levelBand: 0, text: "Slept a full night for the first time this week. Thanks to you." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "guard_ia_cl_1_001", role: "guard", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Post's been smooth. I told the captain what you did." },
    { id: "guard_ia_wm_1_001", role: "guard", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "Caravans are passing through again without a second thought." },
    { id: "guard_ia_cu_1_001", role: "guard", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "I wonder if whatever it was will come back. Probably not with you around." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "guard_ia_cl_2_001", role: "guard", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "We've had commendations since that operation. You're part of the reason." },
    { id: "guard_ia_wm_2_001", role: "guard", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "This stretch of road has never been safer. Proud of that." },
    { id: "guard_ia_wy_2_001", role: "guard", context: "idle_after_resolve", mood: "weary", levelBand: 2, text: "I'd retire happy if the roads stayed this clear." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "guard_ia_cl_3_001", role: "guard", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The stories guard recruits tell about you now. They're not exaggerating." },
    { id: "guard_ia_wm_3_001", role: "guard", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "This gate has seen a lot. You're one of the good ones who passed through." },
    { id: "guard_ia_wy_3_001", role: "guard", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long years at this post. What you did made it feel worthwhile." },
];
