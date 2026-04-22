/**
 * Stage 0 map-authoring toolchain — shared types.
 *
 * See docs/build-time/MAP_AUTHORING.md for the full design contract.
 * Types here are the public surface of the lib/ modules; tests under
 * tests/build-time/ pin them against expected behavior.
 */
import type { MapBiome, MapMusicTrack } from "../../../src/content/map-metadata";

/**
 * A single Tiled tileset definition, parsed from `.tsx` XML.
 * Corresponds to Tiled 1.10's tileset schema (subset we actually use).
 */
export interface ParsedTileset {
    /**
     * Absolute path the parser opened to read this tileset. In Tiled's own
     * data model tilesets can be referenced by relative path from a map —
     * that relative path shows up elsewhere (on TMJ TmjTilesetRef.source).
     * ParsedTileset itself is always fully resolved, so `source` and
     * `absolutePath` carry the same value. The pair is preserved for
     * symmetry with the on-disk XML schema and to leave room for a future
     * lazy-loading flavor that would keep `source` as the author's path.
     */
    source: string;
    /** Resolved absolute path on disk (same as `source` today — see above). */
    absolutePath: string;
    /** The `name` attribute on the `<tileset>` element. */
    name: string;
    /** Width and height of a single tile in pixels. */
    tileWidth: number;
    tileHeight: number;
    /** Total tile count declared by the tileset. */
    tileCount: number;
    /** Number of columns in the image grid. */
    columns: number;
    /** Spacing between tiles in the image, in pixels (default 0). */
    spacing: number;
    /** Margin around the image edges, in pixels (default 0). */
    margin: number;
    /** Source image — relative (as authored) + resolved absolute path. */
    image: {
        source: string;
        absolutePath: string;
        width: number;
        height: number;
    };
    /**
     * Per-tile custom properties keyed by local tile id. Only tiles that
     * declare properties appear here. Common property: `collides: true`.
     */
    properties: Record<number, Record<string, PropertyValue>>;
    /**
     * Per-tile animation frames keyed by local tile id. Only tiles that
     * declare animations appear here.
     */
    animations: Record<number, AnimationFrame[]>;
    /**
     * Per-tile placement probability hints from the original Tiled tileset.
     * These are useful for identifying "variation" tiles that should be
     * sprinkled across a surface instead of used as dominant base paint.
     */
    probabilities: Record<number, number>;
    /**
     * Per-tile collision/object metadata authored inside TSX files. Image
     * collection tiles (trees, bushes, buildings) often use these polygons to
     * describe the walk-blocking foot of a sprite that is visually much larger
     * than a single map cell.
     */
    objectGroups: Record<number, ParsedTileObject[]>;
    /**
     * Wang terrain sets shipped by the tileset author. These describe transition
     * families such as Grass ↔ Dirt, Grass ↔ Dark Grass, Road ↔ Brick Road.
     */
    wangsets: ParsedWangset[];
    /**
     * True when the tileset uses Tiled's "collection of images" mode (each
     * tile has its own <image> element). The top-level `image` field is then
     * the first per-tile image (for backwards compat with atlas-style
     * consumers); the renderer special-cases this mode via perTileImages.
     */
    isCollection: boolean;
    /**
     * Per-tile images for collection-of-images tilesets. Empty for atlas
     * tilesets.
     */
    perTileImages: Record<
        number,
        { source: string; absolutePath: string; width: number; height: number }
    >;
}

export type PropertyValue = string | number | boolean;

export interface AnimationFrame {
    /** Local tile id referenced by this frame. */
    tileid: number;
    /** Duration in milliseconds. */
    duration: number;
}

export interface ParsedPoint {
    x: number;
    y: number;
}

export interface ParsedTileObject {
    id: number | null;
    x: number;
    y: number;
    width: number;
    height: number;
    polygon?: ParsedPoint[];
}

export interface ParsedWangColor {
    /** 1-based index used by Tiled wangid arrays; 0 means "no color". */
    index: number;
    name: string;
    color: string;
    tile: number;
    probability: number;
}

export interface ParsedWangTile {
    tileid: number;
    wangid: number[];
}

export interface ParsedWangset {
    name: string;
    type: string;
    tile: number;
    colors: ParsedWangColor[];
    tiles: ParsedWangTile[];
}

/**
 * A palette entry — maps a human-readable name to a specific tile in a
 * specific tileset. Populated by authors (bottom-up from spec needs).
 */
export interface PaletteEntry {
    /** The name of the `.tsx` file (without extension), e.g. "Tileset_Ground". */
    tsx: string;
    /** Local tile id within that tileset (0-indexed). */
    local_id: number;
    /** Optional human description, for maintenance. */
    description?: string;
    /**
     * Optional author-level surface classification. The validator can infer
     * common Fan-tasy categories from TSX metadata, but explicit semantics are
     * the durable way to say how a named palette tile should be used.
     */
    surface?: PaletteSurface;
    /** Override inferred walkability when a palette entry is intentionally odd. */
    walkable?: boolean;
    /** Authoring role: base paint, encounter grass, transition tile, blocker, or prop. */
    role?: PaletteRole;
    /**
     * Optional multi-tile footprint. If present, a `place` entry expands
     * into (w*h) tile placements anchored at the top-left. Defaults to
     * { w: 1, h: 1 } if omitted.
     */
    multiTile?: { w: number; h: number };
}

