import type { Tile, AxialCoord } from "../../types/map";
import { axialToPixel, hexEdgeMidpoint } from "./coordinates";

interface Point {
  x: number;
  y: number;
}

/**
 * I fiumi come CURVE UNICHE per l'intero corso, non più una curva indipendente per ogni
 * esagono. Un fiume "spezzato in curve locali" resta comunque con una direzione diversa a
 * ogni confine tra esagoni (continuo nella posizione, ma non nella tangente). Qui invece:
 *
 * 1. Si costruisce un grafo: un nodo "centro" per ogni esagono con almeno un lato-fiume, un
 *    nodo "punto medio" per ogni lato attivo (condiviso dai due esagoni adiacenti).
 * 2. Si percorrono le catene di nodi (dai punti di sorgente/foce o dalle confluenze, che
 *    fanno da estremi, attraverso gli esagoni "di passaggio" con esattamente 2 lati attivi).
 * 3. Ogni catena di punti risultante viene trasformata in un'UNICA curva liscia con lo
 *    schema Catmull-Rom (convertito in Bézier cubiche per l'SVG): la tangente in ogni punto
 *    tiene conto dei punti vicini lungo TUTTO il corso, non solo del singolo esagono.
 */
export function computeRiverPaths(cells: AxialCoord[], getTile: (q: number, r: number) => Tile, hexSize: number): string[] {
  interface CenterNode {
    key: string;
    x: number;
    y: number;
    edgeMidKeys: string[];
  }

  const centers = new Map<string, CenterNode>();
  const midpoints = new Map<string, Point>();
  const midToCenters = new Map<string, string[]>();

  cells.forEach(({ q, r }) => {
    const edges = getTile(q, r).features.fiume;
    if (!edges || edges.length === 0) return;

    const [cx, cy] = axialToPixel(q, r, hexSize);
    const centerKey = `c:${q},${r}`;
    const edgeMidKeys: string[] = [];

    edges.forEach((edge) => {
      const [mx, my] = hexEdgeMidpoint(cx, cy, hexSize, edge);
      const midKey = `m:${Math.round(mx)}:${Math.round(my)}`;
      midpoints.set(midKey, { x: mx, y: my });
      edgeMidKeys.push(midKey);
      const list = midToCenters.get(midKey) ?? [];
      if (!list.includes(centerKey)) list.push(centerKey);
      midToCenters.set(midKey, list);
    });

    centers.set(centerKey, { key: centerKey, x: cx, y: cy, edgeMidKeys });
  });

  const visitedMid = new Set<string>();
  const chains: Point[][] = [];

  const otherCenter = (midKey: string, fromCenterKey: string): string | null =>
      (midToCenters.get(midKey) ?? []).find((c) => c !== fromCenterKey) ?? null;

  function traceFrom(startCenterKey: string, firstMidKey: string) {
    const start = centers.get(startCenterKey);
    if (!start) return;
    const points: Point[] = [{ x: start.x, y: start.y }];

    let fromCenterKey = startCenterKey;
    let midKey: string | null = firstMidKey;

    while (midKey) {
      if (visitedMid.has(midKey)) break;
      visitedMid.add(midKey);
      const mid = midpoints.get(midKey);
      if (!mid) break;
      points.push(mid);

      const nextCenterKey = otherCenter(midKey, fromCenterKey);
      if (!nextCenterKey) break;
      const nextCenter = centers.get(nextCenterKey);
      if (!nextCenter) break;
      points.push({ x: nextCenter.x, y: nextCenter.y });

      if (nextCenter.edgeMidKeys.length === 2) {
        const next = nextCenter.edgeMidKeys.find((k) => k !== midKey) ?? null;
        fromCenterKey = nextCenterKey;
        midKey = next;
      } else {
        midKey = null;
      }
    }

    if (points.length >= 2) chains.push(points);
  }

  centers.forEach((center) => {
    if (center.edgeMidKeys.length !== 2) {
      center.edgeMidKeys.forEach((midKey) => {
        if (!visitedMid.has(midKey)) traceFrom(center.key, midKey);
      });
    }
  });
  centers.forEach((center) => {
    if (center.edgeMidKeys.length === 2) {
      center.edgeMidKeys.forEach((midKey) => {
        if (!visitedMid.has(midKey)) traceFrom(center.key, midKey);
      });
    }
  });

  return chains.map(catmullRomToPath);
}

function catmullRomToPath(points: Point[]): string {
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}