/**
 * MapSpec → TMJ emitter.
 *
 * Given a spec + the parsed tilesets it references, produce a Tiled 1.10 JSON
 * map object ready to be stringified to disk under public/assets/maps/<id>.tmj.
 *
 * Contract covered by tests/build-time/emitter.test.ts. See also
 * docs/build-time/MAP_AUTHORING.md § "The TMJ emitter".
 */
import { relative, dirname } from 'node:path';
import type {
  MapSpec,
  ParsedTileset,
  TmjMap,
  TmjLayer,
  TmjObject,
  TmjProperty,
  TmjTilesetRef,
  PropertyValue,
  ObjectMarker,
  EncounterZone,
  PlacedTile,
  TileGrid,
} from './types';
import { assignFirstGids, resolvePaletteName, tsxStem } from './palette';

const TIED_VERSION = '1.11.2';

const LAYER_ORDER = ['Below Player', 'World', 'Above Player'] as const;

export function emitTmj(
  spec: MapSpec,
  tilesets: ParsedTileset[],
  outputPath: string,
): TmjMap {
  const referenced = spec.tilesets.map((name) => {
    const ts = tilesets.find((t) => tsxStem(t) === name);
    if (!ts) {
      throw new Error(
        `emit: spec.tilesets references "${name}" but it is not loaded (pass it in the tilesets arg)`,
      );
    }
    return ts;
  });

  const firstGids = assignFirstGids(referenced);

  const tilesetRefs: TmjTilesetRef[] = referenced.map((ts) => {
    const firstgid = firstGids.get(tsxStem(ts))!;
    return {
      firstgid,
      source: relative(dirname(outputPath), ts.absolutePath),
    };
  });

  let nextLayerId = 1;
  let nextObjectId = 1;
  const layers: TmjLayer[] = [];

  for (const layerName of LAYER_ORDER) {
    const source = spec.layers[layerName];
    if (!source) continue;
    const data = renderTileLayer(source, spec, referenced, firstGids);
    layers.push({
      id: nextLayerId++,
      type: 'tilelayer',
      name: layerName,
      width: spec.width,
      height: spec.height,
      x: 0,
      y: 0,
      visible: true,
      opacity: 1,
      data,
    });
  }

  if (spec.layers.Objects && spec.layers.Objects.length > 0) {
    const { objects, nextId } = emitObjects(spec.layers.Objects, spec.tileSize, nextObjectId);
    nextObjectId = nextId;
    layers.push({
      id: nextLayerId++,
      type: 'objectgroup',
      name: 'Objects',
      x: 0,
      y: 0,
      visible: true,
      opacity: 1,
      objects,
    });
  }

  if (spec.layers.Encounters && spec.layers.Encounters.length > 0) {
    const { objects, nextId } = emitEncounters(
      spec.layers.Encounters,
      spec.tileSize,
      nextObjectId,
    );
    nextObjectId = nextId;
    layers.push({
      id: nextLayerId++,
      type: 'objectgroup',
      name: 'Encounters',
      x: 0,
      y: 0,
      visible: true,
      opacity: 1,
      objects,
    });
  }

  return {
    type: 'map',
    version: '1.10',
    tiledversion: TIED_VERSION,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width: spec.width,
    height: spec.height,
    tilewidth: spec.tileSize,
    tileheight: spec.tileSize,
    infinite: false,
    compressionlevel: -1,
    nextlayerid: nextLayerId,
    nextobjectid: nextObjectId,
    tilesets: tilesetRefs,
    layers,
  };
}

