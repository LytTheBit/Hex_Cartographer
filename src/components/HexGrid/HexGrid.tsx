import { useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
import { Building, Building2, Home, Mountain, Trees, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CITY_DENSITY_THRESHOLD, HEX_SIZE, RATIO, TERRAINS, VIEWPORT_PX, VILLAGE_DENSITY_THRESHOLD } from "../../lib/constants";
import { generateHexRect, tileKey } from "../../lib/hex/grid";
import { angleToEdge, axialToParent, axialToPixel, hexPoints, pixelToAxial } from "../../lib/hex/coordinates";
import { aggregateMacroCell, type ClusterData } from "../../lib/hex/aggregation";
import { computeRiverPaths } from "../../lib/hex/rivers";
import { Icon } from "../icons/Icon";
import type { AxialCoord, MapLevel, Tile, TerrainType, TileMap } from "../../types/map";
import type { Tool } from "../../state/useMapState";
import "./HexGrid.css";

const TERRAIN_ICONS: Partial<Record<TerrainType, LucideIcon>> = {
  foresta: Trees,
  montagna: Mountain,
  acqua: Waves,
};

interface HexGridProps {
  level: MapLevel;
  ratio: number;
  camera: AxialCoord;
  visualZoom: number;
  tilesStore: TileMap;
  getTile: (q: number, r: number) => Tile;
  tool: Tool;
  showOverlay: boolean;
  onCellClick: (q: number, r: number) => void;
  onRiverEdge: (q: number, r: number, edge: number) => void;
  onPanBy: (dq: number, dr: number) => void;
  onZoomVisualBy: (factor: number) => void;
}

const DRAG_THRESHOLD_PX = 4;

export function HexGrid({
                          level,
                          ratio,
                          camera,
                          visualZoom,
                          tilesStore,
                          getTile,
                          tool,
                          showOverlay,
                          onCellClick,
                          onRiverEdge,
                          onPanBy,
                          onZoomVisualBy,
                        }: HexGridProps) {
  const isLocale = level === "locale";
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ lastX: number; lastY: number; moved: boolean; pointerId: number } | null>(null);
  const wasDrag = useRef(false);

  const pixelBaseSize = HEX_SIZE * visualZoom;
  const hexSize = pixelBaseSize * ratio;

  const [centerQ, centerR] = axialToParent(camera.q, camera.r, ratio);

  const cells = useMemo(
      () => generateHexRect(VIEWPORT_PX / 2, hexSize).map(({ q, r }) => ({ q: q + centerQ, r: r + centerR })),
      [centerQ, centerR, hexSize]
  );

  const positions = useMemo(
      () =>
          cells.map(({ q, r }) => {
            const [x, y] = axialToPixel(q, r, hexSize);
            return { q, r, x, y };
          }),
      [cells, hexSize]
  );

  const [cameraPixelX, cameraPixelY] = axialToPixel(camera.q, camera.r, pixelBaseSize);
  const minX = cameraPixelX - VIEWPORT_PX / 2;
  const minY = cameraPixelY - VIEWPORT_PX / 2;

  const riverPaths = useMemo(
      () => (isLocale ? computeRiverPaths(cells, getTile, pixelBaseSize) : []),
      [isLocale, cells, getTile, pixelBaseSize]
  );

  const clusterData = useMemo(() => {
    if (isLocale) return {} as Record<string, ClusterData>;
    const result: Record<string, ClusterData> = {};
    cells.forEach(({ q, r }) => {
      result[tileKey(q, r)] = aggregateMacroCell(q, r, ratio, tilesStore);
    });
    return result;
  }, [isLocale, cells, ratio, tilesStore]);

  const overlayCells = useMemo(() => {
    if (!showOverlay || level === "globale") return [];
    const seen = new Set<string>();
    const result: Array<[number, number]> = [];
    cells.forEach(({ q, r }) => {
      const [Q, R] = axialToParent(q, r, RATIO);
      const key = tileKey(Q, R);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(axialToPixel(Q, R, hexSize * RATIO));
    });
    return result;
  }, [showOverlay, level, cells, hexSize]);

  const toSvgPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const edgeFromClick = (event: MouseEvent, cx: number, cy: number): number => {
    const { x, y } = toSvgPoint(event.clientX, event.clientY);
    const angleDeg = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
    return angleToEdge(angleDeg);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    dragState.current = { lastX: event.clientX, lastY: event.clientY, moved: false, pointerId: event.pointerId };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const dxScreen = event.clientX - drag.lastX;
    const dyScreen = event.clientY - drag.lastY;

    if (!drag.moved && (Math.abs(dxScreen) > DRAG_THRESHOLD_PX || Math.abs(dyScreen) > DRAG_THRESHOLD_PX)) {
      drag.moved = true;
      svgRef.current?.setPointerCapture(drag.pointerId);
    }
    if (!drag.moved) return;

    const start = toSvgPoint(drag.lastX, drag.lastY);
    const current = toSvgPoint(event.clientX, event.clientY);
    const [dq, dr] = pixelToAxial(current.x - start.x, current.y - start.y, pixelBaseSize);
    onPanBy(-dq, -dr);

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current;
    if (drag?.moved) svgRef.current?.releasePointerCapture(event.pointerId);
    wasDrag.current = drag?.moved ?? false;
    dragState.current = null;
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const factor = Math.pow(1.0015, -event.deltaY);
    onZoomVisualBy(factor);
  };

  return (
      <div className="hex-canvas">
        <svg
            ref={svgRef}
            viewBox={`${minX} ${minY} ${VIEWPORT_PX} ${VIEWPORT_PX}`}
            width={VIEWPORT_PX}
            height={VIEWPORT_PX}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="hex-svg"
        >
          {riverPaths.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#2f6fa8" strokeWidth={pixelBaseSize * 0.55} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {positions.map(({ q, r, x, y }) => {
            const key = tileKey(q, r);

            const handleClick = (event: MouseEvent) => {
              if (wasDrag.current) {
                wasDrag.current = false;
                return;
              }
              if (isLocale && tool.type === "river") onRiverEdge(q, r, edgeFromClick(event, x, y));
              else onCellClick(q, r);
            };

            if (isLocale) {
              const tile = getTile(q, r);
              const color = TERRAINS[tile.terrain].color;
              const TerrainIconComp = TERRAIN_ICONS[tile.terrain];
              const isRiverTool = tool.type === "river";
              return (
                  <g key={key} className={isRiverTool ? "hex-clickable hex-river-cursor" : "hex-clickable"} onClick={handleClick}>
                    <polygon points={hexPoints(x, y, hexSize - 1)} fill={color} stroke="#5c4a2a" strokeWidth={0.6} />
                    {tile.features.casa ? (
                        <Icon Comp={Home} x={x} y={y} size={hexSize * 0.55} color="#3b2a1a" />
                    ) : (
                        TerrainIconComp && <Icon Comp={TerrainIconComp} x={x} y={y} size={hexSize * 0.5} color="rgba(0,0,0,0.35)" />
                    )}
                  </g>
              );
            }

            const data = clusterData[key];
            const color = TERRAINS[data.terrain].color;
            const TerrainIconComp = TERRAIN_ICONS[data.terrain];
            const isCity = data.houseDensity >= CITY_DENSITY_THRESHOLD;
            const isVillage = !isCity && data.houseDensity >= VILLAGE_DENSITY_THRESHOLD;
            return (
                <g key={key} className="hex-clickable" onClick={handleClick}>
                  <polygon points={hexPoints(x, y, hexSize - 1)} fill={color} stroke="#5c4a2a" strokeWidth={0.8} />
                  {isCity ? (
                      <Icon Comp={Building2} x={x} y={y} size={hexSize * 0.45} color="#3b2a1a" />
                  ) : isVillage ? (
                      <Icon Comp={Building} x={x} y={y} size={hexSize * 0.45} color="#3b2a1a" />
                  ) : (
                      TerrainIconComp && <Icon Comp={TerrainIconComp} x={x} y={y} size={hexSize * 0.4} color="rgba(0,0,0,0.35)" />
                  )}
                </g>
            );
          })}

          {overlayCells.map(([x, y], i) => (
              <polygon
                  key={`overlay-${i}`}
                  points={hexPoints(x, y, hexSize * RATIO - 1)}
                  fill="none"
                  stroke="#c9a227"
                  strokeWidth={pixelBaseSize * 0.12}
                  strokeDasharray={`${pixelBaseSize * 0.3} ${pixelBaseSize * 0.2}`}
                  pointerEvents="none"
              />
          ))}
        </svg>
      </div>
  );
}