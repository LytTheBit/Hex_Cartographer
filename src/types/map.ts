export type TerrainType = "pianura" | "foresta" | "montagna" | "deserto" | "acqua";

export interface TileFeatures {
  /** Indici di lato (0-5) su cui è presente un segmento di fiume. Vedi lib/hex/coordinates.ts. */
  fiume?: number[];
  casa?: boolean;
}

export interface Tile {
  terrain: TerrainType;
  features: TileFeatures;
}

/** Tutte le tile Locale della mappa, in un'unica mappa piatta (chiave "q,r" -> Tile). */
export type TileMap = Record<string, Tile>;

export type MapLevel = "locale" | "regionale" | "globale";

export interface AxialCoord {
  q: number;
  r: number;
}