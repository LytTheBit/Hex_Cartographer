import type { AxialCoord, Tile, TerrainType, TileMap } from "../../types/map";
import { axialToParent } from "./coordinates";
import { generateHexRing, tileKey } from "./grid";

export interface ClusterData {
  terrain: TerrainType;
  houseCount: number;
  houseDensity: number;
  riverCount: number;
}

const DEFAULT_CLUSTER: ClusterData = { terrain: "pianura", houseCount: 0, houseDensity: 0, riverCount: 0 };

/** Used ONLY for bulk painting (paintMacro). Do NOT use for reading/aggregating during rendering. */
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

export function macroChildCount(ratio: number): number {
  return ratio * ratio;
}

function dominantTerrain(counts: Partial<Record<TerrainType, number>>): TerrainType {
  return (Object.entries(counts).sort((a, b) => b[1]! - a[1]!)[0]?.[0] ?? "pianura") as TerrainType;
}

export function bucketPaintedTilesByMacro(tilesStore: TileMap, ratio: number): Map<string, Tile[]> {
  const buckets = new Map<string, Tile[]>();
  Object.entries(tilesStore).forEach(([key, tile]) => {
    const [q, r] = key.split(",").map(Number);
    const [Q, R] = axialToParent(q, r, ratio);
    const macroKey = tileKey(Q, R);
    const list = buckets.get(macroKey);
    if (list) list.push(tile);
    else buckets.set(macroKey, [tile]);
  });
  return buckets;
}

export function aggregateMacroCellFast(macroKey: string, ratio: number, buckets: Map<string, Tile[]>): ClusterData {
  const painted = buckets.get(macroKey);
  if (!painted || painted.length === 0) return DEFAULT_CLUSTER;

  const totalChildren = macroChildCount(ratio);
  const counts: Partial<Record<TerrainType, number>> = {};
  let houseCount = 0;
  let riverCount = 0;
  painted.forEach((tile) => {
    counts[tile.terrain] = (counts[tile.terrain] ?? 0) + 1;
    if (tile.features.casa) houseCount++;
    if (tile.features.fiume && tile.features.fiume.length > 0) riverCount++;
  });

  const implicitDefault = totalChildren - painted.length;
  if (implicitDefault > 0) counts.pianura = (counts.pianura ?? 0) + implicitDefault;

  return { terrain: dominantTerrain(counts), houseCount, houseDensity: houseCount / totalChildren, riverCount };
}