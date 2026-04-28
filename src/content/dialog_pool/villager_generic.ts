/**
 * Dialog pool — villager_generic role.
 * Generic villagers found in any settlement. Friendly, everyday folk.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const villager_generic: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "villager_generic_g_wm_0_001", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 0, text: "Oh, a new face! Welcome to our little corner of the world." },
    { id: "villager_generic_g_wm_0_002", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 0, text: "You look fresh off the road. Rest your feet a while." },
    { id: "villager_generic_g_cl_0_001", role: "villager_generic", context: "greeting", mood: "calm",    levelBand: 0, text: "Good to see new folks around here." },
    { id: "villager_generic_g_cu_0_001", role: "villager_generic", context: "greeting", mood: "curious", levelBand: 0, text: "Haven't seen you before. Where'd you come from?" },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "villager_generic_g_wm_1_001", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 1, text: "Hey, I've seen you pass through before. Good to have you back." },
    { id: "villager_generic_g_cl_1_001", role: "villager_generic", context: "greeting", mood: "calm",    levelBand: 1, text: "The wanderer returns. How are the roads treating you?" },
    { id: "villager_generic_g_wm_1_002", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers! We were hoping you'd come this way again." },
    { id: "villager_generic_g_cu_1_001", role: "villager_generic", context: "greeting", mood: "curious", levelBand: 1, text: "Heard you've been all over. What's the east like?" },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "villager_generic_g_wm_2_001", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 2, text: "The wanderer of wanderers! To what do we owe the visit?" },
    { id: "villager_generic_g_cl_2_001", role: "villager_generic", context: "greeting", mood: "calm",    levelBand: 2, text: "Rivers. You carry the road with you, don't you." },
    { id: "villager_generic_g_wm_2_002", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 2, text: "My kids ask about you, you know. The great wanderer." },
    { id: "villager_generic_g_cu_2_001", role: "villager_generic", context: "greeting", mood: "curious", levelBand: 2, text: "You've seen the deep wilds. Does it feel different out there?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "villager_generic_g_wm_3_001", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 3, text: "There's a legend walking through my village. Hello, Rivers." },
    { id: "villager_generic_g_cl_3_001", role: "villager_generic", context: "greeting", mood: "calm",    levelBand: 3, text: "You still come here. That means something to us." },
    { id: "villager_generic_g_wy_3_001", role: "villager_generic", context: "greeting", mood: "weary",   levelBand: 3, text: "Roads that long would break most folk. Not you, it seems." },
    { id: "villager_generic_g_wm_3_002", role: "villager_generic", context: "greeting", mood: "warm",    levelBand: 3, text: "Old Rivers, still wandering. I hope you're well." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "villager_generic_a_cl_0_001", role: "villager_generic", context: "ambient", mood: "calm",    levelBand: 0, text: "Quiet day. The kind you remember fondly later." },
    { id: "villager_generic_a_wm_0_001", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 0, text: "The market smells like fresh bread today. Take a look around." },
    { id: "villager_generic_a_cu_0_001", role: "villager_generic", context: "ambient", mood: "curious", levelBand: 0, text: "You carry a capture pod? What've you caught so far?" },
    { id: "villager_generic_a_wy_0_001", role: "villager_generic", context: "ambient", mood: "weary",   levelBand: 0, text: "Long week. But the evenings are nice at least." },
    { id: "villager_generic_a_wm_0_002", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 0, text: "My neighbor's garden is the envy of the whole street." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "villager_generic_a_cl_1_001", role: "villager_generic", context: "ambient", mood: "calm",    levelBand: 1, text: "Season's turning. You can feel it in the air." },
    { id: "villager_generic_a_wm_1_001", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 1, text: "The inn's been busy. Lots of wanderers lately." },
    { id: "villager_generic_a_cu_1_001", role: "villager_generic", context: "ambient", mood: "curious", levelBand: 1, text: "Do the creatures really follow your lead? I'd love to see that." },
    { id: "villager_generic_a_wy_1_001", role: "villager_generic", context: "ambient", mood: "weary",   levelBand: 1, text: "Trade's been slow from the south pass. Something's stirring out there." },
    { id: "villager_generic_a_wm_1_002", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 1, text: "Kids chased a little glowwyrm into the square last night. Adorable chaos." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "villager_generic_a_cl_2_001", role: "villager_generic", context: "ambient", mood: "calm",    levelBand: 2, text: "The old well's been acting up. Keeps humming at night." },
    { id: "villager_generic_a_wm_2_001", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 2, text: "You've probably seen stranger things than our little troubles." },
    { id: "villager_generic_a_cu_2_001", role: "villager_generic", context: "ambient", mood: "curious", levelBand: 2, text: "What's the biggest creature you've ever caught?" },
    { id: "villager_generic_a_wy_2_001", role: "villager_generic", context: "ambient", mood: "weary",   levelBand: 2, text: "Another shriekling spotted near the eastern fence. Third this month." },
    { id: "villager_generic_a_wm_2_002", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 2, text: "I heard a rare {species} was spotted near {biome_feature}. Imagine." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "villager_generic_a_cl_3_001", role: "villager_generic", context: "ambient", mood: "calm",    levelBand: 3, text: "The world keeps changing. At least the sunsets stay the same." },
    { id: "villager_generic_a_wm_3_001", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 3, text: "Stories about you reach us before you do these days." },
    { id: "villager_generic_a_cu_3_001", role: "villager_generic", context: "ambient", mood: "curious", levelBand: 3, text: "Is there anywhere left you haven't been?" },
    { id: "villager_generic_a_wy_3_001", role: "villager_generic", context: "ambient", mood: "weary",   levelBand: 3, text: "The old-timers say things were simpler before the far woods opened up." },
    { id: "villager_generic_a_wm_3_002", role: "villager_generic", context: "ambient", mood: "warm",    levelBand: 3, text: "Whatever you've seen out there, I'm glad you're still in one piece." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "villager_generic_r_cu_0_001", role: "villager_generic", context: "rumor", mood: "curious", levelBand: 0, text: "I heard strange lights near the {biome_feature} last night. Nobody went to check." },
    { id: "villager_generic_r_cl_0_001", role: "villager_generic", context: "rumor", mood: "calm",    levelBand: 0, text: "They say a {species} nests just past the {biome_feature}. Never seen one myself." },
    { id: "villager_generic_r_wm_0_001", role: "villager_generic", context: "rumor", mood: "warm",    levelBand: 0, text: "A traveler said there's an old shrine hidden in the {biome_feature} to the north." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "villager_generic_r_cu_1_001", role: "villager_generic", context: "rumor", mood: "curious", levelBand: 1, text: "Word is there's a whole flock of {species} wintering near {biome_feature}." },
    { id: "villager_generic_r_cl_1_001", role: "villager_generic", context: "rumor", mood: "calm",    levelBand: 1, text: "The old mill east of {biome_feature} has been abandoned. Something drove folks off." },
    { id: "villager_generic_r_wm_1_001", role: "villager_generic", context: "rumor", mood: "warm",    levelBand: 1, text: "I heard a merchant found something valuable near the {biome_feature}. Wouldn't say what." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "villager_generic_r_cu_2_001", role: "villager_generic", context: "rumor", mood: "curious", levelBand: 2, text: "Something big moved through the {biome_feature} last week. Tracks like nothing I've seen." },
    { id: "villager_generic_r_wy_2_001", role: "villager_generic", context: "rumor", mood: "weary",   levelBand: 2, text: "Folks from the {biome_feature} crossing say the night sounds have changed." },
    { id: "villager_generic_r_wm_2_001", role: "villager_generic", context: "rumor", mood: "warm",    levelBand: 2, text: "An elder spotted a ghost-pale {species} past {biome_feature}. Once in a lifetime." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "villager_generic_r_cl_3_001", role: "villager_generic", context: "rumor", mood: "calm",    levelBand: 3, text: "Wanderers from the deep {biome_feature} talk of creatures no one's named yet." },
    { id: "villager_generic_r_cu_3_001", role: "villager_generic", context: "rumor", mood: "curious", levelBand: 3, text: "If anyone could find the lost cave near {biome_feature}, it'd be you." },
    { id: "villager_generic_r_wy_3_001", role: "villager_generic", context: "rumor", mood: "weary",   levelBand: 3, text: "They say the fog near {biome_feature} hides a creature that only shows at dusk." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "villager_generic_co_wm_0_001", role: "villager_generic", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My little cat hasn't come home. Could you look near the {biome_feature}?",    tags: ["cause:find_pet"] },
    { id: "villager_generic_co_cl_0_001", role: "villager_generic", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "I need to get this letter to {named_NPC} across town. My knee's been bad.",     tags: ["cause:deliver_message"] },
    { id: "villager_generic_co_cu_0_001", role: "villager_generic", context: "challenge_offer", mood: "curious", levelBand: 0, text: "I dropped my grandmother's brooch somewhere near {biome_feature}. Help me?", tags: ["cause:recover_heirloom"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "villager_generic_co_wy_1_001", role: "villager_generic", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "There's been a wild {species} scaring folk near {biome_feature}. Worth a look?",  tags: ["cause:defeat_threat"] },
    { id: "villager_generic_co_wm_1_001", role: "villager_generic", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "Can you fetch {count} bundles of {item} from the trader past {biome_feature}?",   tags: ["cause:fetch_item"] },
    { id: "villager_generic_co_cl_1_001", role: "villager_generic", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "Two neighbors are in a spat over a fence. Any chance you could mediate?",          tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "villager_generic_co_wm_2_001", role: "villager_generic", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "Could you deliver this parcel to {named_NPC} by the {biome_feature} crossing?",  tags: ["cause:deliver_item"] },
    { id: "villager_generic_co_wy_2_001", role: "villager_generic", context: "challenge_offer", mood: "weary",   levelBand: 2, text: "My old hound ran toward {biome_feature} and I can't follow. Please find him.",  tags: ["cause:find_pet"] },
    { id: "villager_generic_co_cu_2_001", role: "villager_generic", context: "challenge_offer", mood: "curious", levelBand: 2, text: "We haven't heard from the scouts near {biome_feature} in days. Could you check?", tags: ["cause:survey"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "villager_generic_co_cl_3_001", role: "villager_generic", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "You're the only one I'd trust to escort {named_NPC} safely to the next town.",  tags: ["cause:escort"] },
    { id: "villager_generic_co_wm_3_001", role: "villager_generic", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "My family's lantern was taken near {biome_feature}. You'd know where to look.", tags: ["cause:recover_heirloom"] },
    { id: "villager_generic_co_wy_3_001", role: "villager_generic", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "Someone needs to stand watch at the {biome_feature} crossing tonight. I'm spent.", tags: ["cause:guard_spot"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "villager_generic_ct_wm_0_001", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "Oh, you found her! She was so scared. Thank you, truly.",             tags: ["cause:find_pet"] },
    { id: "villager_generic_ct_wm_0_002", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "{named_NPC} said you delivered it perfectly. That was so kind.",      tags: ["cause:deliver_message"] },
    { id: "villager_generic_ct_cl_0_001", role: "villager_generic", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "You found it. I thought it was gone forever. I'm so relieved.",       tags: ["cause:recover_heirloom"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "villager_generic_ct_wm_1_001", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "It's quiet now. I can't believe how quickly you sorted that out.",      tags: ["cause:defeat_threat"] },
    { id: "villager_generic_ct_wm_1_002", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "You even got the good stuff. Here, take this — you earned it.",         tags: ["cause:fetch_item"] },
    { id: "villager_generic_ct_cl_1_001", role: "villager_generic", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "They shook hands. I didn't think that was possible. Well done.",        tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "villager_generic_ct_wm_2_001", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "{named_NPC} is safe and the parcel arrived. You're a lifesaver.",        tags: ["cause:deliver_item"] },
    { id: "villager_generic_ct_wm_2_002", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "He came home muddy and tired but in one piece. Thank you so much.",      tags: ["cause:find_pet"] },
    { id: "villager_generic_ct_cu_2_001", role: "villager_generic", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "The scouts are back safe. Your report will help everyone. Really.", tags: ["cause:survey"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "villager_generic_ct_wm_3_001", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "{named_NPC} made it through safely. I owe you more than gold.",          tags: ["cause:escort"] },
    { id: "villager_generic_ct_wm_3_002", role: "villager_generic", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "My grandmother would cry if she saw this. You brought it home.",          tags: ["cause:recover_heirloom"] },
    { id: "villager_generic_ct_cl_3_001", role: "villager_generic", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The crossing held all night. Thanks to you, it always will feel safer.", tags: ["cause:guard_spot"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "villager_generic_ia_wm_0_001", role: "villager_generic", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "She's curled up by the hearth now. Hasn't moved since you brought her back." },
    { id: "villager_generic_ia_cl_0_001", role: "villager_generic", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "The message got through. Things are a lot calmer now." },
    { id: "villager_generic_ia_wm_0_002", role: "villager_generic", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "I still can't believe you found it. I'll treasure it." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "villager_generic_ia_cl_1_001", role: "villager_generic", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Quiet round here now. Your help made a real difference." },
    { id: "villager_generic_ia_wm_1_001", role: "villager_generic", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "They sorted things out. Haven't heard a cross word since." },
    { id: "villager_generic_ia_cu_1_001", role: "villager_generic", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "You've got a gift for this kind of thing. Does it come naturally?" },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "villager_generic_ia_cl_2_001", role: "villager_generic", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "People still talk about what you did. A small legend in the making." },
    { id: "villager_generic_ia_wm_2_001", role: "villager_generic", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "I see the {biome_feature} differently now. Thanks to you." },
    { id: "villager_generic_ia_wy_2_001", role: "villager_generic", context: "idle_after_resolve", mood: "weary", levelBand: 2, text: "One less thing to worry about. That's more than I can say most days." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "villager_generic_ia_cl_3_001", role: "villager_generic", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "You've quietly fixed so many things here. Not sure you know that." },
    { id: "villager_generic_ia_wm_3_001", role: "villager_generic", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "Every time you visit, something gets a little better. That's a rare gift." },
    { id: "villager_generic_ia_wy_3_001", role: "villager_generic", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Places like this need someone like you to pass through now and then." },
];