/** A palette is just a bag of named entries. */
export type Palette = Record<string, PaletteEntry>;

export type PaletteSurface =
    | "smooth-grass"
    | "rough-grass"
    | "dirt-path"
    | "stone-path"
    | "sand"
    | "snow"
    | "ice"
    | "stone-floor"
    | "deep-water"
    | "wall"
    | "prop"
    | "unknown";

export type PaletteRole =
    | "base"
    | "variation"
    | "transition"
    | "encounter"
    | "blocker"
    | "decoration";

/**
 * Object-layer markers. Authored in the MapSpec; emitted to Tiled object
 * layers with appropriate custom properties.
 */
export type ObjectMarker =
    | {
          type: "SpawnPoint";
          name: string;
          at: [number, number];
          props?: Record<string, PropertyValue>;
      }
    | {
          type: "Sign";
          name: string;
          at: [number, number];
          props: { text: string } & Record<string, PropertyValue>;
      }
    | {
          type: "NPC";
          name: string;
          at: [number, number];
          props: { id: string; dialog_id: string } & Record<string, PropertyValue>;
      }
    | {
          type: "Warp";
          name: string;
          rect: [number, number, number, number];
          props: { target_map: string; target_spawn: string } & Record<string, PropertyValue>;
      }
    | {
          type: "Trigger";
          name: string;
          rect: [number, number, number, number];
          props: Record<string, PropertyValue>;
      };

/**
 * Encounter-layer entry: a tall-grass rectangle with a weighted species table.
 */
export interface EncounterZone {
    /** Tile-unit rect: [x, y, w, h]. */
    rect: [number, number, number, number];
    /** Species id → weight. */
    species: Record<string, number>;
    /** Inclusive level range for rolls in this zone. */
    levelRange: [number, number];
}

/**
 * A fully-authored map spec. Compiles to `.tmj` via the emitter.
 */
export interface MapSpec {
    id: string;
    /** Visual/content biome. Emitted as a Tiled map-level custom property. */
    biome: MapBiome;
    /** Ambient BGM track for this map. Emitted as `music_track`. */
    music_track: MapMusicTrack;
    width: number;
    height: number;
    tileSize: number;
    /** Tilesets referenced by this map; resolved from the palette. */
    tilesets: string[];
    /** The palette that names in `paint` and `place` resolve against. */
    palette: Palette;
    layers: {
        /** Grid of palette names — use `paint` tagged template or a 2D array. */
        "Below Player": TileGrid;
        World?: TileGrid | PlacedTile[];
        "Above Player"?: TileGrid | PlacedTile[];
        Objects?: ObjectMarker[];
        Encounters?: EncounterZone[];
    };
}

/** A 2D grid of palette names (or empty markers) — one entry per tile cell. */
export type TileGrid = string[][];

/** An individual tile placed at a position. Used in `place` mode. */
export interface PlacedTile {
    at: [number, number];
    tile: string;
}

/**
 * The Tiled 1.10 JSON (TMJ) shape we emit. This is a subset; we only
 * write the fields Tiled JSON consumers and our runtime archive tooling need.
 */
export interface TmjMap {
    type: "map";
    version: "1.10";
    tiledversion: string;
    orientation: "orthogonal";
    renderorder: "right-down";
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    infinite: false;
    compressionlevel: number;
    nextlayerid: number;
    nextobjectid: number;
    properties?: TmjProperty[];
    tilesets: TmjTilesetRef[];
    layers: TmjLayer[];
}

export interface TmjTilesetRef {
    firstgid: number;
    source: string;
}

export type TmjLayer = TmjTileLayer | TmjObjectLayer;

export interface TmjTileLayer {
    id: number;
    type: "tilelayer";
    name: string;
    width: number;
    height: number;
    x: 0;
    y: 0;
    visible: boolean;
    opacity: number;
    /** Flat array, row-major, global tile IDs (0 = empty). */
    data: number[];
}

export interface TmjObjectLayer {
    id: number;
    type: "objectgroup";
    name: string;
    x: 0;
    y: 0;
    visible: boolean;
    opacity: number;
    objects: TmjObject[];
}

export interface TmjObject {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    rotation: 0;
    properties?: TmjProperty[];
    /** Absolute GID for tile-object marker (we don't emit these for our marker types). */
    gid?: number;
}

export interface TmjProperty {
    name: string;
    type: "string" | "int" | "float" | "bool";
    value: PropertyValue;
}

/** Validator result: collection of diagnostics. */
export interface ValidationIssue {
    severity: "error" | "warning";
    code: string;
    message: string;
    at?: { x?: number; y?: number; layer?: string; name?: string };
}

export interface ValidationReport {
    mapId: string;
    issues: ValidationIssue[];
    ok: boolean;
}
