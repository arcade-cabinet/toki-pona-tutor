declare module "@rpgjs/tiledmap/server" {
    export function provideTiledMap(options?: Record<string, unknown>): any;
}

declare module "@rpgjs/tiledmap/client" {
    export function provideTiledMap(options?: { basePath?: string }): any;
}

declare module "@rpgjs/action-battle/server" {
    export function provideActionBattle(options?: Record<string, unknown>): any;
    export const BattleAi: any;
    export enum EnemyType {
        Aggressive = "aggressive",
        Defensive = "defensive",
        Ranged = "ranged",
        Tank = "tank",
        Berserker = "berserker",
    }
}

declare module "@rpgjs/action-battle/client" {
    export function provideActionBattle(options?: Record<string, unknown>): any;
}
