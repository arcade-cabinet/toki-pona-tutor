#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function pnpmCommand() {
    return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function gradleCommand() {
    return process.platform === "win32" ? "gradlew.bat" : "./gradlew";
}

export function runCommand(command, args, options = {}) {
    const result = spawnSync(command, args, {
        stdio: "inherit",
        env: process.env,
        ...options,
    });

    if (result.error) {
        if (result.error.code === "ENOENT") {
            console.error(`[android-build-debug] ${command} was not found on PATH`);
            return 127;
        }
        throw result.error;
    }

    return result.status ?? 0;
}

export function runAndroidBuildDebug({ root = process.cwd(), pnpm = pnpmCommand() } = {}) {
    const buildStatus = runCommand(pnpm, ["build"], {
        env: { ...process.env, CAPACITOR: "true" },
        cwd: root,
    });
    if (buildStatus !== 0) return buildStatus;

    const androidDir = join(root, "android");
    if (!existsSync(androidDir)) {
        const addStatus = runCommand(pnpm, ["exec", "cap", "add", "android"], { cwd: root });
        if (addStatus !== 0) return addStatus;
    }

    const syncStatus = runCommand(pnpm, ["exec", "cap", "sync", "android"], { cwd: root });
    if (syncStatus !== 0) return syncStatus;

    return runCommand(gradleCommand(), ["assembleDebug"], { cwd: androidDir });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(runAndroidBuildDebug());
}
