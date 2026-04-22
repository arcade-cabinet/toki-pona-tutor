/**
 * Canvas/Pixi-compatible mirrors of the CSS brand tokens in brand.css.
 * Pixi TextStyle and Graphics APIs need numeric colors and font strings,
 * so canvas surfaces import these instead of hardcoding raw values.
 */
export const BRAND_CANVAS_COLORS = {
    cream: 0xfdf6e3,
    ink: 0x3d2e1e,
} as const;

export const BRAND_CANVAS_FONTS = {
    display: "Fredoka, Nunito, sans-serif",
} as const;
