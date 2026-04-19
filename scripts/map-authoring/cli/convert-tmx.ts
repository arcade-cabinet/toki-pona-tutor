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
  const out = outArg
    ? resolve(outArg)
    : source.replace(/\.tmx$/, '.tmj');

  const code = await run('tiled', ['--export-map', 'json', source, out]);
  if (code !== 0) {
    console.error('tiled CLI exited non-zero');
    process.exit(code ?? 1);
  }
  console.log(`✓ ${basename(source)} → ${out}`);
}

function run(cmd: string, args: string[]): Promise<number | null> {
  return new Promise((resolveProm) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => resolveProm(code));
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
