/**
 * Tiled `.tsx` tileset parser.
 *
 * Reads Fan-tasy-style XML tileset files and extracts the subset of fields
 * the toolchain needs: dimensions, image path, per-tile custom properties,
 * and per-tile animations.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The TMJ emitter" and "Tests".
 */
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { imageSize } from 'image-size';
import type { ParsedTileset, PropertyValue, AnimationFrame } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  parseAttributeValue: false, // we cast ourselves for consistency
  // fast-xml-parser collapses single children to objects; coerce to arrays
  // for element types that can repeat.
  isArray: (name) =>
    ['tile', 'property', 'frame'].includes(name),
});

export async function parseTsx(path: string): Promise<ParsedTileset> {
  if (!existsSync(path)) {
    throw new Error(`TSX not found: ${path} (ENOENT)`);
  }
  const xml = await readFile(path, 'utf-8');
  if (!xml.trimStart().startsWith('<?xml') && !xml.includes('<tileset')) {
    throw new Error(`Not a TSX file: ${path}`);
  }
  const parsed = parser.parse(xml);
  const ts = parsed.tileset;
  if (!ts) {
    throw new Error(`TSX has no <tileset> root: ${path}`);
  }

  const tileWidth = parseInt(ts.tilewidth, 10);
  const tileHeight = parseInt(ts.tileheight, 10);
  const tileCount = parseInt(ts.tilecount, 10);
  const columns = parseInt(ts.columns, 10);
  const spacing = ts.spacing != null ? parseInt(ts.spacing, 10) : 0;
  const margin = ts.margin != null ? parseInt(ts.margin, 10) : 0;
  const name = ts.name ?? '';

  if (!tileWidth || !tileHeight || !tileCount) {
    throw new Error(
      `TSX missing required attrs (tilewidth/tileheight/tilecount): ${path}`,
    );
  }

  // Two flavors of tileset:
  //   (a) Single-image atlas: <tileset><image source=... /></tileset>
  //   (b) Image collection: <tileset columns="0">, each <tile> has its own <image>.
  // We parse both and expose a uniform ParsedTileset. For (b), the top-level
  // image.* fields describe the "first" tile's image for compatibility; the
  // renderer has a separate code path that uses per-tile images.
  const imageEl = ts.image;
  const isCollection = !imageEl || !imageEl.source;

  let imageSrc = '';
  let imageAbs = '';
  let imageWidth = 0;
  let imageHeight = 0;

  if (!isCollection) {
    imageSrc = imageEl.source;
    imageAbs = resolve(dirname(path), imageSrc);
    imageWidth = imageEl.width != null ? parseInt(imageEl.width, 10) : 0;
    imageHeight = imageEl.height != null ? parseInt(imageEl.height, 10) : 0;
    if ((!imageWidth || !imageHeight) && existsSync(imageAbs)) {
      try {
        const buf = await readFile(imageAbs);
        const dims = imageSize(new Uint8Array(buf));
        imageWidth = dims.width ?? 0;
        imageHeight = dims.height ?? 0;
      } catch (err) {
        // Unsupported/corrupt image — leave dimensions at 0 so callers can
        // tell the tile is unusable. Fan-tasy ships only PNGs so this should
        // never fire in practice; the guard keeps the parser fault-tolerant.
        console.warn(
          `[parser] could not read image dimensions for ${imageAbs}: ${(err as Error).message}`,
        );
      }
    }
  }

  const properties: Record<number, Record<string, PropertyValue>> = {};
  const animations: Record<number, AnimationFrame[]> = {};
  const perTileImages: Record<number, { source: string; absolutePath: string; width: number; height: number }> = {};

  const tiles = Array.isArray(ts.tile) ? ts.tile : ts.tile ? [ts.tile] : [];
  for (const tile of tiles) {
    const id = parseInt(tile.id, 10);
    if (Number.isNaN(id)) continue;

    // Per-tile image (collection-of-images tileset).
    if (tile.image?.source) {
      const src: string = tile.image.source;
      const abs = resolve(dirname(path), src);
      let w = tile.image.width != null ? parseInt(tile.image.width, 10) : 0;
      let h = tile.image.height != null ? parseInt(tile.image.height, 10) : 0;
      if ((!w || !h) && existsSync(abs)) {
        try {
          const buf = await readFile(abs);
          const dims = imageSize(new Uint8Array(buf));
          w = dims.width ?? 0;
          h = dims.height ?? 0;
        } catch (err) {
          console.warn(
            `[parser] could not read per-tile image ${abs}: ${(err as Error).message}`,
          );
        }
      }
      perTileImages[id] = { source: src, absolutePath: abs, width: w, height: h };
      // For compatibility, seed the tileset-level image fields from the
      // first per-tile image encountered.
      if (!imageSrc) {
        imageSrc = src;
        imageAbs = abs;
        imageWidth = w;
        imageHeight = h;
      }
    }

    const propsNode = tile.properties;
    if (propsNode) {
      const propList = Array.isArray(propsNode.property)
        ? propsNode.property
        : propsNode.property
          ? [propsNode.property]
          : [];
      const pbag: Record<string, PropertyValue> = {};
      for (const p of propList) {
        const pname: string = p.name;
        const ptype: string = p.type ?? 'string';
        const praw: string = p.value ?? '';
        pbag[pname] = castPropertyValue(praw, ptype);
      }
      if (Object.keys(pbag).length > 0) {
        properties[id] = pbag;
      }
    }

    const animNode = tile.animation;
    if (animNode) {
      const frames = Array.isArray(animNode.frame)
        ? animNode.frame
        : animNode.frame
          ? [animNode.frame]
          : [];
      if (frames.length > 0) {
        animations[id] = frames.map((f: { tileid: string; duration: string }) => ({
          tileid: parseInt(f.tileid, 10),
          duration: parseInt(f.duration, 10),
        }));
      }
    }
  }

  return {
    source: path,
    absolutePath: path,
    name,
    tileWidth,
    tileHeight,
    tileCount,
    columns,
    spacing,
    margin,
    image: {
      source: imageSrc,
      absolutePath: imageAbs,
      width: imageWidth,
      height: imageHeight,
    },
    properties,
    animations,
    isCollection,
    perTileImages,
  };
}

function castPropertyValue(raw: string, type: string): PropertyValue {
  switch (type) {
    case 'int':
      return parseInt(raw, 10);
    case 'float':
      return parseFloat(raw);
    case 'bool':
      return raw === 'true';
    default:
      return raw;
  }
}

void statSync;
