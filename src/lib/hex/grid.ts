import type { AxialCoord } from "../../types/map";

/** Genera tutte le celle di una griglia esagonale a forma di esagono di raggio `radius`. */
export function generateHexRing(radius: number): AxialCoord[] {
  const cells: AxialCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) cells.push({ q, r });
  }
  return cells;
}

export function tileKey(q: number, r: number): string {
  return `${q},${r}`;
}