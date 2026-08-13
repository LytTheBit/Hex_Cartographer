import type { AxialCoord } from "../../types/map";
import { axialToPixel } from "./coordinates";

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

/**
 * Genera tutte le celle il cui centro (in pixel, a dimensione `hexSize`) rientra in un
 * quadrato di lato `2 * halfExtentPx` centrato sull'origine — usata per riempire un canvas
 * RETTANGOLARE di esagoni, invece della forma esagonale di generateHexRing.
 */
export function generateHexRect(halfExtentPx: number, hexSize: number): AxialCoord[] {
  const cells: AxialCoord[] = [];
  const padding = hexSize * 1.6; // margine extra per gli esagoni parzialmente visibili ai bordi
  const limit = halfExtentPx + padding;
  const qMax = Math.ceil(limit / (1.5 * hexSize)) + 1;

  for (let q = -qMax; q <= qMax; q++) {
    const rCenterOffset = -q / 2;
    const rSpan = Math.ceil(limit / (hexSize * Math.sqrt(3))) + 2;
    for (let r = Math.floor(rCenterOffset - rSpan); r <= Math.ceil(rCenterOffset + rSpan); r++) {
      const [x, y] = axialToPixel(q, r, hexSize);
      if (Math.abs(x) <= limit && Math.abs(y) <= limit) cells.push({ q, r });
    }
  }
  return cells;
}

export function tileKey(q: number, r: number): string {
  return `${q},${r}`;
}