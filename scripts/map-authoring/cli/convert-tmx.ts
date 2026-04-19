/**
 * pnpm author:convert-tmx <source.tmx> [<out.tmj>]
 *
 * Thin wrapper around the Tiled CLI that converts a .tmx XML file to a
 * .tmj JSON file, used at fixture-init time to produce per-pack goldens.
 * Not used for runtime maps — those are authored from scratch via MapSpec.
 *
 * See docs/build-time/MAP_AUTHORING.md § "Converter step".
 */
import { spawn } from 'node:child_process';
import { resolve, basename } from 'node:path';

async function main(): Promise<void> {
  const [, , sourceArg, outArg] = process.argv;
  if (!sourceArg) {
    console.error('usage: pnpm author:convert-tmx <source.tmx> [<out.tmj>]');
    process.exit(1);
  }
  const source = resolve(sourceArg);

  // Derive output path safely: never let `out` equal `source` (which would
  // silently overwrite the input if the source doesn't end in .tmx).
  let out: string;
  if (outArg) {
    out = resolve(outArg);
  } else if (source.toLowerCase().endsWith('.tmx')) {
    out = source.replace(/\.tmx$/i, '.tmj');
  } else {
    console.error(
      `source "${source}" does not end in .tmx — pass an explicit <out.tmj> path`,
    );
    process.exit(1);
  }
  if (out === source) {
    console.error(`refusing to overwrite source file: ${source}`);
    process.exit(1);
  }

  const code = await run('tiled', ['--export-map', 'json', source, out]);
  if (code === null) {
    console.error(
      'could not execute `tiled` — is Tiled installed? `brew install --cask tiled`',
    );
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`tiled CLI exited with code ${code}`);
    process.exit(code);
  }
  console.log(`✓ ${basename(source)} → ${out}`);
}

function run(cmd: string, args: string[]): Promise<number | null> {
  return new Promise((resolveProm) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    // Listen for both exit and error; without the error handler the promise
    // would hang forever on ENOENT (e.g. when `tiled` isn't on PATH).
    let settled = false;
    p.on('exit', (code) => {
      if (!settled) {
        settled = true;
        resolveProm(code);
      }
    });
    p.on('error', () => {
      if (!settled) {
        settled = true;
        resolveProm(null);
      }
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
