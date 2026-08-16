/**
 * Basic math for "flat-top" hex grids with axial coordinates (q, r).
 * Reference: https://www.redblobgames.com/grids/hexagons/
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

/** Midpoint of side `edgeIndex` (0-5) of a hexagon centered at (cx, cy). Used by rivers. */
export function hexEdgeMidpoint(cx: number, cy: number, size: number, edgeIndex: number): [number, number] {
  const [x1, y1] = hexCorner(cx, cy, size, edgeIndex);
  const [x2, y2] = hexCorner(cx, cy, size, (edgeIndex + 1) % 6);
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export function axialToPixel(q: number, r: number, size: number): [number, number] {
  return [size * 1.5 * q, size * Math.sqrt(3) * (r + q / 2)];
}

/** Inverse of axialToPixel: a pixel delta -> an axial coordinate delta. Used for dragging. */
export function pixelToAxial(dx: number, dy: number, size: number): [number, number] {
  const dq = dx / (1.5 * size);
  const dr = dy / (size * Math.sqrt(3)) - dq / 2;
  return [dq, dr];
}

/** Axial direction of the neighbor across each side, indexed like hexCorner/hexEdgeMidpoint. */
export const EDGE_DIRECTIONS: ReadonlyArray<{ q: number; r: number }> = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

/** The opposite side, on the neighboring hex, across the same physical boundary. */
export function oppositeEdge(edgeIndex: number): number {
  return (edgeIndex + 3) % 6;
}

/** Converts an angle in degrees (any value) into the nearest side. */
export function angleToEdge(angleDeg: number): number {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const raw = Math.round((normalized - 30) / 60);
  return ((raw % 6) + 6) % 6;
}

function cubeRound(x: number, y: number, z: number): [number, number] {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const dx = Math.abs(rx - x);
  const dy = Math.abs(ry - y);
  const dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, rz];
}

/**
 * Finds the nearest cell on a hex lattice scaled by `ratio` (also accepts NON-integer
 * coordinates, e.g. the camera's continuous position). The Voronoi diagram of a hex lattice
 * is always made of clean hexagons: every point belongs to exactly one cell, never two.
 */
export function axialToParent(q: number, r: number, ratio: number): [number, number] {
  const x = q / ratio;
  const z = r / ratio;
  const y = -x - z;
  return cubeRound(x, y, z);
}

/** Rounds a possibly-fractional axial coordinate to the nearest integer hex. */
export function axialRound(q: number, r: number): [number, number] {
  return axialToParent(q, r, 1);
}