/**
 * Dialog pool — child role.
 * Village children. Curious, innocent, occasionally very wise.
 * Moods: warm, curious. Bands: 0-3.
 * Causes: find_pet, recover_heirloom (common).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const child: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "child_g_wm_0_001", role: "child", context: "greeting", mood: "warm",    levelBand: 0, text: "Are you a wanderer? You look like one from the pictures!" },
    { id: "child_g_cu_0_001", role: "child", context: "greeting", mood: "curious", levelBand: 0, text: "Is that a {species}? Can I see it?" },
    { id: "child_g_wm_0_002", role: "child", context: "greeting", mood: "warm",    levelBand: 0, text: "Hello! I've never seen you before. That's exciting." },
    { id: "child_g_cu_0_002", role: "child", context: "greeting", mood: "curious", levelBand: 0, text: "Where did you come from? Is it far?" },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "child_g_wm_1_001", role: "child", context: "greeting", mood: "warm",    levelBand: 1, text: "You came back! I told my friends about you and they didn't believe me." },
    { id: "child_g_cu_1_001", role: "child", context: "greeting", mood: "curious", levelBand: 1, text: "Did you catch anything new? How many creatures do you have?" },
    { id: "child_g_wm_1_002", role: "child", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers! Mum said you helped us. Thank you." },
    { id: "child_g_cu_1_002", role: "child", context: "greeting", mood: "curious", levelBand: 1, text: "I heard you've been to {biome_feature}. Is it scary out there?" },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "child_g_wm_2_001", role: "child", context: "greeting", mood: "warm",    levelBand: 2, text: "It's you! You're the wanderer everyone talks about!" },
    { id: "child_g_cu_2_001", role: "child", context: "greeting", mood: "curious", levelBand: 2, text: "When I grow up I want to be a wanderer. Like you. Except maybe with more snacks." },
    { id: "child_g_wm_2_002", role: "child", context: "greeting", mood: "warm",    levelBand: 2, text: "I drew a picture of your creature. Want to see?" },
    { id: "child_g_cu_2_002", role: "child", context: "greeting", mood: "curious", levelBand: 2, text: "My friend says you've been to the deep wilds. What's the biggest thing you've seen?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "child_g_wm_3_001", role: "child", context: "greeting", mood: "warm",    levelBand: 3, text: "The famous wanderer came to our village! Wait till I tell everyone!" },
    { id: "child_g_cu_3_001", role: "child", context: "greeting", mood: "curious", levelBand: 3, text: "Is it true what they say about you? The elder says you've been everywhere." },
    { id: "child_g_wm_3_002", role: "child", context: "greeting", mood: "warm",    levelBand: 3, text: "I've been hoping you'd pass through. I have a question only you could answer." },
    { id: "child_g_cu_3_002", role: "child", context: "greeting", mood: "curious", levelBand: 3, text: "You're a legend! Can I walk with you for a little while? Just to the edge of the village." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "child_a_wm_0_001", role: "child", context: "ambient", mood: "warm",    levelBand: 0, text: "I found a feather near {biome_feature}. It glows a little. I named it Spark." },
    { id: "child_a_cu_0_001", role: "child", context: "ambient", mood: "curious", levelBand: 0, text: "Do creatures ever faint in the wild? What do they do after?" },
    { id: "child_a_wm_0_002", role: "child", context: "ambient", mood: "warm",    levelBand: 0, text: "My cat is my best friend. She's not a battle creature, she's just a cat." },
    { id: "child_a_cu_0_002", role: "child", context: "ambient", mood: "curious", levelBand: 0, text: "How do you know where to go next? Do you just pick a direction?" },
    { id: "child_a_wm_0_003", role: "child", context: "ambient", mood: "warm",    levelBand: 0, text: "I made up a creature called a snufflewump. It's like a {species} but rounder." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "child_a_wm_1_001", role: "child", context: "ambient", mood: "warm",    levelBand: 1, text: "I found the spot near {biome_feature} where wild creatures drink. I go there quietly." },
    { id: "child_a_cu_1_001", role: "child", context: "ambient", mood: "curious", levelBand: 1, text: "Do you get lonely? I'd get lonely if I traveled that much." },
    { id: "child_a_wm_1_002", role: "child", context: "ambient", mood: "warm",    levelBand: 1, text: "My sister wants to wander when she grows up. I told her to ask you for advice." },
    { id: "child_a_cu_1_002", role: "child", context: "ambient", mood: "curious", levelBand: 1, text: "What's the smallest creature you've ever caught? The biggest? Which is better?" },
    { id: "child_a_wm_1_003", role: "child", context: "ambient", mood: "warm",    levelBand: 1, text: "I keep a rock I found near {biome_feature}. It's my lucky one." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "child_a_wm_2_001", role: "child", context: "ambient", mood: "warm",    levelBand: 2, text: "You've been everywhere. Do you have a favorite place? Tell me." },
    { id: "child_a_cu_2_001", role: "child", context: "ambient", mood: "curious", levelBand: 2, text: "Do creatures remember you when you go away and come back?" },
    { id: "child_a_wm_2_002", role: "child", context: "ambient", mood: "warm",    levelBand: 2, text: "I want to be a wanderer AND a baker. People say you can't do both. I say you can." },
    { id: "child_a_cu_2_002", role: "child", context: "ambient", mood: "curious", levelBand: 2, text: "If I gave you a letter, would you leave it somewhere far away? For the adventure." },
    { id: "child_a_wm_2_003", role: "child", context: "ambient", mood: "warm",    levelBand: 2, text: "My dog made a friend with a {species} out back. They share the porch." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "child_a_wm_3_001", role: "child", context: "ambient", mood: "warm",    levelBand: 3, text: "The elder says you've been going since before I was born. That's amazing." },
    { id: "child_a_cu_3_001", role: "child", context: "ambient", mood: "curious", levelBand: 3, text: "Do you ever stop and think: what's it all for? Or is that a grown-up question?" },
    { id: "child_a_wm_3_002", role: "child", context: "ambient", mood: "warm",    levelBand: 3, text: "I've been collecting things from wanderers who pass through. You're my favorite." },
    { id: "child_a_cu_3_002", role: "child", context: "ambient", mood: "curious", levelBand: 3, text: "Will you tell me one story? About something no one else has seen?" },
    { id: "child_a_wm_3_003", role: "child", context: "ambient", mood: "warm",    levelBand: 3, text: "When I'm old I want to say I met you. So thank you for being real." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "child_r_cu_0_001", role: "child", context: "rumor", mood: "curious", levelBand: 0, text: "My friend says there's a {species} near {biome_feature} that changes color. I believe them." },
    { id: "child_r_wm_0_001", role: "child", context: "rumor", mood: "warm",    levelBand: 0, text: "There's a really muddy spot past {biome_feature} that smells amazing. Worms everywhere." },
    { id: "child_r_cu_0_002", role: "child", context: "rumor", mood: "curious", levelBand: 0, text: "I heard a sound near {biome_feature} that wasn't wind. It was sort of pretty." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "child_r_cu_1_001", role: "child", context: "rumor", mood: "curious", levelBand: 1, text: "My big cousin said there's something shiny buried near {biome_feature}. Really." },
    { id: "child_r_wm_1_001", role: "child", context: "rumor", mood: "warm",    levelBand: 1, text: "I snuck to the edge of {biome_feature} once. Just for a second. It felt different there." },
    { id: "child_r_cu_1_002", role: "child", context: "rumor", mood: "curious", levelBand: 1, text: "Three kids dared each other to go past {biome_feature}. None of them actually did." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "child_r_cu_2_001", role: "child", context: "rumor", mood: "curious", levelBand: 2, text: "The spot near {biome_feature} where fireflies gather — is that normal? It's a lot of them." },
    { id: "child_r_wm_2_001", role: "child", context: "rumor", mood: "warm",    levelBand: 2, text: "A {species} visited the well near {biome_feature} for three days straight. Then was gone." },
    { id: "child_r_cu_2_002", role: "child", context: "rumor", mood: "curious", levelBand: 2, text: "There's a tree near {biome_feature} that hums when you put your ear against it." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "child_r_cu_3_001", role: "child", context: "rumor", mood: "curious", levelBand: 3, text: "I asked the elder about {biome_feature}. They changed the subject fast. Now I need to know." },
    { id: "child_r_wm_3_001", role: "child", context: "rumor", mood: "warm",    levelBand: 3, text: "Everyone says you know the best spots. Is there anything near {biome_feature} I should see?" },
    { id: "child_r_cu_3_002", role: "child", context: "rumor", mood: "curious", levelBand: 3, text: "The stories say a rare {species} only appears near {biome_feature} for wanderers it trusts." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "child_co_wm_0_001", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My rabbit Biscuit ran off near {biome_feature}. Please find her? She'll come to her name.", tags: ["cause:find_pet"] },
    { id: "child_co_cu_0_001", role: "child", context: "challenge_offer", mood: "curious", levelBand: 0, text: "I lost my grandad's pocket stone near {biome_feature}. It's smooth and fits my hand.",      tags: ["cause:recover_heirloom"] },
    { id: "child_co_wm_0_002", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My frog Splat hopped away toward {biome_feature}. He's green with a spot.",                 tags: ["cause:find_pet"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "child_co_wm_1_001", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "My little lizard crawled into the {biome_feature} area. Mum will worry if I say.",          tags: ["cause:find_pet"] },
    { id: "child_co_cu_1_001", role: "child", context: "challenge_offer", mood: "curious", levelBand: 1, text: "My gran's bracelet blew into {biome_feature} in the wind. She doesn't know yet.",              tags: ["cause:recover_heirloom"] },
    { id: "child_co_wm_1_002", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "My dog follows {species} and now he's somewhere past {biome_feature}.",                       tags: ["cause:find_pet"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "child_co_wm_2_001", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "My old cat went toward {biome_feature} three days ago. She's old and slow.",                  tags: ["cause:find_pet"] },
    { id: "child_co_cu_2_001", role: "child", context: "challenge_offer", mood: "curious", levelBand: 2, text: "A box of things from my great-gran was lost near {biome_feature} during the move.",            tags: ["cause:recover_heirloom"] },
    { id: "child_co_wm_2_002", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "My hedgehog rolled away down the hill toward {biome_feature}. He's the worrying type.",       tags: ["cause:find_pet"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "child_co_wm_3_001", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "My ancient tortoise has gone toward {biome_feature}. She's lived longer than the village.",  tags: ["cause:find_pet"] },
    { id: "child_co_cu_3_001", role: "child", context: "challenge_offer", mood: "curious", levelBand: 3, text: "A locket from my great-great-gran is lost near {biome_feature}. The family's only treasure.", tags: ["cause:recover_heirloom"] },
    { id: "child_co_wm_3_002", role: "child", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "My three cats all wandered to {biome_feature} together. Conspired, I think.",                 tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "child_ct_wm_0_001", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 0, text: "Biscuit! She's back! She smells like adventure.",                       tags: ["cause:find_pet"] },
    { id: "child_ct_cu_0_001", role: "child", context: "challenge_thanks", mood: "curious", levelBand: 0, text: "My pocket stone! How did you find it? Where was it?",                    tags: ["cause:recover_heirloom"] },
    { id: "child_ct_wm_0_002", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 0, text: "Splat came home! He looks bigger. Did he eat something out there?",      tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "child_ct_wm_1_001", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 1, text: "You found him! He wagged so hard when I saw him.",                        tags: ["cause:find_pet"] },
    { id: "child_ct_cu_1_001", role: "child", context: "challenge_thanks", mood: "curious", levelBand: 1, text: "Gran's bracelet! She's going to cry. The good kind. Thank you.",          tags: ["cause:recover_heirloom"] },
    { id: "child_ct_wm_1_002", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 1, text: "My lizard is back and now she actually sits still for me. What did you do?", tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "child_ct_wm_2_001", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 2, text: "She limped in but she purred immediately. Old girl's okay.",               tags: ["cause:find_pet"] },
    { id: "child_ct_cu_2_001", role: "child", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "The whole box! Everything's in it. This is the best day.",                  tags: ["cause:recover_heirloom"] },
    { id: "child_ct_wm_2_002", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 2, text: "My hedgehog rolled right back to me. Still worrying, still safe.",         tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "child_ct_wm_3_001", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 3, text: "She's back! She moved slow but she got home. You brought her there.",      tags: ["cause:find_pet"] },
    { id: "child_ct_cu_3_001", role: "child", context: "challenge_thanks", mood: "curious", levelBand: 3, text: "The locket! Mum's holding it and crying. You've done something wonderful.", tags: ["cause:recover_heirloom"] },
    { id: "child_ct_wm_3_002", role: "child", context: "challenge_thanks", mood: "warm",    levelBand: 3, text: "All three of them! They came home in a line. You herded them, didn't you.", tags: ["cause:find_pet"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "child_ia_wm_0_001", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 0, text: "Biscuit sleeps on my feet now. She never did that before." },
    { id: "child_ia_cu_0_001", role: "child", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "I keep the stone in my pocket every day. It's lucky now for real." },
    { id: "child_ia_wm_0_002", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 0, text: "Splat jumps onto my pillow in the morning. He remembered home." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "child_ia_wm_1_001", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 1, text: "He sleeps by my door every night now. I think he missed me." },
    { id: "child_ia_cu_1_001", role: "child", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "Gran wears the bracelet every Sunday. She asked where it had been." },
    { id: "child_ia_wm_1_002", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 1, text: "My lizard is friendlier since she got back. Good adventure, I guess." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "child_ia_wm_2_001", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 2, text: "She's slower but still purrs. That's what matters." },
    { id: "child_ia_cu_2_001", role: "child", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "Mum shows the box to every visitor now. Your name comes up." },
    { id: "child_ia_wm_2_002", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 2, text: "My hedgehog is braver now. He even explores the garden." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "child_ia_wm_3_001", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 3, text: "She's old but she's home. That's enough for both of us." },
    { id: "child_ia_cu_3_001", role: "child", context: "idle_after_resolve", mood: "curious", levelBand: 3, text: "The locket's in a safe place now. The family says your name when they see it." },
    { id: "child_ia_wm_3_002", role: "child", context: "idle_after_resolve", mood: "warm",    levelBand: 3, text: "All three cats still sleep in a row on the hearth. Like they planned it." },
];
