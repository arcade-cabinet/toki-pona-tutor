#!/usr/bin/env node
import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
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

function replaceOrThrow(source, pattern, replacement, label) {
    if (!pattern.test(source)) {
        throw new Error(`[android-build-debug] could not find ${label}`);
    }
    return source.replace(pattern, replacement);
}

function xmlEscape(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function findFiles(root, filename) {
    if (!existsSync(root)) return [];
    const entries = readdirSync(root, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const path = join(root, entry.name);
        if (entry.isDirectory()) return findFiles(path, filename);
        return entry.isFile() && entry.name === filename ? [path] : [];
    });
}

function pruneEmptyDirs(from, stopAt) {
    let current = from;
    while (current.startsWith(stopAt) && current !== stopAt) {
        try {
            if (readdirSync(current).length > 0) return;
            rmSync(current, { recursive: false });
            current = dirname(current);
        } catch {
            return;
        }
    }
}

export function readCapacitorIdentity(root = process.cwd()) {
    const configPath = join(root, "capacitor.config.ts");
    const config = readFileSync(configPath, "utf8");
    const appId = config.match(/\bappId:\s*['"]([^'"]+)['"]/)?.[1];
    const appName = config.match(/\bappName:\s*['"]([^'"]+)['"]/)?.[1];

    if (!appId) {
        throw new Error("[android-build-debug] capacitor.config.ts is missing appId");
    }

    return {
        appId,
        appName: appName ?? appId,
    };
}

export function syncAndroidAppIdentity({ root = process.cwd(), androidDir = join(root, "android") } = {}) {
    if (!existsSync(androidDir)) return;

    const { appId, appName } = readCapacitorIdentity(root);
    const buildGradlePath = join(androidDir, "app", "build.gradle");
    const stringsPath = join(androidDir, "app", "src", "main", "res", "values", "strings.xml");
    const javaRoot = join(androidDir, "app", "src", "main", "java");

    if (existsSync(buildGradlePath)) {
        const original = readFileSync(buildGradlePath, "utf8");
        const next = replaceOrThrow(
            replaceOrThrow(
                original,
                /namespace\s*=\s*["'][^"']+["']/,
                `namespace = "${appId}"`,
                "Android namespace in android/app/build.gradle",
            ),
            /applicationId\s+["'][^"']+["']/,
            `applicationId "${appId}"`,
            "Android applicationId in android/app/build.gradle",
        );
        if (next !== original) writeFileSync(buildGradlePath, next);
    }

    if (existsSync(stringsPath)) {
        const escapedName = xmlEscape(appName);
        const escapedId = xmlEscape(appId);
        const original = readFileSync(stringsPath, "utf8");
        const next = original
            .replace(/<string name="app_name">[^<]*<\/string>/, `<string name="app_name">${escapedName}</string>`)
            .replace(
                /<string name="title_activity_main">[^<]*<\/string>/,
                `<string name="title_activity_main">${escapedName}</string>`,
            )
            .replace(
                /<string name="package_name">[^<]*<\/string>/,
                `<string name="package_name">${escapedId}</string>`,
            )
            .replace(
                /<string name="custom_url_scheme">[^<]*<\/string>/,
                `<string name="custom_url_scheme">${escapedId}</string>`,
            );
        if (next !== original) writeFileSync(stringsPath, next);
    }

    const activityFiles = findFiles(javaRoot, "MainActivity.java");
    if (activityFiles.length === 0) return;

    const desiredActivityPath = join(javaRoot, ...appId.split("."), "MainActivity.java");
    const sourceActivityPath = existsSync(desiredActivityPath) ? desiredActivityPath : activityFiles[0];
    let activitySource = readFileSync(sourceActivityPath, "utf8");
    activitySource = replaceOrThrow(
        activitySource,
        /^package\s+[^;]+;/m,
        `package ${appId};`,
        "MainActivity package declaration",
    );

    mkdirSync(dirname(desiredActivityPath), { recursive: true });
    writeFileSync(desiredActivityPath, activitySource);

    for (const activityFile of activityFiles) {
        if (activityFile === desiredActivityPath) continue;
        const relativePath = relative(javaRoot, activityFile);
        if (statSync(activityFile).isFile() && relativePath.endsWith("MainActivity.java")) {
            rmSync(activityFile);
            pruneEmptyDirs(dirname(activityFile), javaRoot);
        }
    }
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

    syncAndroidAppIdentity({ root, androidDir });

    return runCommand(gradleCommand(), ["assembleDebug"], { cwd: androidDir });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exit(runAndroidBuildDebug());
}
