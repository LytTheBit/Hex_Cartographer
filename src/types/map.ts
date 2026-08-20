export type TerrainType = "pianura" | "foresta" | "montagna" | "deserto" | "acqua";

export interface TileFeatures {
  fiume?: number[];
  casa?: boolean;
  strada?: boolean;
  castello?: boolean;
  campo?: boolean;
  miniera?: boolean;
}

export interface Tile {
  terrain: TerrainType;
  features: TileFeatures;
}

export type TileMap = Record<string, Tile>;

export type MapLevel = "locale" | "regionale" | "globale";

export interface AxialCoord {
  q: number;
  r: number;
}