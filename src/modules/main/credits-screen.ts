import type { RpgPlayer } from "@rpgjs/server";
import { CREDITS_PAGES } from "../../content/gameplay";

export { CREDITS_PAGES };

export async function showCredits(player: RpgPlayer): Promise<void> {
    for (const page of CREDITS_PAGES) {
        await player.showText(page);
    }
}
