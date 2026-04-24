import { describe, expect, it } from 'vitest';
import { buildHudGoal } from '../../src/config/hud-goal';
import { HUD_GOAL_CONFIG } from '../../src/content/gameplay';

/**
 * T11-05 — goal HUD builder.
 *
 * Locks the branching logic that turns raw game state into the
 * player-facing "next step" widget. The widget is the answer to the
 * gap flagged by the 1.0 onboarding capture: before the starter
 * ceremony completes, the HUD was silent — now it carries an
 * orientation hint at every moment of gameplay.
 */

describe('buildHudGoal', () => {
    it('pre-starter state points the player at Selby', () => {
        const out = buildHudGoal({
            partySize: 0,
            partyMax: 6,
            starterChosen: false,
        });
        expect(out.heading).toBe(HUD_GOAL_CONFIG.headingPreStarter);
        expect(out.objective).toBe(HUD_GOAL_CONFIG.objectivePreStarter);
        expect(out.partyCurrent).toBe(0);
        expect(out.partyMax).toBe(6);
        // The party label must interpolate — this is how the player
        // reads "0 / 6" at a glance and knows the party is still empty.
        expect(out.partyLabel).toContain('0');
        expect(out.partyLabel).toContain('6');
    });

    it('post-starter state switches to exploration framing', () => {
        const out = buildHudGoal({
            partySize: 1,
            partyMax: 6,
            starterChosen: true,
        });
        expect(out.heading).toBe(HUD_GOAL_CONFIG.headingPostStarter);
        expect(out.objective).toBe(HUD_GOAL_CONFIG.objectivePostStarter);
        expect(out.partyCurrent).toBe(1);
        expect(out.partyLabel).toContain('1');
        expect(out.partyLabel).toContain('6');
    });

    it('renders the full party (6/6) correctly', () => {
        const out = buildHudGoal({
            partySize: 6,
            partyMax: 6,
            starterChosen: true,
        });
        expect(out.partyCurrent).toBe(6);
        expect(out.partyLabel).toContain('6');
    });
});
