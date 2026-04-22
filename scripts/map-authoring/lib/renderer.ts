/**
 * TMJ → PNG renderer.
 *
 * Reads a TMJ file, composites each tile layer onto a canvas using the
 * source tileset PNGs, and (optionally) overlays object-layer markers
 * for review purposes.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The renderer".
 */
import canvasPkg from 'canvas';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import type { ParsedTileset, TmjMap, TmjObject } from './types';
import { tilesetGidSpan } from './palette';

const { createCanvas, loadImage } = canvasPkg;

export interface RenderOptions {
  /** Draw semi-transparent overlays for object-layer markers. Default true. */
  overlay?: boolean;
  /** Draw a light grid overlay for cell alignment review. Default false. */
  grid?: boolean;
}

type CanvasImage = Awaited<ReturnType<typeof loadImage>>;
type Ctx2D = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

/**
 * Render a TMJ map to a PNG (returned as a parsed pngjs PNG).
 *
 * `tilesets` must include every tileset referenced by the map's
 * tilesets[] array, keyed by the same stem the TMJ uses in its
 * tileset.source paths.
 */
export async function renderTmj(
  tmjPath: string,
  tilesets: ParsedTileset[],
  options: RenderOptions = {},
): Promise<PNG> {
  const { overlay = true, grid = false } = options;
  const tmj: TmjMap = JSON.parse(await readFile(tmjPath, 'utf-8'));

  const widthPx = tmj.width * tmj.tilewidth;
  const heightPx = tmj.height * tmj.tileheight;
  const canvas = createCanvas(widthPx, heightPx);
  const ctx = canvas.getContext('2d') as Ctx2D;

  // Preload tileset images + index by firstgid for quick lookup.
  // Atlas tilesets get a single image; collection-of-images tilesets get
  // a map of local_id → image so drawTile can look up per-tile.
  type Loaded = {
    firstgid: number;
    ts: ParsedTileset;
    atlas?: CanvasImage;
    perTile?: Map<number, CanvasImage>;
  };
  const tilesetImages: Loaded[] = [];
  for (const ref of tmj.tilesets) {
    const stem = tsxStemFromSource(ref.source);
    const ts = tilesets.find((t) => tsxStemOf(t) === stem);
    if (!ts) {
      throw new Error(
        `renderer: tileset "${stem}" referenced by TMJ but not loaded`,
      );
    }
    if (ts.isCollection) {
      const perTile = new Map<number, CanvasImage>();
      for (const [idStr, entry] of Object.entries(ts.perTileImages)) {
        if (!entry.absolutePath) continue;
        try {
          perTile.set(parseInt(idStr, 10), await loadImage(entry.absolutePath));
        } catch {
          // Skip unreadable per-tile images; that individual tile just won't draw.
        }
      }
      tilesetImages.push({ firstgid: ref.firstgid, ts, perTile });
    } else {
      const atlas = await loadImage(ts.image.absolutePath);
      tilesetImages.push({ firstgid: ref.firstgid, ts, atlas });
    }
  }

  // Draw tile layers in order (Below / World / Above). The TMJ already has
  // them in the right order because the emitter emitted them that way.
  for (const layer of tmj.layers) {
    if (layer.type !== 'tilelayer') continue;
    for (let y = 0; y < layer.height; y++) {
      for (let x = 0; x < layer.width; x++) {
        const gid = layer.data[y * layer.width + x];
        if (gid === 0) continue;
        const found = findTileset(tilesetImages, gid);
        if (!found) continue;
        const local = gid - found.firstgid;
        const { ts } = found;
        if (found.perTile) {
          // Collection-of-images: each local_id has its own image sized
          // per-tile; draw at the map cell's position, anchored bottom-left
          // (Tiled's convention for image-collection tiles).
          const img = found.perTile.get(local);
          if (!img) continue;
          const dx = x * tmj.tilewidth;
          const dy = y * tmj.tileheight + tmj.tileheight - img.height;
          ctx.drawImage(img, dx, dy);
        } else if (found.atlas) {
          // Atlas: slice out the tile from the source image grid.
          if (ts.columns <= 0) {
            // Defensive: `columns=0` is Tiled's marker for image-collection
            // tilesets; those should go through the perTile path above. If
            // we land here with columns<=0 the tileset is malformed — skip
            // the tile rather than dividing by zero.
            continue;
          }
          const col = local % ts.columns;
          const row = Math.floor(local / ts.columns);
          const sx = ts.margin + col * (ts.tileWidth + ts.spacing);
          const sy = ts.margin + row * (ts.tileHeight + ts.spacing);
          ctx.drawImage(
            found.atlas,
            sx,
            sy,
            ts.tileWidth,
            ts.tileHeight,
            x * tmj.tilewidth,
            y * tmj.tileheight,
            tmj.tilewidth,
            tmj.tileheight,
          );
        }
      }
    }
  }

  if (grid) {
    drawGrid(ctx, widthPx, heightPx, tmj.tilewidth, tmj.tileheight);
  }

  if (overlay) {
    for (const layer of tmj.layers) {
      if (layer.type === 'objectgroup' && layer.name === 'Objects') {
        for (const obj of layer.objects) drawObjectOverlay(ctx, obj);
      } else if (layer.type === 'objectgroup' && layer.name === 'Encounters') {
        for (const obj of layer.objects) drawEncounterOverlay(ctx, obj);
      }
    }
  }

  // Convert canvas → pngjs PNG for pixel-level inspection in tests.
  const buf = canvas.toBuffer('image/png');
  const png = PNG.sync.read(buf);
  return png;
}

