#!/usr/bin/env node
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const workflowsDir = resolve(repoRoot, '.github/workflows');

function countIndent(line) {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function trimBlockIndent(lines) {
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map(countIndent);
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
  return lines
    .map((line) => line.trim().length > 0 ? line.slice(minIndent) : '')
    .join('\n')
    .replace(/\n+$/, '');
}

function sanitizeGithubExpressions(script) {
  return script.replace(/\$\{\{[\s\S]*?\}\}/g, 'EXPR');
}

export function extractRunBlocks(source) {
  const blocks = [];
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(\s*)(?:-\s*)?run:\s*(.*)$/);
    if (!match) continue;

    const baseIndent = match[1].length;
    const value = match[2].trim();

    if (/^[>|][+-]?$/.test(value)) {
      const blockLines = [];
      let cursor = i + 1;
      while (cursor < lines.length) {
        const next = lines[cursor];
        if (next.trim() !== '' && countIndent(next) <= baseIndent) break;
        blockLines.push(next);
        cursor += 1;
      }
      blocks.push(trimBlockIndent(blockLines));
      i = cursor - 1;
      continue;
    }

    if (value.length > 0) {
      blocks.push(value);
    }
  }

  return blocks.map(sanitizeGithubExpressions);
}

export function workflowFiles(dir = workflowsDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .sort()
    .map((name) => resolve(dir, name));
}

export function checkWorkflowShell({
  dir = workflowsDir,
  command = 'shellcheck',
} = {}) {
  const files = workflowFiles(dir);
  if (files.length === 0) {
    console.log('[workflow-shellcheck] no workflow files found');
    return 0;
  }

  const tempRoot = mkdtempSync(join(tmpdir(), 'poki-workflow-shell-'));
  const shellFiles = [];

  try {
    for (const workflowPath of files) {
      const source = readFileSync(workflowPath, 'utf8');
      const blocks = extractRunBlocks(source);
      const base = workflowPath.slice(dir.length + 1).replace(/[^a-zA-Z0-9_.-]/g, '_');

      blocks.forEach((block, index) => {
        const path = join(tempRoot, `${base}.${index}.sh`);
        writeFileSync(path, `#!/usr/bin/env bash\n${block}\n`);
        shellFiles.push(path);
      });
    }

    if (shellFiles.length === 0) {
      console.log('[workflow-shellcheck] no run blocks found');
      return 0;
    }

    const result = spawnSync(command, ['-s', 'bash', ...shellFiles], {
      stdio: 'inherit',
    });

    if (result.error) {
      if (result.error.code === 'ENOENT') {
        console.error('[workflow-shellcheck] shellcheck is required but was not found on PATH');
        return 127;
      }
      throw result.error;
    }

    if (result.status !== 0) {
      return result.status ?? 1;
    }

    console.log(`[workflow-shellcheck] checked ${shellFiles.length} run block(s) from ${files.length} workflow file(s)`);
    return 0;
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(checkWorkflowShell());
}
