#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const TYPE_PATTERN = [
    "feat",
    "fix",
    "docs",
    "style",
    "refactor",
    "perf",
    "test",
    "build",
    "ci",
    "chore",
    "revert",
].join("|");

const CONVENTIONAL_HEADER = new RegExp(
    `^(?:revert: )?(?:${TYPE_PATTERN})(?:\\([a-z0-9._/-]+\\))?!?: .+`,
);

export function conventionalHeaderError(message) {
    const header = String(message ?? "").trim();
    if (!header) return "message is empty";
    if (CONVENTIONAL_HEADER.test(header)) return null;
    return `expected Conventional Commit header, got: ${header}`;
}

export function conventionalHeaderFailures(messages) {
    return messages
        .map((message) => ({ message, error: conventionalHeaderError(message) }))
        .filter((entry) => entry.error);
}

function gitCommitSubjects(from, to) {
    const result = spawnSync("git", ["log", "--format=%s", `${from}..${to}`], {
        encoding: "utf8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(result.stderr.trim() || `git log failed with status ${result.status}`);
    }

    return result.stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

export function runConventionalCommitCheck({
    title = process.env.PR_TITLE,
    from = process.env.PR_BASE_SHA,
    to = process.env.PR_HEAD_SHA,
} = {}) {
    const failures = [];

    const titleError = conventionalHeaderError(title);
    if (titleError) failures.push({ kind: "PR title", message: title ?? "", error: titleError });

    if (!from || !to) {
        failures.push({
            kind: "commit range",
            message: `${from ?? "<missing>"}..${to ?? "<missing>"}`,
            error: "PR_BASE_SHA and PR_HEAD_SHA are required",
        });
    } else {
        const commits = gitCommitSubjects(from, to);
        for (const failure of conventionalHeaderFailures(commits)) {
            failures.push({ kind: "commit", ...failure });
        }
    }

    return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const failures = runConventionalCommitCheck();
        if (failures.length > 0) {
            console.error("[conventional-commits] failed");
            for (const failure of failures) {
                console.error(`- ${failure.kind}: ${failure.error}`);
            }
            process.exit(1);
        }
        console.log("[conventional-commits] PR title and commit subjects are conventional");
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
