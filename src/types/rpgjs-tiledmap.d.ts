declare module '@rpgjs/tiledmap/server' {
    export function provideTiledMap(options?: Record<string, unknown>): any;
}

declare module '@rpgjs/tiledmap/client' {
    export function provideTiledMap(options?: { basePath?: string }): any;
}
