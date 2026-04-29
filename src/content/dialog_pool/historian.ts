/**
 * Dialog pool — historian role.
 * Scholars of old lore, ruins, and creature records. Found in libraries or wandering.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: recover_heirloom, survey (common); deliver_message (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const historian: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "historian_g_cu_0_001", role: "historian", context: "greeting", mood: "curious", levelBand: 0, text: "A new wanderer! Tell me — have you found anything unusual out there?" },
    { id: "historian_g_cl_0_001", role: "historian", context: "greeting", mood: "calm",    levelBand: 0, text: "Welcome. I spend my days in old records. A fresh face is welcome." },
    { id: "historian_g_wm_0_001", role: "historian", context: "greeting", mood: "warm",    levelBand: 0, text: "Sit if you like. My door is open to wanderers." },
    { id: "historian_g_wy_0_001", role: "historian", context: "greeting", mood: "weary",   levelBand: 0, text: "Eyestrain from the old texts again. Good timing — distraction helps." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "historian_g_cu_1_001", role: "historian", context: "greeting", mood: "curious", levelBand: 1, text: "I've been waiting for a wanderer with your experience. Notes to compare?" },
    { id: "historian_g_cl_1_001", role: "historian", context: "greeting", mood: "calm",    levelBand: 1, text: "Rivers. Your name's come up in the field notes I've been cross-referencing." },
    { id: "historian_g_wm_1_001", role: "historian", context: "greeting", mood: "warm",    levelBand: 1, text: "You've been places my maps barely hint at. Please, tell me something." },
    { id: "historian_g_wy_1_001", role: "historian", context: "greeting", mood: "weary",   levelBand: 1, text: "Month three of this archive project. A visitor is a genuine treat." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "historian_g_cu_2_001", role: "historian", context: "greeting", mood: "curious", levelBand: 2, text: "An experienced wanderer. Your observations are primary sources to me." },
    { id: "historian_g_cl_2_001", role: "historian", context: "greeting", mood: "calm",    levelBand: 2, text: "Rivers! I've cited your travels in three papers now. Don't be alarmed." },
    { id: "historian_g_wm_2_001", role: "historian", context: "greeting", mood: "warm",    levelBand: 2, text: "You're exactly the person I hoped to see. I have questions about {biome_feature}." },
    { id: "historian_g_wy_2_001", role: "historian", context: "greeting", mood: "weary",   levelBand: 2, text: "Still trying to reconcile my field records with the old accounts. Help?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "historian_g_cu_3_001", role: "historian", context: "greeting", mood: "curious", levelBand: 3, text: "A legend in person. I've been building a case study around your travels." },
    { id: "historian_g_cl_3_001", role: "historian", context: "greeting", mood: "calm",    levelBand: 3, text: "Rivers. The record you've created just by wandering is remarkable." },
    { id: "historian_g_wm_3_001", role: "historian", context: "greeting", mood: "warm",    levelBand: 3, text: "Every time you visit, I learn something new. That's the best gift." },
    { id: "historian_g_wy_3_001", role: "historian", context: "greeting", mood: "weary",   levelBand: 3, text: "Decades of research and you still find things I've never heard of. Good." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "historian_a_cu_0_001", role: "historian", context: "ambient", mood: "curious", levelBand: 0, text: "Have you ever noticed how creatures cluster differently near old ruins?" },
    { id: "historian_a_cl_0_001", role: "historian", context: "ambient", mood: "calm",    levelBand: 0, text: "The oldest settlement in this region predates the current maps by centuries." },
    { id: "historian_a_wm_0_001", role: "historian", context: "ambient", mood: "warm",    levelBand: 0, text: "Fresh eyes see things I've trained myself not to notice. That's why wanderers matter." },
    { id: "historian_a_wy_0_001", role: "historian", context: "ambient", mood: "weary",   levelBand: 0, text: "This notation system is maddeningly inconsistent. Whoever made it was meticulous." },
    { id: "historian_a_cu_0_002", role: "historian", context: "ambient", mood: "curious", levelBand: 0, text: "I've been tracking the range of {species}. Has it changed where you've been?" },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "historian_a_cu_1_001", role: "historian", context: "ambient", mood: "curious", levelBand: 1, text: "The {biome_feature} landmark wasn't always at the surface. Fascinating geology." },
    { id: "historian_a_cl_1_001", role: "historian", context: "ambient", mood: "calm",    levelBand: 1, text: "I've found three different accounts of the same event that contradict each other entirely." },
    { id: "historian_a_wm_1_001", role: "historian", context: "ambient", mood: "warm",    levelBand: 1, text: "Oral histories from wanderers are just as valid as written ones. More vivid, even." },
    { id: "historian_a_wy_1_001", role: "historian", context: "ambient", mood: "weary",   levelBand: 1, text: "This archive was supposed to take six months. Three years later, I'm still here." },
    { id: "historian_a_cu_1_002", role: "historian", context: "ambient", mood: "curious", levelBand: 1, text: "The distribution of {species} across biomes follows a pattern I can't quite explain yet." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "historian_a_cu_2_001", role: "historian", context: "ambient", mood: "curious", levelBand: 2, text: "Every spot you've been could be a research site. Do you keep notes?" },
    { id: "historian_a_cl_2_001", role: "historian", context: "ambient", mood: "calm",    levelBand: 2, text: "The deep world pre-dates the names we give everything. That matters." },
    { id: "historian_a_wm_2_001", role: "historian", context: "ambient", mood: "warm",    levelBand: 2, text: "Your tracks through the wilds are more useful to me than ten expeditions." },
    { id: "historian_a_wy_2_001", role: "historian", context: "ambient", mood: "weary",   levelBand: 2, text: "People assume historians just read. We walk, too. Just slower." },
    { id: "historian_a_cu_2_002", role: "historian", context: "ambient", mood: "curious", levelBand: 2, text: "Something near {biome_feature} affects creature behavior. I need a fresh survey." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "historian_a_cu_3_001", role: "historian", context: "ambient", mood: "curious", levelBand: 3, text: "Your life's path is becoming history in real time. Has that sunk in?" },
    { id: "historian_a_cl_3_001", role: "historian", context: "ambient", mood: "calm",    levelBand: 3, text: "The wanderers who shaped this world rarely knew they were doing it." },
    { id: "historian_a_wm_3_001", role: "historian", context: "ambient", mood: "warm",    levelBand: 3, text: "When I write the definitive account of these roads, you'll be on every page." },
    { id: "historian_a_wy_3_001", role: "historian", context: "ambient", mood: "weary",   levelBand: 3, text: "I've spent my whole life piecing this world together. You've seen it whole." },
    { id: "historian_a_cu_3_002", role: "historian", context: "ambient", mood: "curious", levelBand: 3, text: "The record is vast but the mysteries only grow. That's why I can't stop." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "historian_r_cu_0_001", role: "historian", context: "rumor", mood: "curious", levelBand: 0, text: "The ruins near {biome_feature} predate the oldest records I have. Worth a look." },
    { id: "historian_r_cl_0_001", role: "historian", context: "rumor", mood: "calm",    levelBand: 0, text: "An old text mentions a hidden cache near {biome_feature}. Could be myth." },
    { id: "historian_r_wm_0_001", role: "historian", context: "rumor", mood: "warm",    levelBand: 0, text: "A {species} sighting near {biome_feature} matches an account from two centuries ago." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "historian_r_cu_1_001", role: "historian", context: "rumor", mood: "curious", levelBand: 1, text: "Three independent sources reference something unusual near {biome_feature}. Compelling." },
    { id: "historian_r_cl_1_001", role: "historian", context: "rumor", mood: "calm",    levelBand: 1, text: "An old caravan route passed through {biome_feature}. The waypoints might still stand." },
    { id: "historian_r_wy_1_001", role: "historian", context: "rumor", mood: "weary",   levelBand: 1, text: "The most cited mystery in my field is the disappearance near {biome_feature}. Unsolved." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "historian_r_cu_2_001", role: "historian", context: "rumor", mood: "curious", levelBand: 2, text: "A particular {species} appears only near {biome_feature} at certain times. Why?" },
    { id: "historian_r_cl_2_001", role: "historian", context: "rumor", mood: "calm",    levelBand: 2, text: "The {biome_feature} area was the center of something significant once. Evidence remains." },
    { id: "historian_r_wm_2_001", role: "historian", context: "rumor", mood: "warm",    levelBand: 2, text: "Field notes from {biome_feature} describe artifacts unlike anything catalogued." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "historian_r_cl_3_001", role: "historian", context: "rumor", mood: "calm",    levelBand: 3, text: "The oldest route markers in the world reportedly cluster near {biome_feature}." },
    { id: "historian_r_cu_3_001", role: "historian", context: "rumor", mood: "curious", levelBand: 3, text: "The deepest mystery of my career lies somewhere past {biome_feature}. I feel it." },
    { id: "historian_r_wm_3_001", role: "historian", context: "rumor", mood: "warm",    levelBand: 3, text: "A creature matching no known {species} was documented near {biome_feature} long ago." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "historian_co_cu_0_001", role: "historian", context: "challenge_offer", mood: "curious", levelBand: 0, text: "An artifact I need is near {biome_feature}. Could you retrieve and describe it?",    tags: ["cause:recover_heirloom"] },
    { id: "historian_co_cl_0_001", role: "historian", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "Could you map the features near {biome_feature}? I need fresh eyes on it.",             tags: ["cause:survey"] },
    { id: "historian_co_wm_0_001", role: "historian", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "I need this note delivered to {named_NPC} — a fellow scholar across the valley.",       tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "historian_co_cu_1_001", role: "historian", context: "challenge_offer", mood: "curious", levelBand: 1, text: "An old chronicle was taken from the archive near {biome_feature}. Could you track it?",  tags: ["cause:recover_heirloom"] },
    { id: "historian_co_cl_1_001", role: "historian", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "I need a thorough survey of the features around {biome_feature} for my records.",        tags: ["cause:survey"] },
    { id: "historian_co_wm_1_001", role: "historian", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "Research notes must reach {named_NPC} before the conference. Could you carry them?",    tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "historian_co_cu_2_001", role: "historian", context: "challenge_offer", mood: "curious", levelBand: 2, text: "A founding document is missing, last traced to near {biome_feature}. Worth finding.",  tags: ["cause:recover_heirloom"] },
    { id: "historian_co_cl_2_001", role: "historian", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "The landscape past {biome_feature} hasn't been documented in years. Could you?",        tags: ["cause:survey"] },
    { id: "historian_co_wm_2_001", role: "historian", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "A critical correspondence for {named_NPC} must arrive before they leave the region.",   tags: ["cause:deliver_message"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "historian_co_cu_3_001", role: "historian", context: "challenge_offer", mood: "curious", levelBand: 3, text: "The rarest text in my field is somewhere past {biome_feature}. Only you'd find it.",   tags: ["cause:recover_heirloom"] },
    { id: "historian_co_cl_3_001", role: "historian", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "A deep survey of {biome_feature} would complete a lifetime of research. Please.",       tags: ["cause:survey"] },
    { id: "historian_co_wm_3_001", role: "historian", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "This message for {named_NPC} changes everything for our research. Urgent.",             tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "historian_ct_cu_0_001", role: "historian", context: "challenge_thanks", mood: "curious", levelBand: 0, text: "You found it! And intact. I could cry.", tags: ["cause:recover_heirloom"] },
    { id: "historian_ct_cl_0_001", role: "historian", context: "challenge_thanks", mood: "calm",    levelBand: 0, text: "Your survey fills three gaps I've had for years. Excellent.",      tags: ["cause:survey"] },
    { id: "historian_ct_wm_0_001", role: "historian", context: "challenge_thanks", mood: "warm",    levelBand: 0, text: "{named_NPC} received the notes. The collaboration continues. Thank you.", tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "historian_ct_cu_1_001", role: "historian", context: "challenge_thanks", mood: "curious", levelBand: 1, text: "The chronicle is returned. I'll keep it safer this time.",          tags: ["cause:recover_heirloom"] },
    { id: "historian_ct_cl_1_001", role: "historian", context: "challenge_thanks", mood: "calm",    levelBand: 1, text: "The most thorough survey I've received in a decade. You're gifted.",  tags: ["cause:survey"] },
    { id: "historian_ct_wm_1_001", role: "historian", context: "challenge_thanks", mood: "warm",    levelBand: 1, text: "{named_NPC} wrote back immediately. You started something good.",      tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "historian_ct_cu_2_001", role: "historian", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "A founding document, recovered. Historians everywhere owe you.",       tags: ["cause:recover_heirloom"] },
    { id: "historian_ct_cl_2_001", role: "historian", context: "challenge_thanks", mood: "calm",    levelBand: 2, text: "The survey data is extraordinary. This changes my conclusions entirely.", tags: ["cause:survey"] },
    { id: "historian_ct_wm_2_001", role: "historian", context: "challenge_thanks", mood: "warm",    levelBand: 2, text: "The correspondence reached {named_NPC} in time. A collaboration saved.",  tags: ["cause:deliver_message"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "historian_ct_cu_3_001", role: "historian", context: "challenge_thanks", mood: "curious", levelBand: 3, text: "The rarest text, found. I'll dedicate the volume to you.",              tags: ["cause:recover_heirloom"] },
    { id: "historian_ct_cl_3_001", role: "historian", context: "challenge_thanks", mood: "calm",    levelBand: 3, text: "This survey completes my life's work. I mean that literally.",           tags: ["cause:survey"] },
    { id: "historian_ct_wm_3_001", role: "historian", context: "challenge_thanks", mood: "warm",    levelBand: 3, text: "You've changed the direction of research across the region. Remarkable.",  tags: ["cause:deliver_message"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "historian_ia_cu_0_001", role: "historian", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "Still poring over what you brought back. More questions now, not fewer." },
    { id: "historian_ia_cl_0_001", role: "historian", context: "idle_after_resolve", mood: "calm",    levelBand: 0, text: "The survey helped me finish a chapter I'd abandoned twice." },
    { id: "historian_ia_wm_0_001", role: "historian", context: "idle_after_resolve", mood: "warm",    levelBand: 0, text: "The collaboration with {named_NPC} has been fruitful. You started that." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "historian_ia_cu_1_001", role: "historian", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "Your survey keeps yielding new interpretations. I'm grateful." },
    { id: "historian_ia_cl_1_001", role: "historian", context: "idle_after_resolve", mood: "calm",    levelBand: 1, text: "The document is preserved under glass now. As it deserves." },
    { id: "historian_ia_wm_1_001", role: "historian", context: "idle_after_resolve", mood: "warm",    levelBand: 1, text: "Three scholars have already cited what you brought me. Ripple effect." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "historian_ia_cu_2_001", role: "historian", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "The survey opened a new line of inquiry I'd never have found. Thank you." },
    { id: "historian_ia_cl_2_001", role: "historian", context: "idle_after_resolve", mood: "calm",    levelBand: 2, text: "The document changed my conclusions. The revised account is better." },
    { id: "historian_ia_wy_2_001", role: "historian", context: "idle_after_resolve", mood: "weary",   levelBand: 2, text: "Still writing from the data you gave me. Might be forever." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "historian_ia_cu_3_001", role: "historian", context: "idle_after_resolve", mood: "curious", levelBand: 3, text: "The rarest text, in hand. I still can't believe it. You did that." },
    { id: "historian_ia_cl_3_001", role: "historian", context: "idle_after_resolve", mood: "calm",    levelBand: 3, text: "The definitive account is nearly finished. You're the final chapter." },
    { id: "historian_ia_wm_3_001", role: "historian", context: "idle_after_resolve", mood: "warm",    levelBand: 3, text: "What you've given to the record of this world is immeasurable." },
];
