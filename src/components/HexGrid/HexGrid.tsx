import { useMemo, useRef } from "react";
import type { MouseEvent } from "react";
import { Building, Building2, Home, Mountain, Trees, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GRID_RADIUS, HEX_SIZE, TERRAINS } from "../../lib/constants";
import { generateHexRing, tileKey } from "../../lib/hex/grid";
import { angleToEdge, axialToPixel, hexPoints } from "../../lib/hex/coordinates";
import { aggregateCell, type ClusterData } from "../../lib/hex/aggregation";
import { computeRiverLines } from "../../lib/hex/rivers";
import { Icon } from "../icons/Icon";
import type { Path, MapLevel, Tile, TerrainType, TileMap } from "../../types/map";
import type { Tool } from "../../state/useMapState";
import "./HexGrid.css";

const TERRAIN_ICONS: Partial<Record<TerrainType, LucideIcon>> = {
  foresta: Trees,
  montagna: Mountain,
  acqua: Waves,
};

interface HexGridProps {
  level: MapLevel;
  path: Path;
  tilesStore: Record<string, TileMap>;
  getTile: (q: number, r: number) => Tile;
  tool: Tool;
  onEnter: (q: number, r: number) => void;
  onPaint: (q: number, r: number) => void;
  onRiverEdge: (q: number, r: number, edge: number) => void;
}

// Ogni livello mostra sempre una griglia della stessa forma: solo il contenuto cambia.
const cells = generateHexRing(GRID_RADIUS);
const positions = cells.map(({ q, r }) => {
  const [x, y] = axialToPixel(q, r, HEX_SIZE);
  return { q, r, x, y };
});
const xs = positions.map((p) => p.x);
const ys = positions.map((p) => p.y);
const minX = Math.min(...xs) - HEX_SIZE;
const maxX = Math.max(...xs) + HEX_SIZE;
const minY = Math.min(...ys) - HEX_SIZE;
const maxY = Math.max(...ys) + HEX_SIZE;
const width = maxX - minX;
const height = maxY - minY;

export function HexGrid({ level, path, tilesStore, getTile, tool, onEnter, onPaint, onRiverEdge }: HexGridProps) {
  const isLocale = level === "locale";
  const svgRef = useRef<SVGSVGElement>(null);

  const riverLines = useMemo(() => (isLocale ? computeRiverLines(cells, getTile, HEX_SIZE) : []), [isLocale, getTile]);

  // Solo per Regionale/Globale: dati aggregati di ciascuna cella visibile.
  const clusterData = useMemo(() => {
    if (isLocale) return {} as Record<string, ClusterData>;
    const result: Record<string, ClusterData> = {};
    cells.forEach(({ q, r }) => {
      result[tileKey(q, r)] = aggregateCell([...path, { q, r }], tilesStore);
    });
    return result;
  }, [isLocale, path, tilesStore]);

  /** Converte la posizione del click (in pixel schermo) nel lato dell'esagono più vicino. */
  const edgeFromClick = (event: MouseEvent, centerX: number, centerY: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return 0;
    const local = pt.matrixTransform(ctm.inverse());
    const angleDeg = (Math.atan2(local.y - centerY, local.x - centerX) * 180) / Math.PI;
    return angleToEdge(angleDeg);
  };

  return (
      <div className="hex-canvas">
        <svg
            ref={svgRef}
            viewBox={`${minX} ${minY} ${width} ${height}`}
            width={Math.min(width, 720)}
            height={Math.min(height, 720)}
        >
          {riverLines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#2f6fa8" strokeWidth={HEX_SIZE * 0.28} strokeLinecap="round" />
          ))}

          {positions.map(({ q, r, x, y }) => {
            const key = tileKey(q, r);

            if (isLocale) {
              const tile = getTile(q, r);
              const color = TERRAINS[tile.terrain].color;
              const TerrainIconComp = TERRAIN_ICONS[tile.terrain];
              const isRiverTool = tool.type === "river";

              const handleClick = (event: MouseEvent) => {
                if (isRiverTool) onRiverEdge(q, r, edgeFromClick(event, x, y));
                else onPaint(q, r);
              };

              return (
                  <g key={key} className={isRiverTool ? "hex-clickable hex-river-cursor" : "hex-clickable"} onClick={handleClick}>
                    <polygon points={hexPoints(x, y, HEX_SIZE - 1)} fill={color} stroke="#5c4a2a" strokeWidth={0.6} />
                    {tile.features.casa ? (
                        <Icon Comp={Home} x={x} y={y} size={HEX_SIZE * 0.55} color="#3b2a1a" />
                    ) : (
                        TerrainIconComp && <Icon Comp={TerrainIconComp} x={x} y={y} size={HEX_SIZE * 0.5} color="rgba(0,0,0,0.35)" />
                    )}
                  </g>
              );
            }

            const data = clusterData[key];
            const color = TERRAINS[data.terrain].color;
            return (
                <g key={key} className="hex-clickable" onClick={() => onEnter(q, r)}>
                  <polygon points={hexPoints(x, y, HEX_SIZE - 1)} fill={color} stroke="#5c4a2a" strokeWidth={0.8} />
                  {data.houseCount >= 14 && <Icon Comp={Building2} x={x} y={y} size={HEX_SIZE * 0.45} color="#3b2a1a" />}
                  {data.houseCount >= 8 && data.houseCount < 14 && <Icon Comp={Building} x={x} y={y} size={HEX_SIZE * 0.45} color="#3b2a1a" />}
                </g>
            );
          })}
        </svg>
      </div>
  );
}