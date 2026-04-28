/**
 * Dialog pool — farmer role.
 * Working farmers found near fields and farmsteads.
 * Moods: calm, warm, weary, curious. Bands: 0-3.
 * Causes: find_pet, fetch_item, settle_dispute (common); recover_heirloom (rare).
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const farmer: DialogLine[] = [
    // ── greeting — band 0 ────────────────────────────────────────────────────
    { id: "farmer_g_cl_0_001", role: "farmer", context: "greeting", mood: "calm",    levelBand: 0, text: "Morning. Watch the rows if you're walking through." },
    { id: "farmer_g_wm_0_001", role: "farmer", context: "greeting", mood: "warm",    levelBand: 0, text: "Passing through? You're welcome to rest by the fence." },
    { id: "farmer_g_wy_0_001", role: "farmer", context: "greeting", mood: "weary",   levelBand: 0, text: "Long day. Don't mind me." },
    { id: "farmer_g_cu_0_001", role: "farmer", context: "greeting", mood: "curious", levelBand: 0, text: "I don't see many travelers this way. Where are you headed?" },

    // ── greeting — band 1 ────────────────────────────────────────────────────
    { id: "farmer_g_wm_1_001", role: "farmer", context: "greeting", mood: "warm",    levelBand: 1, text: "You again! Glad to see a familiar face out here." },
    { id: "farmer_g_cl_1_001", role: "farmer", context: "greeting", mood: "calm",    levelBand: 1, text: "The wanderer. Crops are better this season, if you're curious." },
    { id: "farmer_g_wy_1_001", role: "farmer", context: "greeting", mood: "weary",   levelBand: 1, text: "Another early morning. At least the weather's holding." },
    { id: "farmer_g_cu_1_001", role: "farmer", context: "greeting", mood: "curious", levelBand: 1, text: "Heard you've been to the far marshes. Did you see the glowweed?" },

    // ── greeting — band 2 ────────────────────────────────────────────────────
    { id: "farmer_g_wm_2_001", role: "farmer", context: "greeting", mood: "warm",    levelBand: 2, text: "Rivers! Always a good sign when you come through." },
    { id: "farmer_g_cl_2_001", role: "farmer", context: "greeting", mood: "calm",    levelBand: 2, text: "Experienced traveler on my land. I'm honored." },
    { id: "farmer_g_wy_2_001", role: "farmer", context: "greeting", mood: "weary",   levelBand: 2, text: "Soil's been strange lately. You'd probably know why." },
    { id: "farmer_g_cu_2_001", role: "farmer", context: "greeting", mood: "curious", levelBand: 2, text: "Is it true you caught a {species} in the deep wilds?" },

    // ── greeting — band 3 ────────────────────────────────────────────────────
    { id: "farmer_g_wm_3_001", role: "farmer", context: "greeting", mood: "warm",    levelBand: 3, text: "The legend of the roads, right here on my farm. Hello." },
    { id: "farmer_g_cl_3_001", role: "farmer", context: "greeting", mood: "calm",    levelBand: 3, text: "Some folks only read about wanderers like you. I get to meet one." },
    { id: "farmer_g_wy_3_001", role: "farmer", context: "greeting", mood: "weary",   levelBand: 3, text: "Long roads behind you, I'd wager. Mine just loops the fence line." },
    { id: "farmer_g_wm_3_002", role: "farmer", context: "greeting", mood: "warm",    levelBand: 3, text: "Still keeping this old farm going. Good to see you do the same." },

    // ── ambient — band 0 ─────────────────────────────────────────────────────
    { id: "farmer_a_cl_0_001", role: "farmer", context: "ambient", mood: "calm",    levelBand: 0, text: "Root rot came early this year. Always something." },
    { id: "farmer_a_wm_0_001", role: "farmer", context: "ambient", mood: "warm",    levelBand: 0, text: "The soil here's good. Been in my family three generations." },
    { id: "farmer_a_cu_0_001", role: "farmer", context: "ambient", mood: "curious", levelBand: 0, text: "You ever wonder what's growing wild past {biome_feature}?" },
    { id: "farmer_a_wy_0_001", role: "farmer", context: "ambient", mood: "weary",   levelBand: 0, text: "Sunrise to sunset. That's the life." },
    { id: "farmer_a_wm_0_002", role: "farmer", context: "ambient", mood: "warm",    levelBand: 0, text: "The goats are in a good mood today. Sign of a fine evening." },

    // ── ambient — band 1 ─────────────────────────────────────────────────────
    { id: "farmer_a_cl_1_001", role: "farmer", context: "ambient", mood: "calm",    levelBand: 1, text: "Rain's been off. I've been hauling water from the stream." },
    { id: "farmer_a_wm_1_001", role: "farmer", context: "ambient", mood: "warm",    levelBand: 1, text: "My neighbor and I split the harvest. Makes the work lighter." },
    { id: "farmer_a_cu_1_001", role: "farmer", context: "ambient", mood: "curious", levelBand: 1, text: "A {species} got into the barley last month. Mischievous little thing." },
    { id: "farmer_a_wy_1_001", role: "farmer", context: "ambient", mood: "weary",   levelBand: 1, text: "Knees aren't what they were. But the crops don't wait." },
    { id: "farmer_a_wm_1_002", role: "farmer", context: "ambient", mood: "warm",    levelBand: 1, text: "First frost came late. The turnips are especially good this year." },

    // ── ambient — band 2 ─────────────────────────────────────────────────────
    { id: "farmer_a_cl_2_001", role: "farmer", context: "ambient", mood: "calm",    levelBand: 2, text: "Wild creatures have been stealing from the fields. More than usual." },
    { id: "farmer_a_wm_2_001", role: "farmer", context: "ambient", mood: "warm",    levelBand: 2, text: "Brought in the biggest pumpkin of my life this season. Come see." },
    { id: "farmer_a_cu_2_001", role: "farmer", context: "ambient", mood: "curious", levelBand: 2, text: "I tried planting by the old moon charts. Worked better than I expected." },
    { id: "farmer_a_wy_2_001", role: "farmer", context: "ambient", mood: "weary",   levelBand: 2, text: "Three nights of bad sleep. Something's been howling near {biome_feature}." },
    { id: "farmer_a_wm_2_002", role: "farmer", context: "ambient", mood: "warm",    levelBand: 2, text: "My daughter says she wants to be a wanderer. I don't know how I feel." },

    // ── ambient — band 3 ─────────────────────────────────────────────────────
    { id: "farmer_a_cl_3_001", role: "farmer", context: "ambient", mood: "calm",    levelBand: 3, text: "The land's the same as it's always been. Steady as anything." },
    { id: "farmer_a_wm_3_001", role: "farmer", context: "ambient", mood: "warm",    levelBand: 3, text: "You've walked roads I'll never see. I've walked furrows you never will." },
    { id: "farmer_a_cu_3_001", role: "farmer", context: "ambient", mood: "curious", levelBand: 3, text: "My granddad said this plot was different once. Wild. You'd have liked it." },
    { id: "farmer_a_wy_3_001", role: "farmer", context: "ambient", mood: "weary",   levelBand: 3, text: "Forty years on this land. I still find things I can't explain." },
    { id: "farmer_a_wm_3_002", role: "farmer", context: "ambient", mood: "warm",    levelBand: 3, text: "A wanderer and a farmer. Different lives, same mud." },

    // ── rumor — band 0 ───────────────────────────────────────────────────────
    { id: "farmer_r_cl_0_001", role: "farmer", context: "rumor", mood: "calm",    levelBand: 0, text: "Something's been disturbing the soil near {biome_feature}. Not any animal I know." },
    { id: "farmer_r_cu_0_001", role: "farmer", context: "rumor", mood: "curious", levelBand: 0, text: "Old Bram says a {species} comes to his stream at dusk, past the {biome_feature}." },
    { id: "farmer_r_wm_0_001", role: "farmer", context: "rumor", mood: "warm",    levelBand: 0, text: "The mushrooms near {biome_feature} glow at night. Harmless, folks say." },

    // ── rumor — band 1 ───────────────────────────────────────────────────────
    { id: "farmer_r_wy_1_001", role: "farmer", context: "rumor", mood: "weary",   levelBand: 1, text: "Whole flock of birds left the {biome_feature} overnight. Unnerving." },
    { id: "farmer_r_cu_1_001", role: "farmer", context: "rumor", mood: "curious", levelBand: 1, text: "There's a berry patch past {biome_feature} that nobody's claimed. Worth checking." },
    { id: "farmer_r_cl_1_001", role: "farmer", context: "rumor", mood: "calm",    levelBand: 1, text: "My cousin found ruins beneath {biome_feature} while clearing land. Left them alone." },

    // ── rumor — band 2 ───────────────────────────────────────────────────────
    { id: "farmer_r_cu_2_001", role: "farmer", context: "rumor", mood: "curious", levelBand: 2, text: "Strange fog rolls in from {biome_feature} some mornings. Smells sweet." },
    { id: "farmer_r_wy_2_001", role: "farmer", context: "rumor", mood: "weary",   levelBand: 2, text: "Livestock won't go near {biome_feature} lately. Been that way two weeks." },
    { id: "farmer_r_wm_2_001", role: "farmer", context: "rumor", mood: "warm",    levelBand: 2, text: "Travelers coming from {biome_feature} look tired, like they didn't sleep well." },

    // ── rumor — band 3 ───────────────────────────────────────────────────────
    { id: "farmer_r_cl_3_001", role: "farmer", context: "rumor", mood: "calm",    levelBand: 3, text: "Old maps show a second spring somewhere past {biome_feature}. Never been found." },
    { id: "farmer_r_cu_3_001", role: "farmer", context: "rumor", mood: "curious", levelBand: 3, text: "The soil near {biome_feature} is black as night. Grows anything, supposedly." },
    { id: "farmer_r_wy_3_001", role: "farmer", context: "rumor", mood: "weary",   levelBand: 3, text: "They say the oldest {species} in the land lives beyond {biome_feature}. Enormous." },

    // ── challenge_offer — band 0 ─────────────────────────────────────────────
    { id: "farmer_co_wm_0_001", role: "farmer", context: "challenge_offer", mood: "warm",    levelBand: 0, text: "My old sheepdog went off toward {biome_feature}. Would you find her?",              tags: ["cause:find_pet"] },
    { id: "farmer_co_cl_0_001", role: "farmer", context: "challenge_offer", mood: "calm",    levelBand: 0, text: "I need {count} sacks of {item} from the market stall. My legs won't do it today.",  tags: ["cause:fetch_item"] },
    { id: "farmer_co_wy_0_001", role: "farmer", context: "challenge_offer", mood: "weary",   levelBand: 0, text: "Two farms are arguing over a ditch again. Think you could talk sense to them?",     tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 1 ─────────────────────────────────────────────
    { id: "farmer_co_wm_1_001", role: "farmer", context: "challenge_offer", mood: "warm",    levelBand: 1, text: "The cat's stuck somewhere near {biome_feature}. She won't come to me.",              tags: ["cause:find_pet"] },
    { id: "farmer_co_cl_1_001", role: "farmer", context: "challenge_offer", mood: "calm",    levelBand: 1, text: "The seed merchant near {biome_feature} has {item} I need. Could you bring some?",    tags: ["cause:fetch_item"] },
    { id: "farmer_co_wy_1_001", role: "farmer", context: "challenge_offer", mood: "weary",   levelBand: 1, text: "My neighbor keeps using my water. Could you help smooth things over?",               tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 2 ─────────────────────────────────────────────
    { id: "farmer_co_wm_2_001", role: "farmer", context: "challenge_offer", mood: "warm",    levelBand: 2, text: "My grandfather's plow was taken from the barn near {biome_feature}. Odd story.",     tags: ["cause:recover_heirloom"] },
    { id: "farmer_co_cl_2_001", role: "farmer", context: "challenge_offer", mood: "calm",    levelBand: 2, text: "The young ox wandered past {biome_feature}. Dangerous roads out there.",               tags: ["cause:find_pet"] },
    { id: "farmer_co_cu_2_001", role: "farmer", context: "challenge_offer", mood: "curious", levelBand: 2, text: "Three farms are in a mess over water rights. You're a fair sort, aren't you?",        tags: ["cause:settle_dispute"] },

    // ── challenge_offer — band 3 ─────────────────────────────────────────────
    { id: "farmer_co_cl_3_001", role: "farmer", context: "challenge_offer", mood: "calm",    levelBand: 3, text: "My gran's seed box went missing near {biome_feature}. Irreplaceable, that box.",      tags: ["cause:recover_heirloom"] },
    { id: "farmer_co_wy_3_001", role: "farmer", context: "challenge_offer", mood: "weary",   levelBand: 3, text: "A whole village row over harvest shares. I've given up. Could you try?",              tags: ["cause:settle_dispute"] },
    { id: "farmer_co_wm_3_001", role: "farmer", context: "challenge_offer", mood: "warm",    levelBand: 3, text: "The old mule hasn't been seen in {count} days. Last near {biome_feature}.",           tags: ["cause:find_pet"] },

    // ── challenge_thanks — band 0 ────────────────────────────────────────────
    { id: "farmer_ct_wm_0_001", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 0, text: "She came back limping but happy. Thank you so much.",                 tags: ["cause:find_pet"] },
    { id: "farmer_ct_cl_0_001", role: "farmer", context: "challenge_thanks", mood: "calm",  levelBand: 0, text: "Got everything I needed. You've saved my planting week.",             tags: ["cause:fetch_item"] },
    { id: "farmer_ct_wy_0_001", role: "farmer", context: "challenge_thanks", mood: "weary", levelBand: 0, text: "They're talking again. That's more than I expected. Good work.",      tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 1 ────────────────────────────────────────────
    { id: "farmer_ct_wm_1_001", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 1, text: "She curled up by the stove and hasn't moved. Pure relief.",           tags: ["cause:find_pet"] },
    { id: "farmer_ct_cl_1_001", role: "farmer", context: "challenge_thanks", mood: "calm",  levelBand: 1, text: "Seeds are in the ground. Couldn't have done it without you.",         tags: ["cause:fetch_item"] },
    { id: "farmer_ct_wy_1_001", role: "farmer", context: "challenge_thanks", mood: "weary", levelBand: 1, text: "Neighbors are splitting the water fair now. Took an outsider to see it.", tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 2 ────────────────────────────────────────────
    { id: "farmer_ct_wm_2_001", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "Gran's box is back where it belongs. I can't thank you enough.",        tags: ["cause:recover_heirloom"] },
    { id: "farmer_ct_wm_2_002", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 2, text: "The ox is home safe. You've got a gentle hand with them.",              tags: ["cause:find_pet"] },
    { id: "farmer_ct_cl_2_001", role: "farmer", context: "challenge_thanks", mood: "calm",  levelBand: 2, text: "Everyone agreed. In writing, even. You pulled off a miracle.",         tags: ["cause:settle_dispute"] },

    // ── challenge_thanks — band 3 ────────────────────────────────────────────
    { id: "farmer_ct_wm_3_001", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "My gran would have wept. That seed box meant everything to her.",       tags: ["cause:recover_heirloom"] },
    { id: "farmer_ct_wm_3_002", role: "farmer", context: "challenge_thanks", mood: "warm",  levelBand: 3, text: "The old mule's grazing out front. I'd given up. You didn't.",          tags: ["cause:find_pet"] },
    { id: "farmer_ct_cl_3_001", role: "farmer", context: "challenge_thanks", mood: "calm",  levelBand: 3, text: "Three farms, one agreement. You've kept this valley together.",         tags: ["cause:settle_dispute"] },

    // ── idle_after_resolve — band 0 ──────────────────────────────────────────
    { id: "farmer_ia_wm_0_001", role: "farmer", context: "idle_after_resolve", mood: "warm",  levelBand: 0, text: "She won't stop following me now. Guess she's forgiven us both." },
    { id: "farmer_ia_cl_0_001", role: "farmer", context: "idle_after_resolve", mood: "calm",  levelBand: 0, text: "Planting went well this year. Your help got it started right." },
    { id: "farmer_ia_wy_0_001", role: "farmer", context: "idle_after_resolve", mood: "weary", levelBand: 0, text: "Peaceful mornings now. Hard to remember what the fuss was about." },

    // ── idle_after_resolve — band 1 ──────────────────────────────────────────
    { id: "farmer_ia_wm_1_001", role: "farmer", context: "idle_after_resolve", mood: "warm",  levelBand: 1, text: "Best harvest I've seen in years. Feels like things turned a corner." },
    { id: "farmer_ia_cl_1_001", role: "farmer", context: "idle_after_resolve", mood: "calm",  levelBand: 1, text: "Neighbors wave now. That row's long settled, thanks to you." },
    { id: "farmer_ia_cu_1_001", role: "farmer", context: "idle_after_resolve", mood: "curious", levelBand: 1, text: "I still wonder what spooked her out there near {biome_feature}." },

    // ── idle_after_resolve — band 2 ──────────────────────────────────────────
    { id: "farmer_ia_wm_2_001", role: "farmer", context: "idle_after_resolve", mood: "warm",  levelBand: 2, text: "Gran's box sits on the mantle now. Fits perfectly up there." },
    { id: "farmer_ia_wy_2_001", role: "farmer", context: "idle_after_resolve", mood: "weary", levelBand: 2, text: "Valley's quiet again. Three farms, no drama. That's all I wanted." },
    { id: "farmer_ia_cu_2_001", role: "farmer", context: "idle_after_resolve", mood: "curious", levelBand: 2, text: "The ox keeps looking toward {biome_feature}. Wonder what he found there." },

    // ── idle_after_resolve — band 3 ──────────────────────────────────────────
    { id: "farmer_ia_cl_3_001", role: "farmer", context: "idle_after_resolve", mood: "calm",  levelBand: 3, text: "Some days I think this old farm would've fallen apart without you." },
    { id: "farmer_ia_wm_3_001", role: "farmer", context: "idle_after_resolve", mood: "warm",  levelBand: 3, text: "Tell you what — you're always welcome to rest here. No question asked." },
    { id: "farmer_ia_wy_3_001", role: "farmer", context: "idle_after_resolve", mood: "weary", levelBand: 3, text: "I've worked this land forty years. You've done more good in one visit." },
];
