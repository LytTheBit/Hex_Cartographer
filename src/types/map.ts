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

/** Le tile di UNA singola griglia Locale (chiave "q,r" -> Tile). */
export type TileMap = Record<string, Tile>;

export type MapLevel = "globale" | "regionale" | "locale";

export interface AxialCoord {
  q: number;
  r: number;
}

/**
 * Sequenza di coordinate scelte per "entrare" nella mappa, dal livello Globale in giù.
 * path.length === 0 -> si sta visualizzando la griglia Globale (radice)
 * path.length === 1 -> si è entrati in una cella Globale, si vede la sua griglia Regionale
 * path.length === 2 -> si è entrati anche in una cella Regionale, si vede la sua griglia Locale (editabile)
 */
export type Path = AxialCoord[];