function renderTileLayer(
  source: TileGrid | PlacedTile[],
  spec: MapSpec,
  tilesets: ParsedTileset[],
  firstGids: ReturnType<typeof assignFirstGids>,
): number[] {
  const data = new Array<number>(spec.width * spec.height).fill(0);

  if (isTileGrid(source)) {
    if (source.length !== spec.height) {
      throw new Error(
        `emit: paint grid has ${source.length} rows but map dimensions say height=${spec.height}`,
      );
    }
    for (let y = 0; y < source.length; y++) {
      const row = source[y];
      if (row.length !== spec.width) {
        throw new Error(
          `emit: paint grid row ${y} has ${row.length} cells but map dimensions say width=${spec.width}`,
        );
      }
      for (let x = 0; x < row.length; x++) {
        const name = row[x];
        if (!name || name === '.') continue;
        data[y * spec.width + x] = resolvePaletteName(
          spec.palette,
          firstGids,
          tilesets,
          name,
        );
      }
    }
  } else {
    for (const p of source) {
      const [x, y] = p.at;
      if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
        throw new Error(
          `emit: place at [${x}, ${y}] is out of map bounds [${spec.width} x ${spec.height}]`,
        );
      }
      const entry = spec.palette[p.tile];
      if (!entry) {
        throw new Error(`emit: palette: unknown name "${p.tile}"`);
      }
      const w = entry.multiTile?.w ?? 1;
      const h = entry.multiTile?.h ?? 1;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const tx = x + dx;
          const ty = y + dy;
          if (tx >= spec.width || ty >= spec.height) continue;
          // Multi-tile objects in Tiled typically use contiguous local IDs.
          // For our palette we resolve the anchor tile; multi-tile expansion
          // reuses the anchor for every cell (naive). The anchor palette entry
          // normally points at the top-left of the source sprite; extending
          // to proper multi-tile (different local_id per cell) is a followup.
          data[ty * spec.width + tx] = resolvePaletteName(
            spec.palette,
            firstGids,
            tilesets,
            p.tile,
          );
        }
      }
    }
  }

  return data;
}

function isTileGrid(source: TileGrid | PlacedTile[]): source is TileGrid {
  return Array.isArray(source) && source.length > 0 && Array.isArray(source[0]);
}

function emitObjects(
  markers: ObjectMarker[],
  tileSize: number,
  startId: number,
): { objects: TmjObject[]; nextId: number } {
  let id = startId;
  const objects: TmjObject[] = markers.map((m) => {
    const base: TmjObject = {
      id: id++,
      name: m.name,
      type: m.type,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      visible: true,
      rotation: 0,
    };
    if ('rect' in m) {
      const [x, y, w, h] = m.rect;
      base.x = x * tileSize;
      base.y = y * tileSize;
      base.width = w * tileSize;
      base.height = h * tileSize;
    } else {
      base.x = m.at[0] * tileSize;
      base.y = m.at[1] * tileSize;
    }
    const props = (m as { props?: Record<string, PropertyValue> }).props;
    if (props && Object.keys(props).length > 0) {
      base.properties = mapPropsToTmj(props);
    }
    return base;
  });
  return { objects, nextId: id };
}

function emitEncounters(
  zones: EncounterZone[],
  tileSize: number,
  startId: number,
): { objects: TmjObject[]; nextId: number } {
  let id = startId;
  const objects: TmjObject[] = zones.map((z, idx) => {
    const [x, y, w, h] = z.rect;
    const props: TmjProperty[] = [
      { name: 'species', type: 'string', value: JSON.stringify(z.species) },
      { name: 'level_min', type: 'int', value: z.levelRange[0] },
      { name: 'level_max', type: 'int', value: z.levelRange[1] },
    ];
    return {
      id: id++,
      name: `encounter_${idx}`,
      type: 'Encounter',
      x: x * tileSize,
      y: y * tileSize,
      width: w * tileSize,
      height: h * tileSize,
      visible: true,
      rotation: 0,
      properties: props,
    };
  });
  return { objects, nextId: id };
}

function mapPropsToTmj(props: Record<string, PropertyValue>): TmjProperty[] {
  return Object.entries(props).map(([name, value]) => {
    const type: TmjProperty['type'] =
      typeof value === 'boolean'
        ? 'bool'
        : typeof value === 'number'
          ? Number.isInteger(value)
            ? 'int'
            : 'float'
          : 'string';
    return { name, type, value };
  });
}
