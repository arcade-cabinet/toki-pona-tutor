/**
 * Dialog pool — guide role.
 * The starter Guide appears only at (0,0) on fresh save. Tutorial-only; no challenges.
 * Moods: calm, warm, weary, curious. Bands: 0-3. Contexts: greeting, ambient.
 */
import type { DialogLine } from "../../modules/dialog-pool";

export const guide: DialogLine[] = [
    // ── greeting ──────────────────────────────────────────────────────────────
    { id: "guide_g_cl_0_001", role: "guide", context: "greeting", mood: "calm",    levelBand: 0, text: "Welcome, Rivers. The world opens wide from here." },
    { id: "guide_g_cl_0_002", role: "guide", context: "greeting", mood: "calm",    levelBand: 0, text: "You made it. The path ahead is yours to choose." },
    { id: "guide_g_wm_0_001", role: "guide", context: "greeting", mood: "warm",    levelBand: 0, text: "Ah, there you are. I was beginning to wonder." },
    { id: "guide_g_wm_0_002", role: "guide", context: "greeting", mood: "warm",    levelBand: 0, text: "Good to see you standing on your own two feet." },
    { id: "guide_g_cl_1_001", role: "guide", context: "greeting", mood: "calm",    levelBand: 1, text: "You've wandered far. Come, rest a moment." },
    { id: "guide_g_wm_1_001", role: "guide", context: "greeting", mood: "warm",    levelBand: 1, text: "Look how you've grown. The world suits you." },
    { id: "guide_g_cl_2_001", role: "guide", context: "greeting", mood: "calm",    levelBand: 2, text: "Rivers. You look like someone who's been places." },
    { id: "guide_g_wm_2_001", role: "guide", context: "greeting", mood: "warm",    levelBand: 2, text: "I knew you'd come back this way eventually." },
    { id: "guide_g_cl_3_001", role: "guide", context: "greeting", mood: "calm",    levelBand: 3, text: "You've seen the far edges. How do they look from here?" },
    { id: "guide_g_wm_3_001", role: "guide", context: "greeting", mood: "warm",    levelBand: 3, text: "Old friend. The world is still big, isn't it?" },

    // ── ambient ───────────────────────────────────────────────────────────────
    { id: "guide_a_cl_0_001", role: "guide", context: "ambient", mood: "calm",    levelBand: 0, text: "The tall grass holds more than it looks." },
    { id: "guide_a_cl_0_002", role: "guide", context: "ambient", mood: "calm",    levelBand: 0, text: "Throw a capture pod when the moment feels right." },
    { id: "guide_a_wm_0_001", role: "guide", context: "ambient", mood: "warm",    levelBand: 0, text: "Every creature you meet is worth knowing." },
    { id: "guide_a_wm_0_002", role: "guide", context: "ambient", mood: "warm",    levelBand: 0, text: "The villages are friendly. Don't be a stranger." },
    { id: "guide_a_cu_0_001", role: "guide", context: "ambient", mood: "curious", levelBand: 0, text: "What do you think lives past that ridge?" },
    { id: "guide_a_cl_1_001", role: "guide", context: "ambient", mood: "calm",    levelBand: 1, text: "The farther you walk, the stranger the creatures." },
    { id: "guide_a_wm_1_001", role: "guide", context: "ambient", mood: "warm",    levelBand: 1, text: "Gold isn't the point, but it doesn't hurt." },
    { id: "guide_a_cu_1_001", role: "guide", context: "ambient", mood: "curious", levelBand: 1, text: "I wonder what the snow holds that the forest doesn't." },
    { id: "guide_a_cl_2_001", role: "guide", context: "ambient", mood: "calm",    levelBand: 2, text: "The ruins out there have stories no one tells anymore." },
    { id: "guide_a_cl_3_001", role: "guide", context: "ambient", mood: "calm",    levelBand: 3, text: "You don't need my advice anymore. But I enjoy giving it." },
    { id: "guide_a_wy_3_001", role: "guide", context: "ambient", mood: "weary",   levelBand: 3, text: "I've stood here a long time. It doesn't get old." },
];
