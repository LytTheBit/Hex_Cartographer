import type { AxialCoord, Tile, TerrainType, TileMap } from "../../types/map";
import { axialToParent } from "./coordinates";
import { generateHexRing, tileKey } from "./grid";

export interface ClusterData {
  terrain: TerrainType;
  houseCount: number;
  /** Quota (0-1) di celle Locale con una casa: usata per le icone villaggio/città, che
   * così funzionano correttamente a qualsiasi livello di aggregazione. */
  houseDensity: number;
  riverCount: number;
}

const DEFAULT_TILE: Tile = { terrain: "pianura", features: {} };
const DEFAULT_CLUSTER: ClusterData = { terrain: "pianura", houseCount: 0, houseDensity: 0, riverCount: 0 };

/**
 * Tutte le celle Locale che appartengono alla macro-cella (Q, R) a un dato rapporto.
 * Genera un intorno abbondante in coordinate Locale attorno al centro approssimato della
 * macro-cella, poi tiene solo quelle che vi appartengono davvero (stesso arrotondamento
 * usato per la visualizzazione, quindi il risultato è sempre coerente).
 */
export function getMacroChildren(Q: number, R: number, ratio: number): AxialCoord[] {
  if (ratio <= 1) return [{ q: Q, r: R }];
  const approxQ = Q * ratio;
  const approxR = R * ratio;
  return generateHexRing(ratio + 2)
      .map(({ q, r }) => ({ q: q + approxQ, r: r + approxR }))
      .filter(({ q, r }) => {
        const [pq, pr] = axialToParent(q, r, ratio);
        return pq === Q && pr === R;
      });
}

function dominantTerrain(counts: Partial<Record<TerrainType, number>>): TerrainType {
  return (Object.entries(counts).sort((a, b) => b[1]! - a[1]!)[0]?.[0] ?? "pianura") as TerrainType;
}

/** Dati aggregati (terreno dominante, case, fiumi) della macro-cella (Q, R) a un dato rapporto. */
export function aggregateMacroCell(Q: number, R: number, ratio: number, tilesStore: TileMap): ClusterData {
  const children = getMacroChildren(Q, R, ratio);
  if (children.length === 0) return DEFAULT_CLUSTER;

  const counts: Partial<Record<TerrainType, number>> = {};
  let houseCount = 0;
  let riverCount = 0;
  children.forEach(({ q, r }) => {
    const tile = tilesStore[tileKey(q, r)] ?? DEFAULT_TILE;
    counts[tile.terrain] = (counts[tile.terrain] ?? 0) + 1;
    if (tile.features.casa) houseCount++;
    if (tile.features.fiume && tile.features.fiume.length > 0) riverCount++;
  });
  return { terrain: dominantTerrain(counts), houseCount, houseDensity: houseCount / children.length, riverCount };
}