export function publicAssetPath(path: string, base = "/"): string {
    const normalizedPath = path.replace(/^\/+/, "");
    if (base === "./") return `./${normalizedPath}`;
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return `${normalizedBase}${normalizedPath}`;
}
