/**
 * Matematica di base per griglie esagonali "flat-top" con coordinate assiali (q, r).
 * Riferimento: https://www.redblobgames.com/grids/hexagons/
 *
 * Indicizzazione dei LATI (edge) di un esagono: il lato `i` è quello compreso tra
 * l'angolo `i` e l'angolo `i+1` (vedi hexCorner). Ogni lato ha un preciso vicino
 * assiale associato (EDGE_DIRECTIONS) — è la stessa indicizzazione usata per i fiumi.
 */

export function hexCorner(cx: number, cy: number, size: number, i: number): [number, number] {
  const angleRad = (Math.PI / 180) * (60 * i);
  return [cx + size * Math.cos(angleRad), cy + size * Math.sin(angleRad)];
}

export function hexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => hexCorner(cx, cy, size, i))
      .map((p) => p.join(","))
      .join(" ");
}

/** Punto medio del lato `edgeIndex` (0-5) di un esagono centrato in (cx, cy). */
export function hexEdgeMidpoint(cx: number, cy: number, size: number, edgeIndex: number): [number, number] {
  const [x1, y1] = hexCorner(cx, cy, size, edgeIndex);
  const [x2, y2] = hexCorner(cx, cy, size, (edgeIndex + 1) % 6);
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export function axialToPixel(q: number, r: number, size: number): [number, number] {
  return [size * 1.5 * q, size * Math.sqrt(3) * (r + q / 2)];
}

/** Direzione assiale del vicino oltre ciascun lato, indicizzata come hexCorner/hexEdgeMidpoint. */
export const EDGE_DIRECTIONS: ReadonlyArray<{ q: number; r: number }> = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

/** Il lato opposto, sull'esagono vicino, allo stesso confine fisico. */
export function oppositeEdge(edgeIndex: number): number {
  return (edgeIndex + 3) % 6;
}

/** Converte un angolo in gradi (qualsiasi valore, anche negativo) nel lato più vicino. */
export function angleToEdge(angleDeg: number): number {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const raw = Math.round((normalized - 30) / 60);
  return ((raw % 6) + 6) % 6;
}