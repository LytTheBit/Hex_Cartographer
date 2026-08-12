import { useMemo, useRef } from "react";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
import { Building, Building2, Home, Mountain, Trees, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HEX_SIZE, RATIO, TERRAINS, VIEW_RADIUS } from "../../lib/constants";
import { generateHexRing, tileKey } from "../../lib/hex/grid";
import { angleToEdge, axialToParent, axialToPixel, hexPoints, pixelToAxial } from "../../lib/hex/coordinates";
import { aggregateMacroCell, type ClusterData } from "../../lib/hex/aggregation";
import { computeRiverLines } from "../../lib/hex/rivers";
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
  tilesStore: TileMap;
  getTile: (q: number, r: number) => Tile;
  tool: Tool;
  showOverlay: boolean;
  onCellClick: (q: number, r: number) => void;
  onRiverEdge: (q: number, r: number, edge: number) => void;
  onPanBy: (dq: number, dr: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const DRAG_THRESHOLD_PX = 4;
const WHEEL_COOLDOWN_MS = 220;

export function HexGrid({
                          level,
                          ratio,
                          camera,
                          tilesStore,
                          getTile,
                          tool,
                          showOverlay,
                          onCellClick,
                          onRiverEdge,
                          onPanBy,
                          onZoomIn,
                          onZoomOut,
                        }: HexGridProps) {
  const isLocale = level === "locale";
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ lastX: number; lastY: number; moved: boolean } | null>(null);
  const lastWheelTime = useRef(0);

  const hexSize = HEX_SIZE * ratio;
  // Cella (Locale o macro, a seconda del livello) più vicina alla posizione attuale della telecamera.
  const [centerQ, centerR] = axialToParent(camera.q, camera.r, ratio);

  const cells = useMemo(
      () => generateHexRing(VIEW_RADIUS).map(({ q, r }) => ({ q: q + centerQ, r: r + centerR })),
      [centerQ, centerR]
  );

  const positions = useMemo(
      () =>
          cells.map(({ q, r }) => {
            const [x, y] = axialToPixel(q, r, hexSize);
            return { q, r, x, y };
          }),
      [cells, hexSize]
  );

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const boxWidth = Math.max(...xs) - Math.min(...xs) + hexSize * 2.4;
  const boxHeight = Math.max(...ys) - Math.min(...ys) + hexSize * 2.4;
  // Il centro del viewBox segue la posizione ESATTA (anche frazionaria) della telecamera,
  // non la cella arrotondata: così il pan risulta fluido invece che "a scatti".
  const [cameraPixelX, cameraPixelY] = axialToPixel(camera.q, camera.r, HEX_SIZE);
  const minX = cameraPixelX - boxWidth / 2;
  const minY = cameraPixelY - boxHeight / 2;

  const riverLines = useMemo(() => (isLocale ? computeRiverLines(cells, getTile, HEX_SIZE) : []), [isLocale, cells, getTile]);

  const riverJoints = useMemo(() => {
    if (!isLocale) return [];
    return cells
        .filter(({ q, r }) => (getTile(q, r).features.fiume?.length ?? 0) > 0)
        .map(({ q, r }) => axialToPixel(q, r, HEX_SIZE));
  }, [isLocale, cells, getTile]);

  const clusterData = useMemo(() => {
    if (isLocale) return {} as Record<string, ClusterData>;
    const result: Record<string, ClusterData> = {};
    cells.forEach(({ q, r }) => {
      result[tileKey(q, r)] = aggregateMacroCell(q, r, ratio, tilesStore);
    });
    return result;
  }, [isLocale, cells, ratio, tilesStore]);

  // Overlay: contorni delle macro-celle Regionale visibili, sopra la griglia Locale.
  const overlayCells = useMemo(() => {
    if (!isLocale || !showOverlay) return [];
    const seen = new Set<string>();
    const result: Array<[number, number]> = [];
    cells.forEach(({ q, r }) => {
      const [Q, R] = axialToParent(q, r, RATIO);
      const key = tileKey(Q, R);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(axialToPixel(Q, R, HEX_SIZE * RATIO));
    });
    return result;
  }, [isLocale, showOverlay, cells]);

  /** Converte coordinate schermo in coordinate SVG interne (viewBox), robusto a zoom/CSS. */
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
    dragState.current = { lastX: event.clientX, lastY: event.clientY, moved: false };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current;
    if (!drag) return;
    const dxScreen = event.clientX - drag.lastX;
    const dyScreen = event.clientY - drag.lastY;
    if (Math.abs(dxScreen) > DRAG_THRESHOLD_PX || Math.abs(dyScreen) > DRAG_THRESHOLD_PX) drag.moved = true;
    if (!drag.moved) return;

    const start = toSvgPoint(drag.lastX, drag.lastY);
    const current = toSvgPoint(event.clientX, event.clientY);
    const [dq, dr] = pixelToAxial(current.x - start.x, current.y - start.y, HEX_SIZE);
    onPanBy(-dq, -dr); // trascinare a destra deve spostare la vista a sinistra

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    svgRef.current?.releasePointerCapture(event.pointerId);
    dragState.current = null;
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const now = Date.now();
    if (now - lastWheelTime.current < WHEEL_COOLDOWN_MS) return;
    lastWheelTime.current = now;
    if (event.deltaY < 0) onZoomIn();
    else onZoomOut();
  };

  return (
      <div className="hex-canvas">
        <svg
            ref={svgRef}
            viewBox={`${minX} ${minY} ${boxWidth} ${boxHeight}`}
            width={Math.min(boxWidth, 720)}
            height={Math.min(boxHeight, 720)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="hex-svg"
        >
          {riverLines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#2f6fa8" strokeWidth={HEX_SIZE * 0.38} strokeLinecap="round" />
          ))}
          {riverJoints.map(([cx, cy], i) => (
              <circle key={`joint-${i}`} cx={cx} cy={cy} r={HEX_SIZE * 0.19} fill="#2f6fa8" />
          ))}

          {positions.map(({ q, r, x, y }) => {
            const key = tileKey(q, r);

            const handleClick = (event: MouseEvent) => {
              if (dragState.current?.moved) return; // era un trascinamento, non un click
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
            return (
                <g key={key} className="hex-clickable" onClick={handleClick}>
                  <polygon points={hexPoints(x, y, hexSize - 1)} fill={color} stroke="#5c4a2a" strokeWidth={0.8} />
                  {data.houseCount >= 14 && <Icon Comp={Building2} x={x} y={y} size={hexSize * 0.45} color="#3b2a1a" />}
                  {data.houseCount >= 8 && data.houseCount < 14 && <Icon Comp={Building} x={x} y={y} size={hexSize * 0.45} color="#3b2a1a" />}
                </g>
            );
          })}

          {overlayCells.map(([x, y], i) => (
              <polygon
                  key={`overlay-${i}`}
                  points={hexPoints(x, y, HEX_SIZE * RATIO - 1)}
                  fill="none"
                  stroke="#c9a227"
                  strokeWidth={HEX_SIZE * 0.12}
                  strokeDasharray={`${HEX_SIZE * 0.3} ${HEX_SIZE * 0.2}`}
                  pointerEvents="none"
              />
          ))}
        </svg>
      </div>
  );
}