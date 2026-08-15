export type TerrainType = "pianura" | "foresta" | "montagna" | "deserto" | "acqua";

export interface TileFeatures {
  fiume?: number[];
  casa?: boolean;
  /** Presenza di una strada in questo esagono: si collega a ogni esagono vicino che ce l'ha
   * anche lui, passando per i centri (non per i lati, a differenza dei fiumi). */
  strada?: boolean;
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