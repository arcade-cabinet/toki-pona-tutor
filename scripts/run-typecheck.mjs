#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const KNOWN_UPSTREAM_TYPE_NOISE = "@rpgjs/common/src/rooms/WorldMaps.ts";

function tscCommand() {
    return resolve("node_modules/.bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
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

export function runTypecheck({ project, command = tscCommand() } = {}) {
    const args = ["--noEmit"];
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

export function runAllTypechecks({ command = tscCommand() } = {}) {
    const srcStatus = runTypecheck({ command });
    if (srcStatus !== 0) return srcStatus;
    return runTypecheck({ project: "tsconfig.build-time.json", command });
}

function parseArgs(argv) {
    const projectIndex = argv.indexOf("--project");
    return {
        all: argv.includes("--all"),
        project: projectIndex >= 0 ? argv[projectIndex + 1] : undefined,
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const options = parseArgs(process.argv.slice(2));
    process.exit(options.all ? runAllTypechecks(options) : runTypecheck(options));
}
