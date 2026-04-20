/**
 * TmjMap → TMX (Tiled XML) serializer.
 *
 * RPG.js v5's tiledMapFolderPlugin reads .tmx from src/tiled/. The canonical
 * build output is the .tmj under public/assets/maps/ (human-editable, diffable
 * JSON). This emitter produces the matching .tmx so runtime and authoring
 * stay in lockstep.
 *
 * Contract: round-trips width/height/tilewidth/tileheight, every layer's
 * CSV data in row-major order, every Objects/Encounters object with its
 * id/name/type/rect and typed properties. What it does NOT emit:
 * compressionlevel, empty object layers, non-orthogonal orientations.
 */
import type { TmjMap, TmjTileLayer, TmjObjectLayer, TmjProperty } from './types';

function escapeXml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function emitProperties(props: TmjProperty[] | undefined, indent: string): string {
    if (!props || props.length === 0) return '';
    const lines = [`${indent}<properties>`];
    for (const p of props) {
        const typeAttr = p.type === 'string' ? '' : ` type="${p.type}"`;
        lines.push(
            `${indent}  <property name="${escapeXml(p.name)}"${typeAttr} value="${escapeXml(String(p.value))}"/>`,
        );
    }
    lines.push(`${indent}</properties>`);
    return lines.join('\n') + '\n';
}

function emitTileLayer(layer: TmjTileLayer): string {
    const rows: string[] = [];
    for (let y = 0; y < layer.height; y++) {
        const row: number[] = [];
        for (let x = 0; x < layer.width; x++) {
            row.push(layer.data[y * layer.width + x] ?? 0);
        }
        rows.push(row.join(','));
    }
    const csv = rows.join(',\n');
    // Emit visible (0/1) and opacity so round-trips preserve hidden/translucent
    // layers rather than silently exposing them (CR #3107839123).
    return [
        ` <layer id="${layer.id}" name="${escapeXml(layer.name)}" width="${layer.width}" height="${layer.height}" visible="${layer.visible ? 1 : 0}" opacity="${layer.opacity}">`,
        `  <data encoding="csv">`,
        csv,
        `  </data>`,
        ` </layer>`,
    ].join('\n');
}

function emitObjectLayer(layer: TmjObjectLayer): string {
    if (layer.objects.length === 0) return '';
    const lines: string[] = [];
    // Emit visible + opacity so object groups round-trip correctly.
    lines.push(
        ` <objectgroup id="${layer.id}" name="${escapeXml(layer.name)}" visible="${layer.visible ? 1 : 0}" opacity="${layer.opacity}">`,
    );
    for (const o of layer.objects) {
        // Emit visible + rotation so object metadata round-trips correctly.
        const opener = `  <object id="${o.id}" name="${escapeXml(o.name)}" type="${escapeXml(o.type)}" x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" visible="${o.visible ? 1 : 0}" rotation="${o.rotation}"`;
        if (!o.properties || o.properties.length === 0) {
            lines.push(`${opener}/>`);
        } else {
            lines.push(`${opener}>`);
            lines.push(emitProperties(o.properties, '   ').trimEnd());
            lines.push(`  </object>`);
        }
    }
    lines.push(` </objectgroup>`);
    return lines.join('\n');
}

export function emitTmx(tmj: TmjMap): string {
    const parts: string[] = [];
    parts.push('<?xml version="1.0" encoding="UTF-8"?>');
    parts.push(
        `<map version="${tmj.version}" tiledversion="${tmj.tiledversion}" orientation="${tmj.orientation}" renderorder="${tmj.renderorder}"\n     width="${tmj.width}" height="${tmj.height}" tilewidth="${tmj.tilewidth}" tileheight="${tmj.tileheight}" infinite="${tmj.infinite ? 1 : 0}"\n     nextlayerid="${tmj.nextlayerid}" nextobjectid="${tmj.nextobjectid}">`,
    );
    for (const ts of tmj.tilesets) {
        parts.push(` <tileset firstgid="${ts.firstgid}" source="${escapeXml(ts.source)}"/>`);
    }
    for (const layer of tmj.layers) {
        if (layer.type === 'tilelayer') {
            parts.push(emitTileLayer(layer));
        } else {
            const rendered = emitObjectLayer(layer);
            if (rendered) parts.push(rendered);
        }
    }
    parts.push('</map>');
    return parts.join('\n') + '\n';
}
