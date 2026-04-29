/**
 * Dialog pool — trainer role.
 * Creature trainers who teach battle skills and challenge wanderers.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: defeat_threat only (challenges are always combat-based for this role).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const trainer: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "trainer_g_cl_0_001", role: "trainer", context: "greeting", mood: "calm",    levelBand: 0, text: "So you've caught a creature. Have you trained it?" },
    { id: "trainer_g_wm_0_001", role: "trainer", context: "greeting", mood: "warm",    levelBand: 0, text: "A fresh wanderer! Excellent. Let me see your party." },
    { id: "trainer_g_cu_0_001", role: "trainer", context: "greeting", mood: "curious", levelBand: 0, text: "You've got good instincts. Have you tried a proper battle?" },
    { id: "trainer_g_wy_0_001", role: "trainer", context: "greeting", mood: "weary",   levelBand: 0, text: "Long day of drills. You look promising though." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "trainer_g_cl_1_001", role: "trainer", context: "greeting", mood: "calm",    levelBand: 1, text: "You've sharpened up since last we met. I can tell." },
    { id: "trainer_g_wm_1_001", role: "trainer", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers. Your party is stronger. I like the progress." },
    { id: "trainer_g_cu_1_001", role: "trainer", context: "greeting", mood: "curious", levelBand: 1, text: "What's your current strategy? I've got a counter I want to test." },
    { id: "trainer_g_wy_1_001", role: "trainer", context: "greeting", mood: "weary",   levelBand: 1, text: "The new students tire me out. You're a relief — you actually listen." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "trainer_g_cl_2_001", role: "trainer", context: "greeting", mood: "calm",    levelBand: 2, text: "A serious wanderer. The best battles are the ones that teach something." },
    { id: "trainer_g_wm_2_001", role: "trainer", context: "greeting", mood: "warm",    levelBand: 2, text: "You've grown into a formidable wanderer. Respectable." },
    { id: "trainer_g_cu_2_001", role: "trainer", context: "greeting", mood: "curious", levelBand: 2, text: "I want to study how you fight. Not to beat you — just to understand." },
    { id: "trainer_g_wy_2_001", role: "trainer", context: "greeting", mood: "weary",   levelBand: 2, text: "Years of training others. You're one of the rare ones who didn't need much." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "trainer_g_cl_3_001", role: "trainer", context: "greeting", mood: "calm",    levelBand: 3, text: "The finest wanderer I've encountered. I don't say that lightly." },
    { id: "trainer_g_wm_3_001", role: "trainer", context: "greeting", mood: "warm",    levelBand: 3, text: "Rivers. You've become what every student of mine hopes to be." },
    { id: "trainer_g_cu_3_001", role: "trainer", context: "greeting", mood: "curious", levelBand: 3, text: "At your level, battles become conversations. What do yours say?" },
    { id: "trainer_g_wy_3_001", role: "trainer", context: "greeting", mood: "weary",   levelBand: 3, text: "I've taught for decades. You are the rare complete student. Hello." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "trainer_a_cl_0_001", role: "trainer", context: "ambient", mood: "calm",    levelBand: 0, text: "A creature not trained is a partner unrealized." },
    { id: "trainer_a_wm_0_001", role: "trainer", context: "ambient", mood: "warm",    levelBand: 0, text: "The bond between wanderer and creature changes both of them. Watch for that." },
    { id: "trainer_a_cu_0_001", role: "trainer", context: "ambient", mood: "curious", levelBand: 0, text: "What draws a creature to one wanderer and not another? I'm still studying that." },
    { id: "trainer_a_wy_0_001", role: "trainer", context: "ambient", mood: "weary",   levelBand: 0, text: "Three students this week lost their nerve mid-battle. It's teachable. Takes patience." },
    { id: "trainer_a_wm_0_002", role: "trainer", context: "ambient", mood: "warm",    levelBand: 0, text: "The best lesson I ever gave was telling someone to lose on purpose. It worked." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "trainer_a_cl_1_001", role: "trainer", context: "ambient", mood: "calm",    levelBand: 1, text: "Patterns matter more than power. You're starting to see that." },
    { id: "trainer_a_wm_1_001", role: "trainer", context: "ambient", mood: "warm",    levelBand: 1, text: "I've seen your battles. You're developing a style. That's good." },
    { id: "trainer_a_cu_1_001", role: "trainer", context: "ambient", mood: "curious", levelBand: 1, text: "How do you decide when to push and when to wait? I'd like to know your thinking." },
    { id: "trainer_a_wy_1_001", role: "trainer", context: "ambient", mood: "weary",   levelBand: 1, text: "The {biome_feature} threats have been unusual. More aggressive than expected." },
    { id: "trainer_a_wm_1_002", role: "trainer", context: "ambient", mood: "warm",    levelBand: 1, text: "A good battle leaves both sides with something to think about." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "trainer_a_cl_2_001", role: "trainer", context: "ambient", mood: "calm",    levelBand: 2, text: "The experienced wanderer understands pacing. You've got it." },
    { id: "trainer_a_wm_2_001", role: "trainer", context: "ambient", mood: "warm",    levelBand: 2, text: "I've trained hundreds. A handful really understood. You're one of them." },
    { id: "trainer_a_cu_2_001", role: "trainer", context: "ambient", mood: "curious", levelBand: 2, text: "What do you see in the moment before a {species} strikes? I want your description." },
    { id: "trainer_a_wy_2_001", role: "trainer", context: "ambient", mood: "weary",   levelBand: 2, text: "Twenty years of this. The battles are different. The joy isn't." },
    { id: "trainer_a_wm_2_002", role: "trainer", context: "ambient", mood: "warm",    levelBand: 2, text: "The best wanderers treat every encounter as a lesson, even faints." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "trainer_a_cl_3_001", role: "trainer", context: "ambient", mood: "calm",    levelBand: 3, text: "At your level, I learn more from watching you than you do from me." },
    { id: "trainer_a_wm_3_001", role: "trainer", context: "ambient", mood: "warm",    levelBand: 3, text: "What you and your creatures have is rare. I've only seen it once before." },
    { id: "trainer_a_cu_3_001", role: "trainer", context: "ambient", mood: "curious", levelBand: 3, text: "You've made me think differently about the art of training. That's no small thing." },
    { id: "trainer_a_wy_3_001", role: "trainer", context: "ambient", mood: "weary",   levelBand: 3, text: "Long years. My best student. Thank you for continuing to grow." },
    { id: "trainer_a_wm_3_002", role: "trainer", context: "ambient", mood: "warm",    levelBand: 3, text: "The battles you've had — even the hard ones — have made you extraordinary." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "trainer_r_cl_0_001", role: "trainer", context: "rumor", mood: "calm",    levelBand: 0, text: "A threat near {biome_feature} has been growing. No one's dealt with it properly yet." },
    { id: "trainer_r_cu_0_001", role: "trainer", context: "rumor", mood: "curious", levelBand: 0, text: "There's an aggressive {species} near {biome_feature} that's driven off three wanderers." },
    { id: "trainer_r_wm_0_001", role: "trainer", context: "rumor", mood: "warm",    levelBand: 0, text: "A legendary battle was fought near {biome_feature} years ago. The echoes remain." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "trainer_r_cu_1_001", role: "trainer", context: "rumor", mood: "curious", levelBand: 1, text: "Something powerful has established territory near {biome_feature}. Interesting problem." },
    { id: "trainer_r_cl_1_001", role: "trainer", context: "rumor", mood: "calm",    levelBand: 1, text: "The threat near {biome_feature} adapts to tactics. I'd like a full report." },
    { id: "trainer_r_wm_1_001", role: "trainer", context: "rumor", mood: "warm",    levelBand: 1, text: "A trainer I respect said the creatures near {biome_feature} are remarkably coordinated." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "trainer_r_cu_2_001", role: "trainer", context: "rumor", mood: "curious", levelBand: 2, text: "The {biome_feature} threat has a pattern I can't predict from here. Need someone in it." },
    { id: "trainer_r_cl_2_001", role: "trainer", context: "rumor", mood: "calm",    levelBand: 2, text: "An exceptionally powerful {species} near {biome_feature}. A training opportunity, really." },
    { id: "trainer_r_wy_2_001", role: "trainer", context: "rumor", mood: "weary",   levelBand: 2, text: "Six wanderers have avoided {biome_feature} this month. Whatever's there, it's significant." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "trainer_r_cl_3_001", role: "trainer", context: "rumor", mood: "calm",    levelBand: 3, text: "The most formidable threat I've ever heard of is near {biome_feature}. Haven't confirmed it." },
    { id: "trainer_r_cu_3_001", role: "trainer", context: "rumor", mood: "curious", levelBand: 3, text: "Past {biome_feature} there's something that defeats every tactical approach I know." },
    { id: "trainer_r_wm_3_001", role: "trainer", context: "rumor", mood: "warm",    levelBand: 3, text: "The great {species} near {biome_feature} — a battle with it would be the pinnacle." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "trainer_co_cl_0_001", role: "trainer", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "There's a creature near {biome_feature} disrupting everything. I need you to stop it.", tags: ["cause:defeat_threat"] },
    { id: "trainer_co_wm_0_001", role: "trainer", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "A pack of wild {species} near {biome_feature} has gotten out of hand. You ready?",   tags: ["cause:defeat_threat"] },
    { id: "trainer_co_cu_0_001", role: "trainer", context: "challenge_offer", mood: "curious", levelBand: 0, text: "Consider it a training exercise: defeat what's threatening {biome_feature}.",         tags: ["cause:defeat_threat"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "trainer_co_cl_1_001", role: "trainer", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "The {biome_feature} threat has escalated. It's yours to handle now.",                   tags: ["cause:defeat_threat"] },
    { id: "trainer_co_wm_1_001", role: "trainer", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "A test of what you've learned: deal with the danger near {biome_feature}.",             tags: ["cause:defeat_threat"] },
    { id: "trainer_co_wy_1_001", role: "trainer", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "I'd go myself but I'm needed here. The {biome_feature} situation needs you.",           tags: ["cause:defeat_threat"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "trainer_co_cl_2_001", role: "trainer", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "Only an experienced wanderer can manage the threat at {biome_feature}. You qualify.", tags: ["cause:defeat_threat"] },
    { id: "trainer_co_wm_2_001", role: "trainer", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "What's near {biome_feature} is the hardest challenge I can offer. Interested?",        tags: ["cause:defeat_threat"] },
    { id: "trainer_co_cu_2_001", role: "trainer", context: "challenge_offer", mood: "curious", levelBand: 2, text: "The {biome_feature} creature uses patterns I've been studying. Go prove my theory.",   tags: ["cause:defeat_threat"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "trainer_co_cl_3_001", role: "trainer", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "The greatest threat I know of is near {biome_feature}. I'm sending you.",               tags: ["cause:defeat_threat"] },
    { id: "trainer_co_wm_3_001", role: "trainer", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "The pinnacle challenge — what's been building near {biome_feature}. You're ready.",     tags: ["cause:defeat_threat"] },
    { id: "trainer_co_cu_3_001", role: "trainer", context: "challenge_offer", mood: "curious", levelBand: 3, text: "After everything you've faced — can you defeat what waits at {biome_feature}?",         tags: ["cause:defeat_threat"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "trainer_ct_cl_0_001", role: "trainer", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "Clean finish. You executed that better than I expected.",                  tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_wm_0_001", role: "trainer", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "Well done. The area is safe and you learned something too. I can tell.",  tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_cu_0_001", role: "trainer", context: "challenge_thanks", mood: "curious", levelBand: 0, text: "Tell me exactly what happened in that battle. I want to study it.",     tags: ["cause:defeat_threat"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "trainer_ct_cl_1_001", role: "trainer", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "Exactly as expected from you. The threat is neutralized.",                  tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_wm_1_001", role: "trainer", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "Your growth was evident in every move. I'm proud.",                         tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_wy_1_001", role: "trainer", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "That was harder than I let on. You handled it beautifully.",                 tags: ["cause:defeat_threat"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "trainer_ct_cl_2_001", role: "trainer", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "Methodical, effective, and clean. The mark of a trained wanderer.",         tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_wm_2_001", role: "trainer", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "That was masterful. Your creatures trusted you completely.",                  tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_cu_2_001", role: "trainer", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "You proved my theory correct. And then did something I hadn't predicted.", tags: ["cause:defeat_threat"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "trainer_ct_cl_3_001", role: "trainer", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The greatest challenge resolved. By the greatest wanderer I know.",          tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_wm_3_001", role: "trainer", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "I have nothing left to teach you. That's the best compliment I have.",       tags: ["cause:defeat_threat"] },
    { id: "trainer_ct_cu_3_001", role: "trainer", context: "challenge_thanks", mood: "curious", levelBand: 3, text: "You created a new technique in that battle. Write it down for me.",        tags: ["cause:defeat_threat"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "trainer_ia_cl_0_001", role: "trainer", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "The area is clear. My students can train there now." },
    { id: "trainer_ia_wm_0_001", role: "trainer", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "I've been telling my students about your approach. Use it as a model." },
    { id: "trainer_ia_cu_0_001", role: "trainer", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "Still thinking about what you did. Three separate lessons in it." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "trainer_ia_cl_1_001", role: "trainer", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "My training grounds are better for what you did. Thank you." },
    { id: "trainer_ia_wm_1_001", role: "trainer", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "Students come back from that area now. You opened it up." },
    { id: "trainer_ia_cu_1_001", role: "trainer", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "I reconstructed the battle in my notes. Four pages so far." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "trainer_ia_cl_2_001", role: "trainer", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "The training at {biome_feature} is the best it's ever been. Your doing." },
    { id: "trainer_ia_wm_2_001", role: "trainer", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "My students ask about you. I show them the terrain you cleared." },
    { id: "trainer_ia_cu_2_001", role: "trainer", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "What you did there will reshape how I teach the advanced class." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "trainer_ia_cl_3_001", role: "trainer", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The legend cleared the path. The students walk it now." },
    { id: "trainer_ia_wm_3_001", role: "trainer", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "Teaching has purpose again, because of what you did. Thank you." },
    { id: "trainer_ia_wy_3_001", role: "trainer", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long career. You are the student worth every year of it." },
];
