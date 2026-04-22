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
        blocks.push(value.run.replace(/\n+$/, ""));
    }

    for (const [key, child] of Object.entries(value)) {
        if (key !== "run") collectRunBlocks(child, blocks);
    }

    return blocks;
}

export function extractRunBlocks(source) {
    const workflow = parse(source, { prettyErrors: true });
    return collectRunBlocks(workflow).map(sanitizeGithubExpressions);
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
    const shellFiles = [];

    try {
        for (const workflowPath of files) {
            const source = readFileSync(workflowPath, "utf8");
            const blocks = extractRunBlocks(source);
            const base = workflowPath.slice(dir.length + 1).replace(/[^a-zA-Z0-9_.-]/g, "_");

            blocks.forEach((block, index) => {
                const path = join(tempRoot, `${base}.${index}.sh`);
                writeFileSync(path, `#!/usr/bin/env bash\n${block}\n`);
                shellFiles.push(path);
            });
        }

        if (shellFiles.length === 0) {
            console.log("[workflow-shellcheck] no run blocks found");
            return 0;
        }

        const result = spawnSync(command, ["-s", "bash", ...shellFiles], {
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

        console.log(
            `[workflow-shellcheck] checked ${shellFiles.length} run block(s) from ${files.length} workflow file(s)`,
        );
        return 0;
    } finally {
        rmSync(tempRoot, { recursive: true, force: true });
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(checkWorkflowShell());
}
