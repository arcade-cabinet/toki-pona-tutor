/**
 * Virtual d-pad input semantics — T5-06.
 *
 * Mobile players need a touchscreen d-pad overlay. RPG.js v5's grid-
 * stepped player controller expects discrete directional presses —
 * the same semantics as keyboard arrow keys. This module translates
 * a touch-point relative to the d-pad center into one of 4 cardinal
 * directions (or null = dead zone), plus "tap to confirm" detection.
 *
 * Pure functions — no touch event listeners, no DOM. The runtime
 * binds touchstart/touchmove/touchend and calls these helpers to
 * decide which synthetic keyboard event to emit.
 */

export type DpadDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Convert a touch offset (tx, ty) from the d-pad center into a cardinal
 * direction, or null if inside the dead zone. Diagonal touches snap to
 * the axis with larger magnitude — matches keyboard semantics where
 * the player can only press one arrow at a time.
 *
 * @example
 * directionFromOffset({ tx: 50, ty: 0, deadZone: 16 })       // → 'right'
 * directionFromOffset({ tx: 0, ty: -50, deadZone: 16 })      // → 'up'
 * directionFromOffset({ tx: 30, ty: 20, deadZone: 16 })      // → 'right' (|tx| > |ty|)
 * directionFromOffset({ tx: 5, ty: 5, deadZone: 16 })        // → null (dead zone)
 * directionFromOffset({ tx: 20, ty: 20, deadZone: 16 })      // → null (diagonal, equal)
 */
export function directionFromOffset(params: {
    tx: number;
    ty: number;
    deadZone: number;
}): DpadDirection | null {
    const { tx, ty, deadZone } = params;
    const ax = Math.abs(tx);
    const ay = Math.abs(ty);
    if (ax < deadZone && ay < deadZone) return null;
    if (ax === ay) return null; // exactly 45° — ambiguous, no input
    if (ax > ay) return tx > 0 ? 'right' : 'left';
    return ty > 0 ? 'down' : 'up';
}

/**
 * A tap is a touch that starts and ends within the tapRadius, within
 * tapMaxDurationMs. Used for "confirm" / menu-select when the player
 * is not actively holding a direction.
 *
 * @example
 * isTap({ dx: 5, dy: 3, durationMs: 120, tapRadius: 12, tapMaxDurationMs: 250 })
 * // → true (small move, quick release)
 * isTap({ dx: 40, dy: 0, durationMs: 100, tapRadius: 12, tapMaxDurationMs: 250 })
 * // → false (moved too far — that's a swipe)
 */
export function isTap(params: {
    dx: number;
    dy: number;
    durationMs: number;
    tapRadius: number;
    tapMaxDurationMs: number;
}): boolean {
    const distance = Math.sqrt(params.dx * params.dx + params.dy * params.dy);
    return distance <= params.tapRadius && params.durationMs <= params.tapMaxDurationMs;
}

/**
 * Map a direction to RPG.js v5's synthetic key codes. Uses the same
 * Arrow* / WASD equivalents the keyboard handler recognizes — so
 * every downstream key listener works unmodified.
 */
export function directionToKey(direction: DpadDirection): string {
    switch (direction) {
        case 'up': return 'ArrowUp';
        case 'down': return 'ArrowDown';
        case 'left': return 'ArrowLeft';
        case 'right': return 'ArrowRight';
    }
}

/**
 * 8-way chording: while the player holds a direction, a second touch
 * can register a secondary action (A/B buttons on the right side of
 * the screen). This mirrors classic handheld layout — d-pad on left,
 * action buttons on right — without conflicting with direction input.
 */
export type ActionButton = 'confirm' | 'cancel' | 'menu';

export function buttonFromTouchTarget(targetId: string): ActionButton | null {
    if (targetId === 'dpad-confirm' || targetId === 'btn-a') return 'confirm';
    if (targetId === 'dpad-cancel' || targetId === 'btn-b') return 'cancel';
    if (targetId === 'dpad-menu') return 'menu';
    return null;
}
