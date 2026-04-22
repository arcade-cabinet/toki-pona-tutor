export type TiledPropertyEntry = {
    name?: unknown;
    value?: unknown;
};

export type TiledObjectProperties = Record<string, unknown> | TiledPropertyEntry[];

export type TiledObjectLike = {
    name?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    properties?: TiledObjectProperties;
};

export function readTiledObjectProperty(object: TiledObjectLike, propertyName: string): unknown {
    const properties = object.properties;
    if (!properties) return undefined;

    if (Array.isArray(properties)) {
        return properties.find((property) => property.name === propertyName)?.value;
    }

    return properties[propertyName];
}

export function readTiledObjectType(object: TiledObjectLike): string {
    return String(object.type ?? readTiledObjectProperty(object, "type") ?? "");
}
