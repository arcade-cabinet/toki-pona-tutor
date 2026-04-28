/**
 * Dialog pool — wanderer role.
 * Fellow wanderers met on roads and crossings. No fixed home.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: escort, deliver_message, deliver_item (common).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const wanderer: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "wanderer_g_wm_0_001", role: "wanderer", context: "greeting", mood: "warm",    levelBand: 0, text: "Another traveler! A rare joy on an empty road." },
    { id: "wanderer_g_cu_0_001", role: "wanderer", context: "greeting", mood: "curious", levelBand: 0, text: "You're new to the road. I can tell. Where's your pack from?" },
    { id: "wanderer_g_cl_0_001", role: "wanderer", context: "greeting", mood: "calm",    levelBand: 0, text: "Good roads to you. Mind the low bridge past {biome_feature}." },
    { id: "wanderer_g_wy_0_001", role: "wanderer", context: "greeting", mood: "weary",   levelBand: 0, text: "Three days walking. My boots have opinions." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "wanderer_g_wm_1_001", role: "wanderer", context: "greeting", mood: "warm",    levelBand: 1, text: "I think I've seen you at a crossroads before. Rivers, right?" },
    { id: "wanderer_g_cl_1_001", role: "wanderer", context: "greeting", mood: "calm",    levelBand: 1, text: "Fellow traveler. The east road or the west?" },
    { id: "wanderer_g_cu_1_001", role: "wanderer", context: "greeting", mood: "curious", levelBand: 1, text: "Your creatures are well-trained. How'd you do that so young?" },
    { id: "wanderer_g_wy_1_001", role: "wanderer", context: "greeting", mood: "weary",   levelBand: 1, text: "The {biome_feature} pass is rough this season. You'll want to rest first." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "wanderer_g_wm_2_001", role: "wanderer", context: "greeting", mood: "warm",    levelBand: 2, text: "Rivers! I was hoping I'd run into you out here." },
    { id: "wanderer_g_cl_2_001", role: "wanderer", context: "greeting", mood: "calm",    levelBand: 2, text: "Two wanderers meeting in the wild. That's something." },
    { id: "wanderer_g_cu_2_001", role: "wanderer", context: "greeting", mood: "curious", levelBand: 2, text: "They say you've been to the far reaches. Is it as strange as they claim?" },
    { id: "wanderer_g_wy_2_001", role: "wanderer", context: "greeting", mood: "weary",   levelBand: 2, text: "Long roads. Good to cross paths with someone who understands." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "wanderer_g_wm_3_001", role: "wanderer", context: "greeting", mood: "warm",    levelBand: 3, text: "The most traveled wanderer on the roads. I'm honored." },
    { id: "wanderer_g_cl_3_001", role: "wanderer", context: "greeting", mood: "calm",    levelBand: 3, text: "We've been out here a long time, both of us. The road agrees." },
    { id: "wanderer_g_wy_3_001", role: "wanderer", context: "greeting", mood: "weary",   levelBand: 3, text: "Years on the road and I still find you somewhere I least expect." },
    { id: "wanderer_g_cu_3_001", role: "wanderer", context: "greeting", mood: "curious", levelBand: 3, text: "When you look back at everywhere you've been, what do you feel?" },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "wanderer_a_cl_0_001", role: "wanderer", context: "ambient", mood: "calm",    levelBand: 0, text: "The road tells you things if you listen. Takes time to hear it." },
    { id: "wanderer_a_wm_0_001", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 0, text: "I've got dried fruit and a spare bedroll. Help yourself." },
    { id: "wanderer_a_cu_0_001", role: "wanderer", context: "ambient", mood: "curious", levelBand: 0, text: "Have you tried camping near {biome_feature}? The sounds at night are wonderful." },
    { id: "wanderer_a_wy_0_001", role: "wanderer", context: "ambient", mood: "weary",   levelBand: 0, text: "Some nights you just need to rest before the next hill." },
    { id: "wanderer_a_wm_0_002", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 0, text: "First creature I ever caught was a stumbling little thing. Still love them all." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "wanderer_a_cl_1_001", role: "wanderer", context: "ambient", mood: "calm",    levelBand: 1, text: "I've been to six villages this season. Each one different in small ways." },
    { id: "wanderer_a_wm_1_001", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 1, text: "Road friendships are brief but they mean something." },
    { id: "wanderer_a_cu_1_001", role: "wanderer", context: "ambient", mood: "curious", levelBand: 1, text: "I've been trying to find the path past {biome_feature} that my map marks but doesn't name." },
    { id: "wanderer_a_wy_1_001", role: "wanderer", context: "ambient", mood: "weary",   levelBand: 1, text: "This stretch of road has been harder than I remembered." },
    { id: "wanderer_a_wm_1_002", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 1, text: "I always leave a mark at good campsites. Others do the same. We look out for each other." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "wanderer_a_cl_2_001", role: "wanderer", context: "ambient", mood: "calm",    levelBand: 2, text: "The world is bigger than anyone tells you when you start. That's not a complaint." },
    { id: "wanderer_a_wm_2_001", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 2, text: "I've been following a creature that only appears near {biome_feature} at certain hours." },
    { id: "wanderer_a_cu_2_001", role: "wanderer", context: "ambient", mood: "curious", levelBand: 2, text: "Different wanderers, same sky. You ever think about that?" },
    { id: "wanderer_a_wy_2_001", role: "wanderer", context: "ambient", mood: "weary",   levelBand: 2, text: "The miles don't bother me. It's the goodbyes." },
    { id: "wanderer_a_wm_2_002", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 2, text: "I saw a {species} in the morning mist near {biome_feature}. Stood there for an age." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "wanderer_a_cl_3_001", role: "wanderer", context: "ambient", mood: "calm",    levelBand: 3, text: "The world rewards the ones who stay curious. You've kept that. I can tell." },
    { id: "wanderer_a_wm_3_001", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 3, text: "When they tell stories about you someday, I hope they get the small kindnesses right." },
    { id: "wanderer_a_cu_3_001", role: "wanderer", context: "ambient", mood: "curious", levelBand: 3, text: "Is there a place you keep coming back to? Everyone has one." },
    { id: "wanderer_a_wy_3_001", role: "wanderer", context: "ambient", mood: "weary",   levelBand: 3, text: "Long roads. Fine roads. The same roads, somehow." },
    { id: "wanderer_a_wm_3_002", role: "wanderer", context: "ambient", mood: "warm",    levelBand: 3, text: "I hope wherever the road takes you next, the weather's fair." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "wanderer_r_cu_0_001", role: "wanderer", context: "rumor", mood: "curious", levelBand: 0, text: "A fellow traveler told me of glowing caves past {biome_feature}. Wouldn't lie." },
    { id: "wanderer_r_cl_0_001", role: "wanderer", context: "rumor", mood: "calm",    levelBand: 0, text: "The path northeast past {biome_feature} gets strange at night. I detoured." },
    { id: "wanderer_r_wm_0_001", role: "wanderer", context: "rumor", mood: "warm",    levelBand: 0, text: "I heard a wanderer found a hidden valley near {biome_feature}. Nobody's named it yet." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "wanderer_r_cu_1_001", role: "wanderer", context: "rumor", mood: "curious", levelBand: 1, text: "The crossing at {biome_feature} — folk say it shifts overnight. I believe them." },
    { id: "wanderer_r_wy_1_001", role: "wanderer", context: "rumor", mood: "weary",   levelBand: 1, text: "Three wanderers I know have gone past {biome_feature} and come back... quieter." },
    { id: "wanderer_r_wm_1_001", role: "wanderer", context: "rumor", mood: "warm",    levelBand: 1, text: "Old camp near {biome_feature} has fresh fire marks. Someone's been there recently." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "wanderer_r_cu_2_001", role: "wanderer", context: "rumor", mood: "curious", levelBand: 2, text: "I spotted an unusually large {species} sleeping near {biome_feature} at midday." },
    { id: "wanderer_r_wy_2_001", role: "wanderer", context: "rumor", mood: "weary",   levelBand: 2, text: "A road I've walked a hundred times felt wrong last month near {biome_feature}." },
    { id: "wanderer_r_cl_2_001", role: "wanderer", context: "rumor", mood: "calm",    levelBand: 2, text: "Map shows a ruin near {biome_feature} that all the other maps just leave blank." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "wanderer_r_cl_3_001", role: "wanderer", context: "rumor", mood: "calm",    levelBand: 3, text: "The oldest road on my map ends at {biome_feature}. What was past it? Nobody knows." },
    { id: "wanderer_r_cu_3_001", role: "wanderer", context: "rumor", mood: "curious", levelBand: 3, text: "I've heard a {species} lives near {biome_feature} that no one has ever caught." },
    { id: "wanderer_r_wm_3_001", role: "wanderer", context: "rumor", mood: "warm",    levelBand: 3, text: "Far south of {biome_feature}, wanderers talk of a gathering place. Untouched, they say." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "wanderer_co_cl_0_001", role: "wanderer", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "I've got a message for {named_NPC} in the next town. Hurt my ankle, though.",       tags: ["cause:deliver_message"] },
    { id: "wanderer_co_wm_0_001", role: "wanderer", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "This parcel needs to reach {named_NPC} today. My road goes the other way.",          tags: ["cause:deliver_item"] },
    { id: "wanderer_co_cu_0_001", role: "wanderer", context: "challenge_offer", mood: "curious", levelBand: 0, text: "A nervous traveler on this road asked if anyone would walk with them. Could you?",   tags: ["cause:escort"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "wanderer_co_cl_1_001", role: "wanderer", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "I promised to get word to {named_NPC} before nightfall. Could you carry it forward?", tags: ["cause:deliver_message"] },
    { id: "wanderer_co_wm_1_001", role: "wanderer", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "I've been carrying this {item} for {named_NPC} for two days. Could you finish the run?", tags: ["cause:deliver_item"] },
    { id: "wanderer_co_wy_1_001", role: "wanderer", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "An elder I met won't travel alone to {biome_feature}. You're more capable than I am.", tags: ["cause:escort"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "wanderer_co_cl_2_001", role: "wanderer", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "This letter needs to reach {named_NPC} past {biome_feature}. Time-sensitive.",         tags: ["cause:deliver_message"] },
    { id: "wanderer_co_wm_2_001", role: "wanderer", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "A family in the next valley needs this {item} delivered. I won't make it in time.",  tags: ["cause:deliver_item"] },
    { id: "wanderer_co_cu_2_001", role: "wanderer", context: "challenge_offer", mood: "curious", levelBand: 2, text: "A skittish historian needs to reach the ruins past {biome_feature}. Escort?" ,          tags: ["cause:escort"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "wanderer_co_cl_3_001", role: "wanderer", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "An urgent message needs to reach {named_NPC} in the deep village near {biome_feature}.", tags: ["cause:deliver_message"] },
    { id: "wanderer_co_wm_3_001", role: "wanderer", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "I've been asked to bring {item} to {named_NPC} but I'm heading the wrong way entirely.", tags: ["cause:deliver_item"] },
    { id: "wanderer_co_wy_3_001", role: "wanderer", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "A lone elder wants to travel the {biome_feature} road. Only someone trusted could escort them.", tags: ["cause:escort"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "wanderer_ct_wm_0_001", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "Word got through! You're faster than I expected. Thank you.",           tags: ["cause:deliver_message"] },
    { id: "wanderer_ct_wm_0_002", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "The parcel arrived safe. You're a good road-friend.",                    tags: ["cause:deliver_item"] },
    { id: "wanderer_ct_cl_0_001", role: "wanderer", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "They made it through. You walking with them made all the difference.",  tags: ["cause:escort"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "wanderer_ct_wm_1_001", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "{named_NPC} got the message on time. You kept a promise for me.",        tags: ["cause:deliver_message"] },
    { id: "wanderer_ct_cl_1_001", role: "wanderer", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "Delivery complete and intact. A wanderer's honor.",                      tags: ["cause:deliver_item"] },
    { id: "wanderer_ct_wm_1_002", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "The elder made it safe. Said you barely spoke but that was enough.",     tags: ["cause:escort"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "wanderer_ct_wm_2_001", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The letter reached them before dark. You move faster than gossip.",       tags: ["cause:deliver_message"] },
    { id: "wanderer_ct_cl_2_001", role: "wanderer", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "Family received it with tears. You don't know what that meant to them.",  tags: ["cause:deliver_item"] },
    { id: "wanderer_ct_cu_2_001", role: "wanderer", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "They said the road didn't feel lonely with you there. I believe it.", tags: ["cause:escort"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "wanderer_ct_wm_3_001", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "Message delivered, deep in the wilds. Only you could have done that.",  tags: ["cause:deliver_message"] },
    { id: "wanderer_ct_cl_3_001", role: "wanderer", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The item arrived without a scratch. You're everything they say you are.",  tags: ["cause:deliver_item"] },
    { id: "wanderer_ct_wm_3_002", role: "wanderer", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The elder said you made them feel like a wanderer for a day. Priceless.",  tags: ["cause:escort"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "wanderer_ia_wm_0_001", role: "wanderer", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "That worked out. Road friendships earned fast." },
    { id: "wanderer_ia_cl_0_001", role: "wanderer", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "A message delivered, a debt settled. Clean feeling." },
    { id: "wanderer_ia_cu_0_001", role: "wanderer", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "I wonder if they knew it was you who helped." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "wanderer_ia_cl_1_001", role: "wanderer", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "The road felt lighter after that. Funny how helping someone does that." },
    { id: "wanderer_ia_wm_1_001", role: "wanderer", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "I'll tell that story at the next campfire. With your name in it." },
    { id: "wanderer_ia_wy_1_001", role: "wanderer", context: "idle_after_resolve", mood: "weary", levelBand: 1, text: "The best part about wandering is moments like that one." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "wanderer_ia_cl_2_001", role: "wanderer", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "Every wanderer leaves something good behind. You do more than most." },
    { id: "wanderer_ia_wm_2_001", role: "wanderer", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "The road gets better when the right folk travel it." },
    { id: "wanderer_ia_cu_2_001", role: "wanderer", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "I've started leaving notes at crossings. Maybe you'll find one someday." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "wanderer_ia_cl_3_001", role: "wanderer", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "Years of wandering and I'd say you're the best I've shared a road with." },
    { id: "wanderer_ia_wm_3_001", role: "wanderer", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "When they tell the stories, I'll make sure your name stays in them." },
    { id: "wanderer_ia_wy_3_001", role: "wanderer", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long roads. Good deeds. That's all any of us can hope for." },
];
