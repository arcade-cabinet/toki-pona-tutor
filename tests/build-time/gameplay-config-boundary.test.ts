import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const SCANNED_DIRS = [
    'src/config',
    'src/content',
    'src/modules/main',
] as const;

const IGNORED_DIRS = [
    'src/content/gameplay',
    'src/content/generated',
    'src/content/schema',
] as const;

const ALLOWED_DIRECT_TABLES = new Map<string, string>();

function walkTsFiles(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkTsFiles(path));
        } else if (entry.isFile() && path.endsWith('.ts')) {
            files.push(path);
        }
    }

    return files;
}

function toRepoPath(path: string): string {
    return relative(ROOT, path).split(sep).join('/');
}

function isIgnored(path: string): boolean {
    const repoPath = toRepoPath(path);
    return IGNORED_DIRS.some((dir) => repoPath === dir || repoPath.startsWith(`${dir}/`));
}

function unwrapExpression(expr: ts.Expression): ts.Expression {
    let current = expr;
    while (
        ts.isAsExpression(current)
        || ts.isSatisfiesExpression(current)
        || ts.isParenthesizedExpression(current)
        || ts.isTypeAssertionExpression(current)
    ) {
        current = current.expression;
    }
    return current;
}

function directLiteralEntryCount(expr: ts.Expression): number {
    const unwrapped = unwrapExpression(expr);
    if (ts.isArrayLiteralExpression(unwrapped)) {
        return unwrapped.elements.filter((element) => !ts.isSpreadElement(element)).length;
    }
    if (ts.isObjectLiteralExpression(unwrapped)) {
        return unwrapped.properties.filter((property) => !ts.isSpreadAssignment(property)).length;
    }
    if (
        ts.isNewExpression(unwrapped)
        && ts.isIdentifier(unwrapped.expression)
        && unwrapped.expression.text === 'Set'
        && unwrapped.arguments?.length === 1
    ) {
        return directLiteralEntryCount(unwrapped.arguments[0]);
    }
    return 0;
}

function findDirectRuntimeTables(path: string): string[] {
    const repoPath = toRepoPath(path);
    const source = ts.createSourceFile(
        repoPath,
        readFileSync(path, 'utf-8'),
        ts.ScriptTarget.Latest,
        true,
    );
    const tables: string[] = [];

    for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) continue;

        for (const declaration of statement.declarationList.declarations) {
            if (!ts.isIdentifier(declaration.name)) continue;
            if (!/^[A-Z][A-Z0-9_]*$/.test(declaration.name.text)) continue;
            if (!declaration.initializer) continue;
            if (directLiteralEntryCount(declaration.initializer) < 2) continue;

            tables.push(`${repoPath}::${declaration.name.text}`);
        }
    }

    return tables;
}

describe('gameplay JSON config boundary', () => {
    it('keeps authored runtime catalogs out of RPG.js modules', () => {
        const directTables = SCANNED_DIRS.flatMap((dir) => walkTsFiles(join(ROOT, dir)))
            .filter((path) => !isIgnored(path))
            .flatMap(findDirectRuntimeTables)
            .sort();

        const unapproved = directTables.filter((table) => !ALLOWED_DIRECT_TABLES.has(table));

        expect(unapproved).toEqual([]);
        expect(directTables).toEqual([...ALLOWED_DIRECT_TABLES.keys()].sort());
    });
});
