/**
 * Dialog pool — innkeep role.
 * Innkeepers running resting places in villages.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: deliver_message, escort (common); fetch_item (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const innkeep: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "innkeep_g_wm_0_001", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 0, text: "Welcome, wanderer. Hot food and a warm bed if you need them." },
    { id: "innkeep_g_cl_0_001", role: "innkeep", context: "greeting", mood: "calm",    levelBand: 0, text: "Come in. We've got room. Rest your pack." },
    { id: "innkeep_g_cu_0_001", role: "innkeep", context: "greeting", mood: "curious", levelBand: 0, text: "Haven't seen you before. Long journey?" },
    { id: "innkeep_g_wy_0_001", role: "innkeep", context: "greeting", mood: "weary",   levelBand: 0, text: "Busy evening, but you're welcome. Find a seat." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "innkeep_g_wm_1_001", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers! Your usual corner's free. I remembered." },
    { id: "innkeep_g_cl_1_001", role: "innkeep", context: "greeting", mood: "calm",    levelBand: 1, text: "Back again. Soup's on, same as always." },
    { id: "innkeep_g_cu_1_001", role: "innkeep", context: "greeting", mood: "curious", levelBand: 1, text: "Where'd you come from this time? You look like you've been far." },
    { id: "innkeep_g_wy_1_001", role: "innkeep", context: "greeting", mood: "weary",   levelBand: 1, text: "Half the village in tonight. You're the easy customer." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "innkeep_g_wm_2_001", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 2, text: "The experienced wanderer! Best room's ready, no extra charge." },
    { id: "innkeep_g_cl_2_001", role: "innkeep", context: "greeting", mood: "calm",    levelBand: 2, text: "Rivers. Glad you made it. The road's been rough lately." },
    { id: "innkeep_g_wm_2_002", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 2, text: "You always bring good stories. The regulars have been waiting." },
    { id: "innkeep_g_cu_2_001", role: "innkeep", context: "greeting", mood: "curious", levelBand: 2, text: "I heard you went past {biome_feature}. What's the inn like out there?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "innkeep_g_wm_3_001", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 3, text: "A legend under my roof. The honor's truly mine." },
    { id: "innkeep_g_cl_3_001", role: "innkeep", context: "greeting", mood: "calm",    levelBand: 3, text: "The best wanderer on the roads. Sit, eat. You've earned it." },
    { id: "innkeep_g_wm_3_002", role: "innkeep", context: "greeting", mood: "warm",    levelBand: 3, text: "I still tell the story of the time you passed through. New guests love it." },
    { id: "innkeep_g_wy_3_001", role: "innkeep", context: "greeting", mood: "weary",   levelBand: 3, text: "Long roads both of us. Come in. The fire's warm." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "innkeep_a_cl_0_001", role: "innkeep", context: "ambient", mood: "calm",    levelBand: 0, text: "You learn a lot about a place from who passes through." },
    { id: "innkeep_a_wm_0_001", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 0, text: "The stew is the same recipe my mother used. Never changed it." },
    { id: "innkeep_a_cu_0_001", role: "innkeep", context: "ambient", mood: "curious", levelBand: 0, text: "A wanderer came through yesterday with a {species}. It purred all evening." },
    { id: "innkeep_a_wy_0_001", role: "innkeep", context: "ambient", mood: "weary",   levelBand: 0, text: "Busy night. Good busy, just tiring." },
    { id: "innkeep_a_wm_0_002", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 0, text: "The fire's always going. First rule of a good inn." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "innkeep_a_cl_1_001", role: "innkeep", context: "ambient", mood: "calm",    levelBand: 1, text: "Word travels fast through inns. I know things before the village does." },
    { id: "innkeep_a_wm_1_001", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 1, text: "Wanderers from the east say the {biome_feature} road is spectacular this season." },
    { id: "innkeep_a_cu_1_001", role: "innkeep", context: "ambient", mood: "curious", levelBand: 1, text: "What do wanderers eat when there's no inn around? Genuinely curious." },
    { id: "innkeep_a_wy_1_001", role: "innkeep", context: "ambient", mood: "weary",   levelBand: 1, text: "The roof needs patching. Always something with an old inn." },
    { id: "innkeep_a_wm_1_002", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 1, text: "A regular traveler sat right there and cried happy tears last night. Beautiful." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "innkeep_a_cl_2_001", role: "innkeep", context: "ambient", mood: "calm",    levelBand: 2, text: "The inn's been in my family three generations. The regulars are like family too." },
    { id: "innkeep_a_wm_2_001", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 2, text: "Wanderers come and go, but the best ones leave something behind." },
    { id: "innkeep_a_cu_2_001", role: "innkeep", context: "ambient", mood: "curious", levelBand: 2, text: "A party of wanderers came through and said something strange past {biome_feature}." },
    { id: "innkeep_a_wy_2_001", role: "innkeep", context: "ambient", mood: "weary",   levelBand: 2, text: "Toughest stretch in a while. Strange weather, strange travelers." },
    { id: "innkeep_a_wm_2_002", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 2, text: "Every story I hear at this bar is someone's whole world. I never take that lightly." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "innkeep_a_cl_3_001", role: "innkeep", context: "ambient", mood: "calm",    levelBand: 3, text: "Thirty years running this inn. Still my favorite job in the world." },
    { id: "innkeep_a_wm_3_001", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 3, text: "The best wanderers make you feel like you went on the journey too." },
    { id: "innkeep_a_cu_3_001", role: "innkeep", context: "ambient", mood: "curious", levelBand: 3, text: "Is there anywhere you haven't rested your head? I have rooms to suggest." },
    { id: "innkeep_a_wy_3_001", role: "innkeep", context: "ambient", mood: "weary",   levelBand: 3, text: "The inn creaks louder each year. So do I." },
    { id: "innkeep_a_wm_3_002", role: "innkeep", context: "ambient", mood: "warm",    levelBand: 3, text: "You make this place feel exactly like what it's supposed to be." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "innkeep_r_cu_0_001", role: "innkeep", context: "rumor", mood: "curious", levelBand: 0, text: "A traveler last night said there's an old shrine hidden near {biome_feature}." },
    { id: "innkeep_r_cl_0_001", role: "innkeep", context: "rumor", mood: "calm",    levelBand: 0, text: "Word from the road says the {biome_feature} crossing floods in odd seasons." },
    { id: "innkeep_r_wm_0_001", role: "innkeep", context: "rumor", mood: "warm",    levelBand: 0, text: "Three wanderers talked all night about a {species} spotted near {biome_feature}." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "innkeep_r_wm_1_001", role: "innkeep", context: "rumor", mood: "warm",    levelBand: 1, text: "Table of travelers last night swore there's treasure in the {biome_feature} ruins." },
    { id: "innkeep_r_cu_1_001", role: "innkeep", context: "rumor", mood: "curious", levelBand: 1, text: "A weeping traveler came in — said they lost something important near {biome_feature}." },
    { id: "innkeep_r_wy_1_001", role: "innkeep", context: "rumor", mood: "weary",   levelBand: 1, text: "Road past {biome_feature} has had two accidents in a week. Something's off." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "innkeep_r_cl_2_001", role: "innkeep", context: "rumor", mood: "calm",    levelBand: 2, text: "The inn at {biome_feature} closed last season. Nowhere to rest between here and there." },
    { id: "innkeep_r_cu_2_001", role: "innkeep", context: "rumor", mood: "curious", levelBand: 2, text: "A wanderer described a {species} unlike any in the books, near {biome_feature}." },
    { id: "innkeep_r_wm_2_001", role: "innkeep", context: "rumor", mood: "warm",    levelBand: 2, text: "They say the cook at the {biome_feature} village makes legendary meals. I'm jealous." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "innkeep_r_cl_3_001", role: "innkeep", context: "rumor", mood: "calm",    levelBand: 3, text: "The deep roads past {biome_feature} are safer than they've been in years." },
    { id: "innkeep_r_cu_3_001", role: "innkeep", context: "rumor", mood: "curious", levelBand: 3, text: "The {biome_feature} area wanderer community has gone quiet. Concerning." },
    { id: "innkeep_r_wm_3_001", role: "innkeep", context: "rumor", mood: "warm",    levelBand: 3, text: "A rare {species} was seen near {biome_feature}. Your kind of thing, I'd think." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "innkeep_co_wm_0_001", role: "innkeep", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "I have a letter for {named_NPC} in the next village. Could you carry it?",            tags: ["cause:deliver_message"] },
    { id: "innkeep_co_cl_0_001", role: "innkeep", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "A nervous guest needs to reach the shrine past {biome_feature}. Company helps.",      tags: ["cause:escort"] },
    { id: "innkeep_co_cu_0_001", role: "innkeep", context: "challenge_offer", mood: "curious", levelBand: 0, text: "My supply run is overdue. Could you fetch {item} from past {biome_feature}?",         tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "innkeep_co_wm_1_001", role: "innkeep", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "A regular guest left without this message. Could you catch up to them?",             tags: ["cause:deliver_message"] },
    { id: "innkeep_co_cl_1_001", role: "innkeep", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "Elderly guest heading to the {biome_feature} village alone. I worry about the road.", tags: ["cause:escort"] },
    { id: "innkeep_co_wy_1_001", role: "innkeep", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "My spice order didn't arrive from past {biome_feature}. Help if you fetched it.",    tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "innkeep_co_cl_2_001", role: "innkeep", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "This letter needs to reach {named_NPC} before the harvest feast. Urgent.",            tags: ["cause:deliver_message"] },
    { id: "innkeep_co_wm_2_001", role: "innkeep", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "A quiet scholar wants to travel to {biome_feature}. Wouldn't ask just anyone.",      tags: ["cause:escort"] },
    { id: "innkeep_co_cu_2_001", role: "innkeep", context: "challenge_offer", mood: "curious", levelBand: 2, text: "Rare {item} I need for the kitchen exists near {biome_feature}. Worth the trip.",    tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "innkeep_co_cl_3_001", role: "innkeep", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "Word must reach {named_NPC} deep past {biome_feature}. Only you'd find them.",        tags: ["cause:deliver_message"] },
    { id: "innkeep_co_wm_3_001", role: "innkeep", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "A dear old regular wants one last trip to {biome_feature}. Please go with them.",    tags: ["cause:escort"] },
    { id: "innkeep_co_wy_3_001", role: "innkeep", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "The special ingredient for gran's recipe only grows near {biome_feature}.",           tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "innkeep_ct_wm_0_001", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "Message delivered! The whole evening felt lighter after that.",              tags: ["cause:deliver_message"] },
    { id: "innkeep_ct_wm_0_002", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "They arrived safe and said the road felt fine. Thank you.",                  tags: ["cause:escort"] },
    { id: "innkeep_ct_cl_0_001", role: "innkeep", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "Got the {item} in. Tonight's supper just got a lot better.",                 tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "innkeep_ct_wm_1_001", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "The guest wrote back already! You work fast.",                               tags: ["cause:deliver_message"] },
    { id: "innkeep_ct_cl_1_001", role: "innkeep", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "My regular made it safely. Said they'd be back because of you.",             tags: ["cause:escort"] },
    { id: "innkeep_ct_wy_1_001", role: "innkeep", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "Kitchen's back to full flavor. Couldn't have done without the {item}.",      tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "innkeep_ct_wm_2_001", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "{named_NPC} replied that your timing was perfect. You saved something real.",  tags: ["cause:deliver_message"] },
    { id: "innkeep_ct_cl_2_001", role: "innkeep", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The scholar arrived and immediately booked three more nights. You set that up.", tags: ["cause:escort"] },
    { id: "innkeep_ct_wm_2_002", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The {item} is remarkable. I'll name the dish after you.",                    tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "innkeep_ct_wm_3_001", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "Word reached them in time. You're the only one who could have done it.",     tags: ["cause:deliver_message"] },
    { id: "innkeep_ct_wm_3_002", role: "innkeep", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "They made the journey they'd dreamed of. Your escort made it real.",          tags: ["cause:escort"] },
    { id: "innkeep_ct_cl_3_001", role: "innkeep", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The recipe lives on. My grandmother's gift, restored. I'm in your debt.",    tags: ["cause:fetch_item"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "innkeep_ia_wm_0_001", role: "innkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "Room's been quiet in the best way since then." },
    { id: "innkeep_ia_cl_0_001", role: "innkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "Good deed, good soup. A fine evening." },
    { id: "innkeep_ia_cu_0_001", role: "innkeep", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "They sent a letter back. I read it twice." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "innkeep_ia_cl_1_001", role: "innkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "The inn feels more settled since that was sorted." },
    { id: "innkeep_ia_wm_1_001", role: "innkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "New regular came in because of the good word you spread. Thank you." },
    { id: "innkeep_ia_wy_1_001", role: "innkeep", context: "idle_after_resolve", mood: "weary", levelBand: 1, text: "One good thing a day is all you need. You supplied it." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "innkeep_ia_cl_2_001", role: "innkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "The inn's been at full rooms most nights since then." },
    { id: "innkeep_ia_wm_2_001", role: "innkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "That dish is the most popular on the menu now. Named it Rivers's Request." },
    { id: "innkeep_ia_cu_2_001", role: "innkeep", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "People come in asking about the wanderer who helped. I give them your name." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "innkeep_ia_cl_3_001", role: "innkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "Best stretch the inn's had. Good people bring good luck." },
    { id: "innkeep_ia_wm_3_001", role: "innkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "I'd put your name above the door if you'd let me." },
    { id: "innkeep_ia_wy_3_001", role: "innkeep", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long life in innkeeping. People like you make it the right choice." },
];
