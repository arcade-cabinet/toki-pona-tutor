#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function maestroFlowFiles(dir = resolve(process.cwd(), ".maestro")) {
    if (!existsSync(dir)) return [];

    const files = [];
    const visit = (current) => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const path = join(current, entry.name);
            if (entry.isDirectory()) {
                visit(path);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith(".yaml")) {
                files.push(path);
            }
        }
    };

    visit(dir);
    return files.sort();
}

export function checkMaestroFlows({ command = "maestro", files = maestroFlowFiles() } = {}) {
    if (files.length === 0) {
        console.log("[maestro-check] no .maestro/*.yaml flows found");
        return 0;
    }

    for (const file of files) {
        console.log(file);
        const result = spawnSync(command, ["check-syntax", file], { stdio: "inherit" });
        if (result.error) {
            if (result.error.code === "ENOENT") {
                console.error("[maestro-check] maestro is required but was not found on PATH");
                return 127;
            }
            throw result.error;
        }
        if (result.status !== 0) {
            return result.status ?? 1;
        }
    }

    return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(checkMaestroFlows());
}
