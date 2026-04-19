/**
 * pnpm author:validate <map-id>
 * Runs the spec through the validator; prints diagnostics; exits 1 on error.
 */
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { validateSpec, loadTilesetsForSpec } from '../lib/index';
import type { MapSpec } from '../lib/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

function assertSafeMapId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    console.error(
      `invalid map id "${id}" — only alphanumerics, underscore, and dash are allowed`,
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const [, , mapId] = process.argv;
  if (!mapId) {
    console.error('usage: pnpm author:validate <map-id>');
    process.exit(1);
  }
  assertSafeMapId(mapId);

  const worktreeRoot = resolve(__dirname, '..', '..', '..');
  const specPath = join(worktreeRoot, 'scripts', 'map-authoring', 'specs', `${mapId}.ts`);
  const mod = (await import(specPath)) as { default?: MapSpec };
  if (!mod.default) {
    console.error(`spec "${specPath}" has no default export`);
    process.exit(1);
  }
  const spec = mod.default;
  const tilesets = await loadTilesetsForSpec(spec, worktreeRoot);

  // Species lookup — read src/content/spine/species/<id>.json existence.
  const speciesDir = join(worktreeRoot, 'src', 'content', 'spine', 'species');
  const speciesLookup = (id: string): unknown | null => {
    const f = join(speciesDir, `${id}.json`);
    return existsSync(f) ? { id } : null;
  };

  const report = await validateSpec(spec, tilesets, speciesLookup);

  if (report.issues.length === 0) {
    console.log(`✓ ${mapId} ok`);
    return;
  }

  for (const issue of report.issues) {
    const tag = issue.severity === 'error' ? '✗' : '!';
    const loc = issue.at
      ? ` @ ${Object.entries(issue.at).map(([k, v]) => `${k}=${v}`).join(' ')}`
      : '';
    console.error(`${tag} [${issue.code}] ${issue.message}${loc}`);
  }
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
