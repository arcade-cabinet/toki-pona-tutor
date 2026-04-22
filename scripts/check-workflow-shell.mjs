#!/usr/bin/env node
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

const repoRoot = process.cwd();
const workflowsDir = resolve(repoRoot, ".github/workflows");

function sanitizeGithubExpressions(script) {
    return script.replace(/\$\{\{[\s\S]*?\}\}/g, "EXPR");
}

function collectRunBlocks(value, blocks = []) {
    if (Array.isArray(value)) {
        value.forEach((entry) => collectRunBlocks(entry, blocks));
        return blocks;
    }

    if (!value || typeof value !== "object") return blocks;

    if (typeof value.run === "string") {
        blocks.push({
            run: value.run.replace(/\n+$/, ""),
            shell: typeof value.shell === "string" ? value.shell : undefined,
        });
    }

    for (const [key, child] of Object.entries(value)) {
        if (key !== "run" && key !== "shell") collectRunBlocks(child, blocks);
    }

    return blocks;
}

export function extractRunBlocks(source) {
    const workflow = parse(source, { prettyErrors: true });
    return collectRunBlocks(workflow).map((block) => ({
        ...block,
        run: sanitizeGithubExpressions(block.run),
    }));
}

export function shellcheckDialectForShell(shell) {
    if (!shell) return "bash";

    const firstToken = shell.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    const executable = firstToken.split(/[\\/]/).pop();
    if (executable === "bash") return "bash";
    if (executable === "sh") return "sh";
    if (executable === "dash") return "dash";
    if (executable === "ksh") return "ksh";
    return null;
}

export function workflowFiles(dir = workflowsDir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
        .sort()
        .map((name) => resolve(dir, name));
}

export function checkWorkflowShell({ dir = workflowsDir, command = "shellcheck" } = {}) {
    const files = workflowFiles(dir);
    if (files.length === 0) {
        console.log("[workflow-shellcheck] no workflow files found");
        return 0;
    }

    const tempRoot = mkdtempSync(join(tmpdir(), "poki-workflow-shell-"));
    const shellFilesByDialect = new Map();
    const skippedShells = new Set();

    try {
        for (const workflowPath of files) {
            const source = readFileSync(workflowPath, "utf8");
            const blocks = extractRunBlocks(source);
            const base = workflowPath.slice(dir.length + 1).replace(/[^a-zA-Z0-9_.-]/g, "_");

            blocks.forEach((block, index) => {
                const dialect = shellcheckDialectForShell(block.shell);
                if (!dialect) {
                    skippedShells.add(block.shell);
                    return;
                }
                const path = join(tempRoot, `${base}.${index}.sh`);
                writeFileSync(path, `#!/usr/bin/env ${dialect}\n${block.run}\n`);
                const shellFiles = shellFilesByDialect.get(dialect) ?? [];
                shellFiles.push(path);
                shellFilesByDialect.set(dialect, shellFiles);
            });
        }

        const checkedCount = Array.from(shellFilesByDialect.values()).reduce(
            (count, shellFiles) => count + shellFiles.length,
            0,
        );

        if (checkedCount === 0) {
            for (const shell of skippedShells) {
                console.log(`[workflow-shellcheck] skipped unsupported shell '${shell}'`);
            }
            console.log("[workflow-shellcheck] no shellcheck-supported run blocks found");
            return 0;
        }

        for (const [dialect, shellFiles] of shellFilesByDialect) {
            const result = spawnSync(command, ["-s", dialect, ...shellFiles], {
                stdio: "inherit",
            });

            if (result.error) {
                if (result.error.code === "ENOENT") {
                    console.error(
                        "[workflow-shellcheck] shellcheck is required but was not found on PATH",
                    );
                    return 127;
                }
                throw result.error;
            }

            if (result.status !== 0) {
                return result.status ?? 1;
            }
        }

        for (const shell of skippedShells) {
            console.log(`[workflow-shellcheck] skipped unsupported shell '${shell}'`);
        }
        console.log(
            `[workflow-shellcheck] checked ${checkedCount} run block(s) from ${files.length} workflow file(s)`,
        );
        return 0;
    } finally {
        rmSync(tempRoot, { recursive: true, force: true });
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(checkWorkflowShell());
}
