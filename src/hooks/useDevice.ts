import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Reactive device-form-factor detection for laying out mobile controls.
 *
 * Uses web APIs (matchMedia + visualViewport + pointer-type) for live
 * orientation / resize tracking, and Capacitor's Device plugin for
 * authoritative form-factor/platform info when running natively. Web
 * builds fall back gracefully — Capacitor.getPlatform() returns 'web'
 * and we use heuristics only.
 */
export type FormFactor = 'phone' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type Platform = 'web' | 'ios' | 'android';

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
  /** Native platform — 'web' in a browser, 'ios'/'android' in a Capacitor shell. */
  platform: Platform;
  /** True when running inside a Capacitor native shell. */
  isNative: boolean;
  /** Native model name (e.g. "iPhone15,2") when available, otherwise undefined. */
  model?: string;
}

let nativeOverride: { formFactor?: FormFactor; model?: string } = {};

function readNow(): DeviceInfo {
  const capPlatform = Capacitor.getPlatform() as Platform;
  const isNative = Capacitor.isNativePlatform();
  if (typeof window === 'undefined') {
    return {
      formFactor: 'desktop',
      orientation: 'landscape',
      touch: false,
      dpr: 1,
      width: 1024,
      height: 768,
      hasFold: false,
      platform: capPlatform,
      isNative,
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  // Form factor: prefer the native override from Capacitor when we have it.
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  let formFactor: FormFactor;
  if (nativeOverride.formFactor) {
    formFactor = nativeOverride.formFactor;
  } else if (!touch && longEdge >= 1024) {
    formFactor = 'desktop';
  } else if (shortEdge < 600) {
    formFactor = 'phone';
  } else {
    formFactor = 'tablet';
  }
  const orientation: Orientation = width >= height ? 'landscape' : 'portrait';
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
    platform: capPlatform,
    isNative,
    model: nativeOverride.model,
  };
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(() => readNow());

  useEffect(() => {
    const update = () => setInfo(readNow());

    // If Capacitor is available, ask for authoritative native device info
    // once and cache it. The plugin reports 'mobile' vs 'tablet' vs 'desktop'
    // directly — trust it over viewport heuristics on native.
    if (Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'web') {
      Device.getInfo()
        .then((d) => {
          nativeOverride = {
            formFactor:
              d.platform === 'web'
                ? undefined
                : // Capacitor does not return tablet directly — infer via the
                  // isVirtual + operatingSystem + model string when needed.
                  'phone',
            model: d.model,
          };
          update();
        })
        .catch(() => {
          /* ignore — stick with heuristic */
        });
    }

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
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
