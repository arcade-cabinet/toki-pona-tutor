/**
 * Dialog pool — hunter role.
 * Hunters and trackers found on the edges of settlements and in the wilds.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: defeat_threat, survey (common); fetch_item, find_pet (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const hunter: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "hunter_g_cl_0_001", role: "hunter", context: "greeting", mood: "calm",    levelBand: 0, text: "Keep your steps light out here. Good habit early." },
    { id: "hunter_g_wm_0_001", role: "hunter", context: "greeting", mood: "warm",    levelBand: 0, text: "A wanderer! The wilds are good today. Good time to be out." },
    { id: "hunter_g_cu_0_001", role: "hunter", context: "greeting", mood: "curious", levelBand: 0, text: "New to the woods? I'll tell you what to listen for." },
    { id: "hunter_g_wy_0_001", role: "hunter", context: "greeting", mood: "weary",   levelBand: 0, text: "Long morning. The quarry's been canny today." },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "hunter_g_cl_1_001", role: "hunter", context: "greeting", mood: "calm",    levelBand: 1, text: "A wanderer who knows the wilds. You move like you've been doing this a while." },
    { id: "hunter_g_wm_1_001", role: "hunter", context: "greeting", mood: "warm",    levelBand: 1, text: "Rivers! Figured I'd run into you out here eventually." },
    { id: "hunter_g_cu_1_001", role: "hunter", context: "greeting", mood: "curious", levelBand: 1, text: "You catch creatures instead of hunting them. I find that interesting." },
    { id: "hunter_g_wy_1_001", role: "hunter", context: "greeting", mood: "weary",   levelBand: 1, text: "Rough terrain past {biome_feature}. You've probably been there. Worth it?" },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "hunter_g_cl_2_001", role: "hunter", context: "greeting", mood: "calm",    levelBand: 2, text: "A seasoned wanderer. You'd make a fine tracker if you weren't doing what you do." },
    { id: "hunter_g_wm_2_001", role: "hunter", context: "greeting", mood: "warm",    levelBand: 2, text: "Rivers. Your name gets around even in the deep woods." },
    { id: "hunter_g_cu_2_001", role: "hunter", context: "greeting", mood: "curious", levelBand: 2, text: "I've tracked things that no wanderer's caught. Different approaches. Good results." },
    { id: "hunter_g_wy_2_001", role: "hunter", context: "greeting", mood: "weary",   levelBand: 2, text: "The wilds have been unsettled. Something I haven't tracked before." },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "hunter_g_cl_3_001", role: "hunter", context: "greeting", mood: "calm",    levelBand: 3, text: "The wanderer of wanderers, out in my territory. Good company." },
    { id: "hunter_g_wm_3_001", role: "hunter", context: "greeting", mood: "warm",    levelBand: 3, text: "Rivers. You walk like the wilds know you. That's a thing you earn." },
    { id: "hunter_g_cu_3_001", role: "hunter", context: "greeting", mood: "curious", levelBand: 3, text: "You've been to the deepest places. Did you see anything a hunter should know about?" },
    { id: "hunter_g_wy_3_001", role: "hunter", context: "greeting", mood: "weary",   levelBand: 3, text: "Long hunt. Longer road. You get it." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "hunter_a_cl_0_001", role: "hunter", context: "ambient", mood: "calm",    levelBand: 0, text: "You read tracks by looking at what's not disturbed, not just what is." },
    { id: "hunter_a_wm_0_001", role: "hunter", context: "ambient", mood: "warm",    levelBand: 0, text: "The forest's in a good mood today. The birds say so." },
    { id: "hunter_a_cu_0_001", role: "hunter", context: "ambient", mood: "curious", levelBand: 0, text: "Something unusual moved through near {biome_feature} last night. Not sure what." },
    { id: "hunter_a_wy_0_001", role: "hunter", context: "ambient", mood: "weary",   levelBand: 0, text: "Three days out. The camp's warm enough. Can't complain much." },
    { id: "hunter_a_wm_0_002", role: "hunter", context: "ambient", mood: "warm",    levelBand: 0, text: "I'd never trap a {species}. Some things you just watch." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "hunter_a_cl_1_001", role: "hunter", context: "ambient", mood: "calm",    levelBand: 1, text: "The territorial range of most creatures is larger than people think." },
    { id: "hunter_a_wm_1_001", role: "hunter", context: "ambient", mood: "warm",    levelBand: 1, text: "You know what I respect about wanderers? They let creatures live. So do I." },
    { id: "hunter_a_cu_1_001", role: "hunter", context: "ambient", mood: "curious", levelBand: 1, text: "There's a den near {biome_feature} I've been watching for two seasons. Patient work." },
    { id: "hunter_a_wy_1_001", role: "hunter", context: "ambient", mood: "weary",   levelBand: 1, text: "Something spooked everything in the valley last night. Still piecing it together." },
    { id: "hunter_a_wm_1_002", role: "hunter", context: "ambient", mood: "warm",    levelBand: 1, text: "My grandmother could name every creature by its cry. I'm halfway there." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "hunter_a_cl_2_001", role: "hunter", context: "ambient", mood: "calm",    levelBand: 2, text: "The deep wilds are louder than the village in their own way." },
    { id: "hunter_a_wm_2_001", role: "hunter", context: "ambient", mood: "warm",    levelBand: 2, text: "The rarest {species} always find a wanderer who doesn't push. You'd know." },
    { id: "hunter_a_cu_2_001", role: "hunter", context: "ambient", mood: "curious", levelBand: 2, text: "I mapped every creature path in this valley. Yours crosses three of them." },
    { id: "hunter_a_wy_2_001", role: "hunter", context: "ambient", mood: "weary",   levelBand: 2, text: "Whatever moved through {biome_feature} is gone now. Tracks go cold fast." },
    { id: "hunter_a_wm_2_002", role: "hunter", context: "ambient", mood: "warm",    levelBand: 2, text: "Two hunters, a wanderer, and a ghost-pale {species}. That's my year so far." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "hunter_a_cl_3_001", role: "hunter", context: "ambient", mood: "calm",    levelBand: 3, text: "Thirty years in the wilds. The land's still surprising me." },
    { id: "hunter_a_wm_3_001", role: "hunter", context: "ambient", mood: "warm",    levelBand: 3, text: "I've met one wanderer in my life who's as at home in the wilds as I am. That's you." },
    { id: "hunter_a_cu_3_001", role: "hunter", context: "ambient", mood: "curious", levelBand: 3, text: "Is there a creature you haven't found yet that keeps you going?" },
    { id: "hunter_a_wy_3_001", role: "hunter", context: "ambient", mood: "weary",   levelBand: 3, text: "Long hunts, long roads. Both honest work in the end." },
    { id: "hunter_a_wm_3_002", role: "hunter", context: "ambient", mood: "warm",    levelBand: 3, text: "Good hunters leave the wilds better. So do good wanderers." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "hunter_r_cu_0_001", role: "hunter", context: "rumor", mood: "curious", levelBand: 0, text: "Something new moved into the territory near {biome_feature}. Tracks unlike anything I know." },
    { id: "hunter_r_cl_0_001", role: "hunter", context: "rumor", mood: "calm",    levelBand: 0, text: "The creature routes near {biome_feature} have shifted. Worth knowing if you're passing through." },
    { id: "hunter_r_wm_0_001", role: "hunter", context: "rumor", mood: "warm",    levelBand: 0, text: "A pack of {species} set up near {biome_feature}. I've kept my distance." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "hunter_r_cu_1_001", role: "hunter", context: "rumor", mood: "curious", levelBand: 1, text: "I've been tracking something enormous near {biome_feature} for a month. Haven't closed." },
    { id: "hunter_r_wy_1_001", role: "hunter", context: "rumor", mood: "weary",   levelBand: 1, text: "Three hunters came back from {biome_feature} shaken. Wouldn't say why." },
    { id: "hunter_r_wm_1_001", role: "hunter", context: "rumor", mood: "warm",    levelBand: 1, text: "A rare {species} nests near {biome_feature} every spring without fail. Breathtaking." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "hunter_r_cu_2_001", role: "hunter", context: "rumor", mood: "curious", levelBand: 2, text: "The {biome_feature} valley hosts a creature I've never documented. Patient work needed." },
    { id: "hunter_r_cl_2_001", role: "hunter", context: "rumor", mood: "calm",    levelBand: 2, text: "Creature migration has completely changed near {biome_feature}. Something disturbed them." },
    { id: "hunter_r_wm_2_001", role: "hunter", context: "rumor", mood: "warm",    levelBand: 2, text: "Old hunter camped near {biome_feature} for a decade. Said the same {species} returned each year." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "hunter_r_cl_3_001", role: "hunter", context: "rumor", mood: "calm",    levelBand: 3, text: "The territory near {biome_feature} has never been fully surveyed. Not even by me." },
    { id: "hunter_r_cu_3_001", role: "hunter", context: "rumor", mood: "curious", levelBand: 3, text: "The largest {species} I've ever tracked came from past {biome_feature}. Followed it for weeks." },
    { id: "hunter_r_wy_3_001", role: "hunter", context: "rumor", mood: "weary",   levelBand: 3, text: "Beyond {biome_feature} there's territory that no hunter claims. For good reasons I won't give." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "hunter_co_cl_0_001", role: "hunter", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "A {species} has been harassing the village near {biome_feature}. Could you handle it?",       tags: ["cause:defeat_threat"] },
    { id: "hunter_co_cu_0_001", role: "hunter", context: "challenge_offer", mood: "curious", levelBand: 0, text: "I need fresh eyes on the valley past {biome_feature}. Survey what you see?",                   tags: ["cause:survey"] },
    { id: "hunter_co_wm_0_001", role: "hunter", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My tracking hound ran off toward {biome_feature}. He's smart but I'm worried.",                tags: ["cause:find_pet"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "hunter_co_cl_1_001", role: "hunter", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "Something has been disrupting the valley near {biome_feature}. I'd like it gone.",              tags: ["cause:defeat_threat"] },
    { id: "hunter_co_cu_1_001", role: "hunter", context: "challenge_offer", mood: "curious", levelBand: 1, text: "Could you survey the creature activity past {biome_feature}? I need reliable data.",             tags: ["cause:survey"] },
    { id: "hunter_co_wy_1_001", role: "hunter", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "My old hunting bird hasn't returned from {biome_feature}. Help me look?",                       tags: ["cause:find_pet"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "hunter_co_cl_2_001", role: "hunter", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "A major threat has moved into the {biome_feature} range. It's beyond my current approach.",    tags: ["cause:defeat_threat"] },
    { id: "hunter_co_cu_2_001", role: "hunter", context: "challenge_offer", mood: "curious", levelBand: 2, text: "The deep territory past {biome_feature} needs a thorough survey. You're suited for it.",        tags: ["cause:survey"] },
    { id: "hunter_co_wm_2_001", role: "hunter", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "Rare herb I need for my traps grows past {biome_feature}. Could you fetch some?",               tags: ["cause:fetch_item"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "hunter_co_cl_3_001", role: "hunter", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "The most dangerous thing I've tracked near {biome_feature} — I want it dealt with.",             tags: ["cause:defeat_threat"] },
    { id: "hunter_co_cu_3_001", role: "hunter", context: "challenge_offer", mood: "curious", levelBand: 3, text: "Only a wanderer of your experience could survey the deep reaches past {biome_feature}.",         tags: ["cause:survey"] },
    { id: "hunter_co_wy_3_001", role: "hunter", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "My old wolf companion went far past {biome_feature}. I think you can find her.",                 tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "hunter_ct_cl_0_001", role: "hunter", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "The valley is clear. The village will be relieved.",                  tags: ["cause:defeat_threat"] },
    { id: "hunter_ct_cu_0_001", role: "hunter", context: "challenge_thanks", mood: "curious", levelBand: 0, text: "Your survey matches my estimates. But adds two things I missed.",    tags: ["cause:survey"] },
    { id: "hunter_ct_wm_0_001", role: "hunter", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "He came home smelling of adventure. Safe and unharmed. Thank you.",    tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "hunter_ct_cl_1_001", role: "hunter", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "The disruption is gone. The territory is stable. Good work.",            tags: ["cause:defeat_threat"] },
    { id: "hunter_ct_cu_1_001", role: "hunter", context: "challenge_thanks", mood: "curious", levelBand: 1, text: "The creature data from your survey is the clearest I've ever had.",    tags: ["cause:survey"] },
    { id: "hunter_ct_wm_1_001", role: "hunter", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "She came back on her own once you cleared the path. That's enough.",     tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "hunter_ct_cl_2_001", role: "hunter", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "The {biome_feature} range is safe for hunting again. You did that.",      tags: ["cause:defeat_threat"] },
    { id: "hunter_ct_cu_2_001", role: "hunter", context: "challenge_thanks", mood: "curious", levelBand: 2, text: "This survey rewrites everything I thought about the deep territory.",   tags: ["cause:survey"] },
    { id: "hunter_ct_wm_2_001", role: "hunter", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The herbs worked. And the hunt was better than I'd hoped.",               tags: ["cause:fetch_item"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "hunter_ct_cl_3_001", role: "hunter", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "That territory has never been safer. Your presence did that.",             tags: ["cause:defeat_threat"] },
    { id: "hunter_ct_cu_3_001", role: "hunter", context: "challenge_thanks", mood: "curious", levelBand: 3, text: "The deepest survey I've ever held. You covered ground I never have.",    tags: ["cause:survey"] },
    { id: "hunter_ct_wm_3_001", role: "hunter", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "She found me on her own. But I think your track led her home.",            tags: ["cause:find_pet"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "hunter_ia_cl_0_001", role: "hunter", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "The territory's been quiet since. Good quiet." },
    { id: "hunter_ia_wm_0_001", role: "hunter", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "He follows me everywhere now. Your find changed him." },
    { id: "hunter_ia_cu_0_001", role: "hunter", context: "idle_after_resolve", mood: "curious", levelBand: 0, text: "I've been checking your survey against my old maps. Impressive." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "hunter_ia_cl_1_001", role: "hunter", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Best stretch of hunts I've had in a season. Your work cleared the way." },
    { id: "hunter_ia_wm_1_001", role: "hunter", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "She's been hunting by my side again. Like old times." },
    { id: "hunter_ia_cu_1_001", role: "hunter", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "I've been adding your survey notes to my field records. Good data." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "hunter_ia_cl_2_001", role: "hunter", context: "idle_after_resolve", mood: "calm",  levelBand: 2, text: "The whole valley feels different now. Settled." },
    { id: "hunter_ia_wm_2_001", role: "hunter", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "Best traps in years, thanks to those herbs. I owe you one." },
    { id: "hunter_ia_cu_2_001", role: "hunter", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "Your survey found a feature I'd missed for twelve years. Thank you." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "hunter_ia_cl_3_001", role: "hunter", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "The deep wilds are as safe as they've ever been. You're part of that." },
    { id: "hunter_ia_wm_3_001", role: "hunter", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "My old wolf still looks toward wherever you went. So do I, sometimes." },
    { id: "hunter_ia_wy_3_001", role: "hunter", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "Long years in the wilds. You're the best ally I've found out here." },
];
