#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertBuiltWebBundle, REQUIRED_WEB_BUNDLE_FILES } from "./smoke-release-artifacts.mjs";

export function verifyPagesBundle(distDir = "dist") {
    const resolvedDistDir = resolve(distDir);
    assertBuiltWebBundle(resolvedDistDir);
    return {
        distDir: resolvedDistDir,
        requiredFiles: [...REQUIRED_WEB_BUNDLE_FILES],
    };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const result = verifyPagesBundle(process.argv[2] ?? "dist");
    console.log(
        `[verify-pages-bundle] ${result.requiredFiles.length} required file(s) present in ${result.distDir}`,
    );
}
