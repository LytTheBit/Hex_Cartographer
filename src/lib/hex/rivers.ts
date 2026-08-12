import type { Tile, AxialCoord } from "../../types/map";
import { axialToPixel, hexEdgeMidpoint } from "./coordinates";

export interface RiverLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Un fiume è un elenco di LATI (0-5) su ciascuna tile. Ogni lato marcato disegna un
 * segmento dal centro al punto medio di quel lato. Il toggle (vedi
 * useMapState.toggleRiverEdge) aggiorna sempre anche il lato speculare sulla tile vicina,
 * quindi i due mezzi-segmenti si incontrano sempre esattamente sul confine condiviso.
 */
export function computeRiverLines(cells: AxialCoord[], getTile: (q: number, r: number) => Tile, hexSize: number): RiverLine[] {
  const lines: RiverLine[] = [];
  cells.forEach(({ q, r }) => {
    const edges = getTile(q, r).features.fiume;
    if (!edges || edges.length === 0) return;
    const [cx, cy] = axialToPixel(q, r, hexSize);
    edges.forEach((edge) => {
      const [mx, my] = hexEdgeMidpoint(cx, cy, hexSize, edge);
      lines.push({ x1: cx, y1: cy, x2: mx, y2: my });
    });
  });
  return lines;
}