function drawGrid(
  ctx: Ctx2D,
  w: number,
  h: number,
  tw: number,
  th: number,
): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += tw) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += th) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

const OBJECT_COLORS: Record<string, string> = {
  SpawnPoint: 'rgba(34, 197, 94, 0.65)',  // green
  Sign: 'rgba(250, 204, 21, 0.65)',        // yellow
  NPC: 'rgba(59, 130, 246, 0.65)',         // blue
  Warp: 'rgba(239, 68, 68, 0.50)',         // red
  Trigger: 'rgba(168, 85, 247, 0.50)',     // purple
};

function drawObjectOverlay(ctx: Ctx2D, obj: TmjObject): void {
  const color = OBJECT_COLORS[obj.type] ?? 'rgba(255, 255, 255, 0.5)';
  ctx.save();
  ctx.fillStyle = color;
  // Point objects have width/height = 0 — draw as a 16x16 marker.
  const w = obj.width || 16;
  const h = obj.height || 16;
  ctx.fillRect(obj.x, obj.y, w, h);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(obj.x + 0.5, obj.y + 0.5, w - 1, h - 1);
  // Label
  ctx.fillStyle = '#000';
  ctx.font = '8px sans-serif';
  const label =
    obj.type === 'Warp'
      ? `→ ${propValue(obj, 'target_map') ?? 'warp'}`
      : obj.name || obj.type;
  ctx.fillText(label, obj.x + 2, obj.y + 9);
  ctx.restore();
}

function drawEncounterOverlay(ctx: Ctx2D, obj: TmjObject): void {
  ctx.save();
  ctx.fillStyle = 'rgba(52, 211, 153, 0.30)';
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  ctx.strokeStyle = 'rgba(5, 95, 70, 0.9)';
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(obj.x + 0.5, obj.y + 0.5, obj.width - 1, obj.height - 1);
  ctx.setLineDash([]);
  ctx.fillStyle = '#064e3b';
  ctx.font = '8px sans-serif';
  ctx.fillText('encounter', obj.x + 2, obj.y + 9);
  ctx.restore();
}

function propValue(obj: TmjObject, name: string): string | undefined {
  const p = obj.properties?.find((pr) => pr.name === name);
  return p ? String(p.value) : undefined;
}

function findTileset(
  idx: Array<{
    firstgid: number;
    ts: ParsedTileset;
    atlas?: CanvasImage;
    perTile?: Map<number, CanvasImage>;
  }>,
  gid: number,
) {
  let best: (typeof idx)[number] | undefined;
  for (const entry of idx) {
    if (entry.firstgid <= gid && (!best || entry.firstgid > best.firstgid)) {
      best = entry;
    }
  }
  if (!best) return undefined;
  const local = gid - best.firstgid;
  if (local >= tilesetGidSpan(best.ts)) return undefined;
  return best;
}

// Tiled TMJ tileset refs store the source as a POSIX-style relative path
// (e.g. "../Tilesets/Tileset_Ground.tsx") regardless of platform. Use
// posix.basename to handle that consistently on Windows too.
import { posix, win32 } from 'node:path';
function tsxStemFromSource(source: string): string {
  // Normalize either separator; posix.basename over a string with either
  // separator will still work for most Tiled outputs, but we explicitly
  // try win32 first so a path like "C:\\foo\\Tileset_X.tsx" resolves.
  const withPosix = source.replace(/\\/g, '/');
  return posix.basename(withPosix, '.tsx');
}

function tsxStemOf(ts: ParsedTileset): string {
  return tsxStemFromSource(ts.absolutePath);
}

void win32;
