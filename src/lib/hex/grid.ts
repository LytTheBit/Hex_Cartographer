import type { AxialCoord } from "../../types/map";
import { axialToPixel } from "./coordinates";

export function generateHexRing(radius: number): AxialCoord[] {
  const cells: AxialCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) cells.push({ q, r });
  }
  return cells;
}

export function generateHexRect(halfExtentPx: number, hexSize: number): AxialCoord[] {
  const cells: AxialCoord[] = [];
  const padding = hexSize * 1.6;
  const limit = halfExtentPx + padding;
  const qMax = Math.min(120, Math.ceil(limit / (1.5 * hexSize)) + 1);

  for (let q = -qMax; q <= qMax; q++) {
    const rCenterOffset = -q / 2;
    const rSpan = Math.min(120, Math.ceil(limit / (hexSize * Math.sqrt(3))) + 2);
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

export function cubeDistance(q: number, r: number): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
}