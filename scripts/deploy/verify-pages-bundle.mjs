#!/usr/bin/env node
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertBuiltWebBundle, requiredWebBundleFiles } from "./smoke-release-artifacts.mjs";

export function verifyPagesBundle(distDir = "dist", root = process.cwd()) {
    const resolvedDistDir = resolve(distDir);
    assertBuiltWebBundle(resolvedDistDir, root);
    return {
        distDir: resolvedDistDir,
        requiredFiles: requiredWebBundleFiles(root),
    };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const result = verifyPagesBundle(process.argv[2] ?? "dist");
    console.log(
        `[verify-pages-bundle] ${result.requiredFiles.length} required file(s) present in ${result.distDir}`,
    );
}
