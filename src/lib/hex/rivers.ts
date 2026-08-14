import type { Tile, AxialCoord } from "../../types/map";
import { axialToPixel, hexEdgeMidpoint } from "./coordinates";

/**
 * Un fiume è un elenco di LATI (0-5) su ciascuna tile. Invece di disegnare un segmento
 * dritto per ogni lato (che crea "spigoli" visibili nei punti di svolta), per ogni esagono
 * costruiamo UN'UNICA curva continua:
 *  - 2 lati attivi -> una curva di Bézier che passa dolcemente vicino al centro (aspetto
 *    "fiume che scorre", non "fiume che fa angolo retto")
 *  - 1 lato attivo -> una sorgente/foce: linea dal centro al lato
 *  - 3+ lati attivi -> una confluenza: linee dal centro a ciascun lato (caso raro)
 * Il punto medio di ogni lato coincide esattamente con quello dell'esagono vicino (stesso
 * confine fisico), quindi le curve di esagoni adiacenti si agganciano sempre alla perfezione.
 */
export function computeRiverPaths(cells: AxialCoord[], getTile: (q: number, r: number) => Tile, hexSize: number): string[] {
  const paths: string[] = [];

  cells.forEach(({ q, r }) => {
    const edges = getTile(q, r).features.fiume;
    if (!edges || edges.length === 0) return;
    const [cx, cy] = axialToPixel(q, r, hexSize);

    if (edges.length === 1) {
      const [mx, my] = hexEdgeMidpoint(cx, cy, hexSize, edges[0]);
      paths.push(`M ${cx} ${cy} L ${mx} ${my}`);
    } else if (edges.length === 2) {
      const [x1, y1] = hexEdgeMidpoint(cx, cy, hexSize, edges[0]);
      const [x2, y2] = hexEdgeMidpoint(cx, cy, hexSize, edges[1]);
      paths.push(`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    } else {
      edges.forEach((edge) => {
        const [mx, my] = hexEdgeMidpoint(cx, cy, hexSize, edge);
        paths.push(`M ${cx} ${cy} L ${mx} ${my}`);
      });
    }
  });

  return paths;
}