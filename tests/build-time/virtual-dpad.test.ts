import { describe, it, expect } from 'vitest';
import {
    directionFromOffset,
    isTap,
    directionToKey,
    buttonFromTouchTarget,
} from '../../src/modules/main/virtual-dpad';

describe('directionFromOffset — 4-way with dead zone', () => {
    const deadZone = 16;

    it('right pull → right', () => {
        expect(directionFromOffset({ tx: 50, ty: 0, deadZone })).toBe('right');
    });

    it('left pull → left', () => {
        expect(directionFromOffset({ tx: -50, ty: 0, deadZone })).toBe('left');
    });

    it('up pull (negative y) → up', () => {
        expect(directionFromOffset({ tx: 0, ty: -50, deadZone })).toBe('up');
    });

    it('down pull (positive y) → down', () => {
        expect(directionFromOffset({ tx: 0, ty: 50, deadZone })).toBe('down');
    });

    it('dead zone returns null', () => {
        expect(directionFromOffset({ tx: 5, ty: 5, deadZone })).toBeNull();
        expect(directionFromOffset({ tx: 15, ty: 15, deadZone })).toBeNull();
    });

    it('boundary of dead zone — equal axes → null (ambiguous)', () => {
        expect(directionFromOffset({ tx: 20, ty: 20, deadZone })).toBeNull();
    });

    it('diagonal snap to larger axis (|tx| > |ty|)', () => {
        expect(directionFromOffset({ tx: 30, ty: 20, deadZone })).toBe('right');
    });

    it('diagonal snap to larger axis (|ty| > |tx|)', () => {
        expect(directionFromOffset({ tx: 10, ty: -30, deadZone })).toBe('up');
    });

    it('tiny drift just outside dead zone still snaps', () => {
        expect(directionFromOffset({ tx: 17, ty: 0, deadZone })).toBe('right');
    });
});

describe('isTap — touch gesture classification', () => {
    const cfg = { tapRadius: 12, tapMaxDurationMs: 250 };

    it('small move + quick release → tap', () => {
        expect(isTap({ dx: 5, dy: 3, durationMs: 120, ...cfg })).toBe(true);
    });

    it('exactly at tapRadius boundary still counts', () => {
        expect(isTap({ dx: 12, dy: 0, durationMs: 100, ...cfg })).toBe(true);
    });

    it('exactly at duration boundary still counts', () => {
        expect(isTap({ dx: 0, dy: 0, durationMs: 250, ...cfg })).toBe(true);
    });

    it('moved too far → not a tap (swipe)', () => {
        expect(isTap({ dx: 40, dy: 0, durationMs: 100, ...cfg })).toBe(false);
    });

    it('held too long → not a tap', () => {
        expect(isTap({ dx: 2, dy: 2, durationMs: 500, ...cfg })).toBe(false);
    });

    it('euclidean distance, not axis-aligned', () => {
        // Point (9, 9) is at distance √162 ≈ 12.73 > 12 — NOT a tap
        expect(isTap({ dx: 9, dy: 9, durationMs: 100, ...cfg })).toBe(false);
    });
});

describe('directionToKey — Arrow* synthetic keys', () => {
    it('maps all 4 directions', () => {
        expect(directionToKey('up')).toBe('ArrowUp');
        expect(directionToKey('down')).toBe('ArrowDown');
        expect(directionToKey('left')).toBe('ArrowLeft');
        expect(directionToKey('right')).toBe('ArrowRight');
    });
});

describe('buttonFromTouchTarget', () => {
    it('dpad-confirm / btn-a → confirm', () => {
        expect(buttonFromTouchTarget('dpad-confirm')).toBe('confirm');
        expect(buttonFromTouchTarget('btn-a')).toBe('confirm');
    });

    it('dpad-cancel / btn-b → cancel', () => {
        expect(buttonFromTouchTarget('dpad-cancel')).toBe('cancel');
        expect(buttonFromTouchTarget('btn-b')).toBe('cancel');
    });

    it('dpad-menu → menu', () => {
        expect(buttonFromTouchTarget('dpad-menu')).toBe('menu');
    });

    it('unknown target → null', () => {
        expect(buttonFromTouchTarget('some-other-element')).toBeNull();
        expect(buttonFromTouchTarget('')).toBeNull();
    });
});
