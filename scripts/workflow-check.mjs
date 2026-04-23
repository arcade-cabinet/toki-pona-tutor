#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { checkWorkflowShell, workflowFiles } from "./check-workflow-shell.mjs";

export function runActionlint({ command = "actionlint", files = workflowFiles() } = {}) {
    if (files.length === 0) {
        console.log("[workflow-check] no workflow files found for actionlint");
        return 0;
    }

    const result = spawnSync(command, files, { stdio: "inherit" });
    if (result.error) {
        if (result.error.code === "ENOENT") {
            console.error("[workflow-check] actionlint is required but was not found on PATH");
            return 127;
        }
        throw result.error;
    }

    return result.status ?? 0;
}

export function runWorkflowCheck() {
    const actionlintStatus = runActionlint();
    if (actionlintStatus !== 0) return actionlintStatus;
    return checkWorkflowShell();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(runWorkflowCheck());
}
