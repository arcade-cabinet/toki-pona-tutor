#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const KNOWN_UPSTREAM_TYPE_NOISE = "@rpgjs/common/src/rooms/WorldMaps.ts";

function pnpmCommand() {
    return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

export function filterKnownTypecheckNoise(output) {
    return output
        .split(/\r?\n/)
        .filter((line) => !line.replaceAll("\\", "/").includes(KNOWN_UPSTREAM_TYPE_NOISE))
        .join("\n")
        .replace(/\n+$/, "");
}

export function hasTypeScriptError(output) {
    return output.split(/\r?\n/).some((line) => /\berror\s+TS\d+:?/.test(line));
}

export function runTypecheck({ project, command = pnpmCommand() } = {}) {
    const args = ["exec", "tsc", "--noEmit"];
    if (project) {
        args.push("-p", project);
    }

    const result = spawnSync(command, args, {
        encoding: "utf8",
        env: process.env,
    });

    if (result.error) {
        if (result.error.code === "ENOENT") {
            console.error(`[typecheck] ${command} was not found on PATH`);
            return 127;
        }
        throw result.error;
    }

    const filtered = filterKnownTypecheckNoise(`${result.stdout ?? ""}${result.stderr ?? ""}`);
    if (filtered.length > 0) {
        process.stderr.write(`${filtered}\n`);
    }

    if (hasTypeScriptError(filtered)) {
        return result.status ?? 1;
    }

    return filtered.trim().length === 0 ? 0 : (result.status ?? 0);
}

function parseArgs(argv) {
    const projectIndex = argv.indexOf("--project");
    return {
        project: projectIndex >= 0 ? argv[projectIndex + 1] : undefined,
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(runTypecheck(parseArgs(process.argv.slice(2))));
}
