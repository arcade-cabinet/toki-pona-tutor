type GraphicsLike = {
    clear: () => void;
    rect: (x: number, y: number, width: number, height: number) => void;
    fill: (style: number | { color: number; alpha?: number }) => void;
};

type ViewportLike = {
    mask?: GraphicsLike | null;
    viewport?: {
        screenWidth?: number;
        screenHeight?: number;
    } | null;
};

export type ViewportComponentConstructor = {
    __pokiMaskPatchInstalled?: boolean;
    prototype: {
        updateMask: () => void;
    };
};

export function applyViewportMaskRect(target: ViewportLike): void {
    const mask = target.mask;
    const viewport = target.viewport;
    if (!mask || !viewport) {
        return;
    }

    mask.clear();
    mask.rect(0, 0, viewport.screenWidth ?? 0, viewport.screenHeight ?? 0);
    mask.fill(0xffffff);
}

export function patchViewportMaskConstructor(viewportClass: ViewportComponentConstructor): void {
    if (viewportClass.__pokiMaskPatchInstalled) {
        return;
    }

    viewportClass.prototype.updateMask = function updateMask(this: ViewportLike): void {
        applyViewportMaskRect(this);
    };

    viewportClass.__pokiMaskPatchInstalled = true;
}
