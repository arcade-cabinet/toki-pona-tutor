import { describe, expect, it } from "vitest";

const workflowShell = (await import("../../scripts/check-workflow-shell.mjs")) as {
    extractRunBlocks(source: string): Array<{ run: string; shell?: string }>;
    shellcheckDialectForShell(shell?: string): "bash" | "sh" | "dash" | "ksh" | null;
    workflowFiles(dir?: string): string[];
};

describe("workflow shellcheck extractor", () => {
    it("extracts inline and block run scripts while sanitizing GitHub expressions", () => {
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
            { run: "pnpm validate", shell: undefined },
            { run: 'set -euo pipefail\necho "EXPR"', shell: undefined },
            { run: "echo folded echo still-shell", shell: undefined },
        ]);
    });

    it("preserves per-step shells so shellcheck can use the matching dialect", () => {
        const blocks = workflowShell.extractRunBlocks(`
name: sample
jobs:
  test:
    steps:
      - shell: sh
        run: echo posix
      - shell: pwsh
        run: Write-Output "skip"
`);

        expect(blocks).toEqual([
            { run: "echo posix", shell: "sh" },
            { run: 'Write-Output "skip"', shell: "pwsh" },
        ]);
        expect(workflowShell.shellcheckDialectForShell("sh")).toBe("sh");
        expect(workflowShell.shellcheckDialectForShell("bash --noprofile --norc {0}")).toBe("bash");
        expect(workflowShell.shellcheckDialectForShell("pwsh")).toBeNull();
    });

    it("lists workflow files deterministically", () => {
        expect(workflowShell.workflowFiles().map((file) => file.split("/").at(-1))).toEqual([
            "automerge.yml",
            "cd.yml",
            "ci.yml",
            "release.yml",
        ]);
    });
});
