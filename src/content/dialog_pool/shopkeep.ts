/**
 * Dialog pool — shopkeep role.
 * Merchants running shops in villages.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: fetch_item, deliver_item (common).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const shopkeep: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "shopkeep_g_wm_0_001", role: "shopkeep", context: "greeting", mood: "warm",    levelBand: 0, text: "Welcome in! Have a look around, no pressure." },
    { id: "shopkeep_g_cl_0_001", role: "shopkeep", context: "greeting", mood: "calm",    levelBand: 0, text: "Traveler. Good stock today, if you need supplies." },
    { id: "shopkeep_g_cu_0_001", role: "shopkeep", context: "greeting", mood: "curious", levelBand: 0, text: "New wanderer? Let me know if you need anything." },
    { id: "shopkeep_g_wy_0_001", role: "shopkeep", context: "greeting", mood: "weary",   levelBand: 0, text: "Come in. I'm open, just tired." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "shopkeep_g_wm_1_001", role: "shopkeep", context: "greeting", mood: "warm",    levelBand: 1, text: "Back again! I kept some of the good stuff for regular customers." },
    { id: "shopkeep_g_cl_1_001", role: "shopkeep", context: "greeting", mood: "calm",    levelBand: 1, text: "Rivers. Good to see you. The inventory's been restocked." },
    { id: "shopkeep_g_cu_1_001", role: "shopkeep", context: "greeting", mood: "curious", levelBand: 1, text: "You've been out there. What's selling in the far villages?" },
    { id: "shopkeep_g_wy_1_001", role: "shopkeep", context: "greeting", mood: "weary",   levelBand: 1, text: "Busy week. But you're a good customer, so come in." },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "shopkeep_g_wm_2_001", role: "shopkeep", context: "greeting", mood: "warm",    levelBand: 2, text: "The wanderer returns! I've held back something special." },
    { id: "shopkeep_g_cl_2_001", role: "shopkeep", context: "greeting", mood: "calm",    levelBand: 2, text: "A customer worth keeping. Welcome back, Rivers." },
    { id: "shopkeep_g_cu_2_001", role: "shopkeep", context: "greeting", mood: "curious", levelBand: 2, text: "You've been to the deep wilds. I bet you've seen some rare finds." },
    { id: "shopkeep_g_wm_2_002", role: "shopkeep", context: "greeting", mood: "warm",    levelBand: 2, text: "Experienced wanderers deserve quality goods. I'll see you right." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "shopkeep_g_wm_3_001", role: "shopkeep", context: "greeting", mood: "warm",    levelBand: 3, text: "A legend of the roads at my counter. The honor is mine." },
    { id: "shopkeep_g_cl_3_001", role: "shopkeep", context: "greeting", mood: "calm",    levelBand: 3, text: "You know what you want. I'll just make sure I have it." },
    { id: "shopkeep_g_wy_3_001", role: "shopkeep", context: "greeting", mood: "weary",   levelBand: 3, text: "Long road for both of us. Come in, I've got the good stuff out." },
    { id: "shopkeep_g_cu_3_001", role: "shopkeep", context: "greeting", mood: "curious", levelBand: 3, text: "Every time you come through, the stock looks better. You inspire me." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "shopkeep_a_cl_0_001", role: "shopkeep", context: "ambient", mood: "calm",    levelBand: 0, text: "Capture pods sell fastest in spring. Makes sense." },
    { id: "shopkeep_a_wm_0_001", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 0, text: "Got a new shipment of trail mix in. Wanderers love it." },
    { id: "shopkeep_a_cu_0_001", role: "shopkeep", context: "ambient", mood: "curious", levelBand: 0, text: "What do creatures eat on the road? I could stock it." },
    { id: "shopkeep_a_wy_0_001", role: "shopkeep", context: "ambient", mood: "weary",   levelBand: 0, text: "Prices from the northern supplier went up again. Not my choice." },
    { id: "shopkeep_a_wm_0_002", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 0, text: "If you find something rare out there, I'm always interested." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "shopkeep_a_cl_1_001", role: "shopkeep", context: "ambient", mood: "calm",    levelBand: 1, text: "The {biome_feature} road is good for trade right now. Lots of travelers." },
    { id: "shopkeep_a_wm_1_001", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 1, text: "I give wanderers a fair deal. Word travels, and so do they." },
    { id: "shopkeep_a_cu_1_001", role: "shopkeep", context: "ambient", mood: "curious", levelBand: 1, text: "Heard about a shop past {biome_feature} that sells items I've never seen. Intriguing." },
    { id: "shopkeep_a_wy_1_001", role: "shopkeep", context: "ambient", mood: "weary",   levelBand: 1, text: "Supply chain's been rough. Got half my usual {item} stock in." },
    { id: "shopkeep_a_wm_1_002", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 1, text: "My best customers are the ones who come back. You're one of them." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "shopkeep_a_cl_2_001", role: "shopkeep", context: "ambient", mood: "calm",    levelBand: 2, text: "I source from three villages now. Takes work but the quality shows." },
    { id: "shopkeep_a_wm_2_001", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 2, text: "When wanderers do well, my shop does well. Mutual benefit." },
    { id: "shopkeep_a_cu_2_001", role: "shopkeep", context: "ambient", mood: "curious", levelBand: 2, text: "The {species} trade has shifted. More wanderers catching them, fewer selling." },
    { id: "shopkeep_a_wy_2_001", role: "shopkeep", context: "ambient", mood: "weary",   levelBand: 2, text: "Three competitors opened up past {biome_feature}. I'm not worried. Mostly." },
    { id: "shopkeep_a_wm_2_002", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 2, text: "Good trades keep this village running. Every purchase matters." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "shopkeep_a_cl_3_001", role: "shopkeep", context: "ambient", mood: "calm",    levelBand: 3, text: "Thirty years in trade. The stock changes, the wanderers don't." },
    { id: "shopkeep_a_wm_3_001", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 3, text: "I built this shop from scratch. Still my proudest thing." },
    { id: "shopkeep_a_cu_3_001", role: "shopkeep", context: "ambient", mood: "curious", levelBand: 3, text: "You've seen every kind of goods the world offers. Anything I'm missing?" },
    { id: "shopkeep_a_wy_3_001", role: "shopkeep", context: "ambient", mood: "weary",   levelBand: 3, text: "Slow season. But they come back. They always come back." },
    { id: "shopkeep_a_wm_3_002", role: "shopkeep", context: "ambient", mood: "warm",    levelBand: 3, text: "Good folk visit a good shop. That's been my whole philosophy." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "shopkeep_r_cu_0_001", role: "shopkeep", context: "rumor", mood: "curious", levelBand: 0, text: "A trader brought rare {item} from past {biome_feature}. Sold out same day." },
    { id: "shopkeep_r_wm_0_001", role: "shopkeep", context: "rumor", mood: "warm",    levelBand: 0, text: "There's a market near {biome_feature} that only opens at harvest moon, they say." },
    { id: "shopkeep_r_cl_0_001", role: "shopkeep", context: "rumor", mood: "calm",    levelBand: 0, text: "Supply road past {biome_feature} has been delayed. Something spooked the drivers." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "shopkeep_r_cu_1_001", role: "shopkeep", context: "rumor", mood: "curious", levelBand: 1, text: "The old trading post near {biome_feature} closed. Not sure why." },
    { id: "shopkeep_r_wm_1_001", role: "shopkeep", context: "rumor", mood: "warm",    levelBand: 1, text: "Heard a village past {biome_feature} makes the best glazed pots. Top of my list." },
    { id: "shopkeep_r_wy_1_001", role: "shopkeep", context: "rumor", mood: "weary",   levelBand: 1, text: "Bandits near {biome_feature} have been targeting supply wagons. Bad for everyone." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "shopkeep_r_cl_2_001", role: "shopkeep", context: "rumor", mood: "calm",    levelBand: 2, text: "A new trade route past {biome_feature} is opening. Prices will shift." },
    { id: "shopkeep_r_cu_2_001", role: "shopkeep", context: "rumor", mood: "curious", levelBand: 2, text: "Rare mineral from near {biome_feature} is turning up in goods. Fascinating." },
    { id: "shopkeep_r_wm_2_001", role: "shopkeep", context: "rumor", mood: "warm",    levelBand: 2, text: "The hidden cache past {biome_feature} — wanderers find it by instinct, supposedly." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "shopkeep_r_cl_3_001", role: "shopkeep", context: "rumor", mood: "calm",    levelBand: 3, text: "Ancient goods are surfacing near {biome_feature}. Their worth is unknown." },
    { id: "shopkeep_r_cu_3_001", role: "shopkeep", context: "rumor", mood: "curious", levelBand: 3, text: "There's a legendary item said to rest near {biome_feature}. No price for that." },
    { id: "shopkeep_r_wy_3_001", role: "shopkeep", context: "rumor", mood: "weary",   levelBand: 3, text: "The deep markets near {biome_feature} trade in things I won't stock. Carefully." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "shopkeep_co_cl_0_001", role: "shopkeep", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "I need {count} of {item} from the stall near {biome_feature}. Business, you see.",     tags: ["cause:fetch_item"] },
    { id: "shopkeep_co_wm_0_001", role: "shopkeep", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "This package goes to {named_NPC} in the village past {biome_feature}. Safe pair of hands?", tags: ["cause:deliver_item"] },
    { id: "shopkeep_co_cu_0_001", role: "shopkeep", context: "challenge_offer", mood: "curious", levelBand: 0, text: "Could you pick up {item} from my supplier near {biome_feature}? They only trust wanderers.", tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "shopkeep_co_cl_1_001", role: "shopkeep", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "I've got a order for {item} past {biome_feature}. Delivery delayed — can you fetch it?",  tags: ["cause:fetch_item"] },
    { id: "shopkeep_co_wm_1_001", role: "shopkeep", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "This order needs to reach {named_NPC} by tomorrow. My best customer.",                    tags: ["cause:deliver_item"] },
    { id: "shopkeep_co_wy_1_001", role: "shopkeep", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "My runner is sick. Could you bring {count} {item} from past {biome_feature}?",           tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "shopkeep_co_cl_2_001", role: "shopkeep", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "A rare shipment of {item} sits uncollected near {biome_feature}. I'll pay well.",         tags: ["cause:fetch_item"] },
    { id: "shopkeep_co_wm_2_001", role: "shopkeep", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "This crate needs to reach {named_NPC} quickly. Fragile and important.",                   tags: ["cause:deliver_item"] },
    { id: "shopkeep_co_cu_2_001", role: "shopkeep", context: "challenge_offer", mood: "curious", levelBand: 2, text: "I need {item} from a collector near {biome_feature}. They only sell to wanderers they trust.", tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "shopkeep_co_cl_3_001", role: "shopkeep", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "An irreplaceable {item} is being held near {biome_feature}. I need someone reliable.",    tags: ["cause:fetch_item"] },
    { id: "shopkeep_co_wm_3_001", role: "shopkeep", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "This delivery for {named_NPC} means everything to them. I'm trusting you.",               tags: ["cause:deliver_item"] },
    { id: "shopkeep_co_wy_3_001", role: "shopkeep", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "Last shipment never arrived. Could you track down {item} near {biome_feature}?",          tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "shopkeep_ct_wm_0_001", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "Exactly what I needed. You've kept the shop running.",              tags: ["cause:fetch_item"] },
    { id: "shopkeep_ct_wm_0_002", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "{named_NPC} sent word they received it. My best customer, happy.", tags: ["cause:deliver_item"] },
    { id: "shopkeep_ct_cl_0_001", role: "shopkeep", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "Stock's replenished. Business can carry on. Thank you.",            tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "shopkeep_ct_wm_1_001", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "Full stock, happy customers, thanks to you.",                        tags: ["cause:fetch_item"] },
    { id: "shopkeep_ct_cl_1_001", role: "shopkeep", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "Delivered on time, intact. You're better than my usual runner.",     tags: ["cause:deliver_item"] },
    { id: "shopkeep_ct_wy_1_001", role: "shopkeep", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "The whole day turned around when that arrived. Genuine thanks.",     tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "shopkeep_ct_wm_2_001", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "Rare {item} in hand. I can't tell you what this means to the shop.", tags: ["cause:fetch_item"] },
    { id: "shopkeep_ct_wm_2_002", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The crate arrived perfect. {named_NPC} was overjoyed.",               tags: ["cause:deliver_item"] },
    { id: "shopkeep_ct_cl_2_001", role: "shopkeep", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "You've earned a permanent discount here. No argument.",               tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "shopkeep_ct_wm_3_001", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "That item has been missing for years. You're a miracle worker.",       tags: ["cause:fetch_item"] },
    { id: "shopkeep_ct_cl_3_001", role: "shopkeep", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "The delivery completed a deal I thought was lost. You saved my trade.", tags: ["cause:deliver_item"] },
    { id: "shopkeep_ct_wm_3_002", role: "shopkeep", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The best return on investment I've ever seen. Take a good price.",     tags: ["cause:fetch_item"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "shopkeep_ia_wm_0_001", role: "shopkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "Shelves are full. That hasn't happened in a while." },
    { id: "shopkeep_ia_cl_0_001", role: "shopkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "Good week for trade. Your help got it started right." },
    { id: "shopkeep_ia_cu_0_001", role: "shopkeep", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "That delivery opened a new contact. Exciting business." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "shopkeep_ia_cl_1_001", role: "shopkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Things have been running smoothly since then." },
    { id: "shopkeep_ia_wm_1_001", role: "shopkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "{named_NPC} comes in now when they pass through. That's new." },
    { id: "shopkeep_ia_wy_1_001", role: "shopkeep", context: "idle_after_resolve", mood: "weary", levelBand: 1, text: "One less thing to worry about. The shop thanks you." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "shopkeep_ia_cl_2_001", role: "shopkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "That deal opened three new trade routes. Still seeing the effect." },
    { id: "shopkeep_ia_wm_2_001", role: "shopkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "Best quarter in years. Partly your doing." },
    { id: "shopkeep_ia_cu_2_001", role: "shopkeep", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "That rare {item} brought in customers I'd never have seen otherwise." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "shopkeep_ia_cl_3_001", role: "shopkeep", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The shop is in the best shape it's been in decades. You helped build that." },
    { id: "shopkeep_ia_wm_3_001", role: "shopkeep", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "A legend who does errands for shopkeeps. I appreciate your humility." },
    { id: "shopkeep_ia_wy_3_001", role: "shopkeep", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Good trades, good wanderers. That's all a shop needs." },
];
