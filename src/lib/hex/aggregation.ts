import type { AxialCoord, Path, Tile, TerrainType, TileMap } from "../../types/map";
import { generateHexRing, tileKey } from "./grid";
import { GRID_RADIUS, LEVELS } from "../constants";

export interface ClusterData {
  terrain: TerrainType;
  houseCount: number;
  riverCount: number;
}

const DEFAULT_TILE: Tile = { terrain: "pianura", features: {} };
const DEFAULT_CLUSTER: ClusterData = { terrain: "pianura", houseCount: 0, riverCount: 0 };
const CHILD_CELLS: AxialCoord[] = generateHexRing(GRID_RADIUS);

/** Chiave stringa univoca per un percorso di navigazione (es. "2,-1|0,3"). */
export function pathKey(path: Path): string {
  return path.map((p) => tileKey(p.q, p.r)).join("|");
}

/** True se esiste almeno una griglia Locale dipinta sotto (o a) questo percorso. */
function hasAnyTilesUnderPrefix(tilesStore: Record<string, TileMap>, prefix: string): boolean {
  if (prefix === "") return Object.keys(tilesStore).length > 0;
  const withSep = `${prefix}|`;
  return Object.keys(tilesStore).some((key) => key === prefix || key.startsWith(withSep));
}

function dominantTerrain(counts: Partial<Record<TerrainType, number>>): TerrainType {
  return (Object.entries(counts).sort((a, b) => b[1]! - a[1]!)[0]?.[0] ?? "pianura") as TerrainType;
}

/** Caso base: `path` identifica DIRETTAMENTE una griglia Locale -> leggi le sue tile. */
function computeLocaleAggregate(path: Path, tilesStore: Record<string, TileMap>): ClusterData {
  const tileMap = tilesStore[pathKey(path)];
  if (!tileMap) return DEFAULT_CLUSTER;

  const counts: Partial<Record<TerrainType, number>> = {};
  let houseCount = 0;
  let riverCount = 0;
  CHILD_CELLS.forEach(({ q, r }) => {
    const tile = tileMap[tileKey(q, r)] ?? DEFAULT_TILE;
    counts[tile.terrain] = (counts[tile.terrain] ?? 0) + 1;
    if (tile.features.casa) houseCount++;
    if (tile.features.fiume && tile.features.fiume.length > 0) riverCount++;
  });
  return { terrain: dominantTerrain(counts), houseCount, riverCount };
}

/**
 * Calcola i dati aggregati (terreno dominante, case, fiumi) rappresentativi della cella
 * indicata da `path`, qualunque sia il suo livello. Ricorsiva: se `path` non è ancora
 * abbastanza profondo da puntare a una griglia Locale, si aggregano ricorsivamente le
 * celle figlie di livello inferiore.
 */
export function aggregateCell(path: Path, tilesStore: Record<string, TileMap>): ClusterData {
  const remaining = LEVELS.length - 1 - path.length;
  if (remaining === 0) return computeLocaleAggregate(path, tilesStore);

  if (!hasAnyTilesUnderPrefix(tilesStore, pathKey(path))) return DEFAULT_CLUSTER;

  const counts: Partial<Record<TerrainType, number>> = {};
  let houseCount = 0;
  let riverCount = 0;
  CHILD_CELLS.forEach((c) => {
    const child = aggregateCell([...path, c], tilesStore);
    counts[child.terrain] = (counts[child.terrain] ?? 0) + 1;
    houseCount += child.houseCount;
    riverCount += child.riverCount;
  });
  return { terrain: dominantTerrain(counts), houseCount, riverCount };
}
