import { describe, expect, it } from 'vitest';

const workflowShell = await import('../../scripts/check-workflow-shell.mjs') as {
    extractRunBlocks(source: string): string[];
    workflowFiles(dir?: string): string[];
};

describe('workflow shellcheck extractor', () => {
    it('extracts inline and block run scripts while sanitizing GitHub expressions', () => {
        const blocks = workflowShell.extractRunBlocks(`
name: sample
jobs:
  test:
    steps:
      - run: pnpm validate
      - name: block
        run: |
          set -euo pipefail
          echo "\${{ github.repository }}"
      - run: >
          echo folded
          echo still-shell
`);

        expect(blocks).toEqual([
            'pnpm validate',
            'set -euo pipefail\necho "EXPR"',
            'echo folded\necho still-shell',
        ]);
    });

    it('lists workflow files deterministically', () => {
        expect(workflowShell.workflowFiles().map((file) => file.split('/').at(-1))).toEqual([
            'cd.yml',
            'ci.yml',
            'commitlint.yml',
            'dependabot-automerge.yml',
            'release.yml',
        ]);
    });
});
