/**
 * Rumor persistence — store and retrieve active rumors across sessions.
 *
 * Rumors are NPC hints about unvisited chunks. They're generated on NPC
 * interaction and stored here as a JSON array in preferences.
 *
 * Per docs/DIALOG_POOL.md § Rumor system.
 */

import type { Rumor } from "../../modules/rumor-resolver";
import { expireRumors } from "../../modules/rumor-resolver";
import { preferences, KEYS } from "./preferences";

export async function loadActiveRumors(): Promise<Rumor[]> {
    const stored = await preferences.get(KEYS.activeRumors);
    if (!stored) return [];
    try {
        return JSON.parse(stored) as Rumor[];
    } catch {
        return [];
    }
}

export async function saveActiveRumors(rumors: Rumor[]): Promise<void> {
    await preferences.set(KEYS.activeRumors, JSON.stringify(rumors));
}

export async function addRumor(rumor: Rumor): Promise<void> {
    const current = await loadActiveRumors();
    const deduplicated = current.filter((r) => r.templateId !== rumor.templateId);
    await saveActiveRumors([...deduplicated, rumor]);
}

export async function pruneExpiredRumors(currentDay: number): Promise<void> {
    const current = await loadActiveRumors();
    await saveActiveRumors(expireRumors(current, currentDay));
}
