/**
 * Stage 0 map-authoring toolchain — shared types.
 *
 * See docs/build-time/MAP_AUTHORING.md for the full design contract.
 * Types here are the public surface of the lib/ modules; tests under
 * tests/build-time/ pin them against expected behavior.
 */

/**
 * A single Tiled tileset definition, parsed from `.tsx` XML.
 * Corresponds to Tiled 1.10's tileset schema (subset we actually use).
 */
export interface ParsedTileset {
  /** Relative path to the `.tsx` as authored in the map (e.g. "../Tilesets/Tileset_Ground.tsx"). */
  source: string;
  /** Resolved absolute path on disk. */
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
}

export type PropertyValue = string | number | boolean;

export interface AnimationFrame {
  /** Local tile id referenced by this frame. */
  tileid: number;
  /** Duration in milliseconds. */
  duration: number;
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
   * Optional multi-tile footprint. If present, a `place` entry expands
   * into (w*h) tile placements anchored at the top-left. Defaults to
   * { w: 1, h: 1 } if omitted.
   */
  multiTile?: { w: number; h: number };
}

/** A palette is just a bag of named entries. */
export type Palette = Record<string, PaletteEntry>;

/**
 * Object-layer markers. Authored in the MapSpec; emitted to Tiled object
 * layers with appropriate custom properties.
 */
export type ObjectMarker =
  | { type: 'SpawnPoint'; name: string; at: [number, number]; props?: Record<string, PropertyValue> }
  | { type: 'Sign'; name: string; at: [number, number]; props: { text: string } & Record<string, PropertyValue> }
  | {
      type: 'NPC';
      name: string;
      at: [number, number];
      props: { id: string; dialog_id: string } & Record<string, PropertyValue>;
    }
  | {
      type: 'Warp';
      name: string;
      rect: [number, number, number, number];
      props: { target_map: string; target_spawn: string } & Record<string, PropertyValue>;
    }
  | {
      type: 'Trigger';
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
  width: number;
  height: number;
  tileSize: number;
  /** Tilesets referenced by this map; resolved from the palette. */
  tilesets: string[];
  /** The palette that names in `paint` and `place` resolve against. */
  palette: Palette;
  layers: {
    /** Grid of palette names — use `paint` tagged template or a 2D array. */
    'Below Player': TileGrid;
    World?: TileGrid | PlacedTile[];
    'Above Player'?: TileGrid | PlacedTile[];
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
 * write the fields Phaser's tilemapTiledJSON loader consumes.
 */
export interface TmjMap {
  type: 'map';
  version: '1.10';
  tiledversion: string;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  infinite: false;
  compressionlevel: number;
  nextlayerid: number;
  nextobjectid: number;
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
  type: 'tilelayer';
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
  type: 'objectgroup';
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
  type: 'string' | 'int' | 'float' | 'bool';
  value: PropertyValue;
}

/** Validator result: collection of diagnostics. */
export interface ValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  at?: { x?: number; y?: number; layer?: string; name?: string };
}

export interface ValidationReport {
  mapId: string;
  issues: ValidationIssue[];
  ok: boolean;
}
