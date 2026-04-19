import { useEffect, useState } from 'react';

/**
 * Reactive device-form-factor detection for laying out mobile controls.
 *
 * Web-only for now (matchMedia + visualViewport + pointer-type). A future
 * Capacitor layer can augment this with real native device info — the shape
 * of the returned object should stay stable so call-sites don't have to
 * change when the Capacitor plugin lands.
 */
export type FormFactor = 'phone' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  formFactor: FormFactor;
  orientation: Orientation;
  /** True on any coarse-pointer device (phone, tablet, kiosk touch-screen). */
  touch: boolean;
  /** Device-pixel-ratio — useful for bumping image resolution. */
  dpr: number;
  /** Viewport dimensions in CSS pixels. */
  width: number;
  height: number;
  /** Foldable/dual-screen fold boundary if the browser exposes it (CSS env). */
  hasFold: boolean;
}

function readNow(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      formFactor: 'desktop',
      orientation: 'landscape',
      touch: false,
      dpr: 1,
      width: 1024,
      height: 768,
      hasFold: false,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  // Form factor: use short-edge heuristic. Phones have a short-edge < 600 CSS px.
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  let formFactor: FormFactor;
  if (!touch && longEdge >= 1024) {
    formFactor = 'desktop';
  } else if (shortEdge < 600) {
    formFactor = 'phone';
  } else {
    formFactor = 'tablet';
  }
  const orientation: Orientation = width >= height ? 'landscape' : 'portrait';
  // Foldable: the Viewport Segments API exposes `window.visualViewport.segments`
  // or the `env(viewport-segment-*)` CSS env, but browser support is spotty.
  // Fall back to a heuristic: width > 1600 AND aspect > 2:1 suggests a folded
  // landscape device like a Surface Duo or Z Fold.
  const segAny = (window as unknown as { visualViewport?: { segments?: unknown[] } }).visualViewport;
  const hasSegments = Array.isArray(segAny?.segments) && (segAny!.segments!.length ?? 0) > 1;
  const hasFold = hasSegments || (width / height > 2.2 && width > 1500);

  return {
    formFactor,
    orientation,
    touch,
    dpr: window.devicePixelRatio || 1,
    width,
    height,
    hasFold,
  };
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => readNow());

  useEffect(() => {
    const update = () => setInfo(readNow());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    // Some mobile browsers only fire visualViewport events for keyboard show/hide
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      vv?.removeEventListener('resize', update);
    };
  }, []);

  return info;
}
