import { useMemo, useRef } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { Building, Building2, Home, Mountain, Trees, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CITY_DENSITY_THRESHOLD, HEX_SIZE, MIN_HEX_SIZE_PX, RATIO, TERRAINS, VIEWPORT_PX, VILLAGE_DENSITY_THRESHOLD, WORLD_RADIUS } from "../../lib/constants";
import { cubeDistance, generateHexRect, tileKey } from "../../lib/hex/grid";
import { axialRound, axialToParent, axialToPixel, EDGE_DIRECTIONS, hexCorner, hexPoints, pixelToAxial } from "../../lib/hex/coordinates";
import { aggregateMacroCellFast, bucketPaintedTilesByMacro, type ClusterData } from "../../lib/hex/aggregation";
import { computeRiverPaths } from "../../lib/hex/rivers";
import { computeRoadPaths } from "../../lib/hex/roads";
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
  onRiverStart: (q: number, r: number) => void;
  onPanBy: (dq: number, dr: number) => void;
  onZoomVisualBy: (factor: number) => void;
}

type DragState =
    | { mode: "pan"; pointerId: number; lastX: number; lastY: number }
    | { mode: "paint"; pointerId: number; lastKey: string; lastQ: number; lastR: number };

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
                          onRiverStart,
                          onPanBy,
                          onZoomVisualBy,
                        }: HexGridProps) {
  const isLocale = level === "locale";
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<DragState | null>(null);

  const pixelBaseSize = HEX_SIZE * visualZoom;
  const hexSize = Math.max(MIN_HEX_SIZE_PX, pixelBaseSize * ratio);
  const clampedPixelBaseSize = hexSize / ratio;

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

  const [cameraPixelX, cameraPixelY] = axialToPixel(camera.q, camera.r, clampedPixelBaseSize);
  const minX = cameraPixelX - VIEWPORT_PX / 2;
  const minY = cameraPixelY - VIEWPORT_PX / 2;

  const riverPaths = useMemo(
      () => (isLocale ? computeRiverPaths(cells, getTile, clampedPixelBaseSize) : []),
      [isLocale, cells, getTile, clampedPixelBaseSize]
  );

  const roadPaths = useMemo(
      () => (isLocale ? computeRoadPaths(cells, getTile, clampedPixelBaseSize) : []),
      [isLocale, cells, getTile, clampedPixelBaseSize]
  );

  const bridgePoints = useMemo(() => {
    if (!isLocale) return [];
    return cells
        .filter(({ q, r }) => {
          const t = getTile(q, r);
          return (t.features.fiume?.length ?? 0) > 0 && t.features.strada;
        })
        .map(({ q, r }) => axialToPixel(q, r, clampedPixelBaseSize));
  }, [isLocale, cells, getTile, clampedPixelBaseSize]);

  // Lone river markers: a tile explicitly marked as a river source but not (yet) connected
  // to any neighbor. Rendered as a small dot instead of a line pointing nowhere in particular.
  const riverDots = useMemo(() => {
    if (!isLocale) return [];
    return cells
        .filter(({ q, r }) => getTile(q, r).features.fiume?.length === 0)
        .map(({ q, r }) => axialToPixel(q, r, clampedPixelBaseSize));
  }, [isLocale, cells, getTile, clampedPixelBaseSize]);

  const clusterData = useMemo(() => {
    if (isLocale) return {} as Record<string, ClusterData>;
    const buckets = bucketPaintedTilesByMacro(tilesStore, ratio);
    const result: Record<string, ClusterData> = {};
    cells.forEach(({ q, r }) => {
      const key = tileKey(q, r);
      result[key] = aggregateMacroCellFast(key, ratio, buckets);
    });
    return result;
  }, [isLocale, cells, ratio, tilesStore]);

  // Dedup by EXACT macro-cell coordinate pairs (integers), not by rounded pixel position.
  // Rounded pixels caused a subtle floating-point bug: the same physical corner, computed
  // independently from two neighboring hexes via cos/sin, can differ by a tiny epsilon that
  // occasionally straddles a rounding boundary, so the two "identical" edges got different
  // dedup keys and were BOTH drawn, slightly offset -> a wavy, doubled-looking dashed line.
  // Coordinate pairs have no such ambiguity.
  const overlaySegments = useMemo(() => {
    if (!showOverlay || level === "globale") return [];
    const macroCoords = new Map<string, [number, number]>();
    cells.forEach(({ q, r }) => {
      const [Q, R] = axialToParent(q, r, RATIO);
      macroCoords.set(tileKey(Q, R), [Q, R]);
    });

    const seenEdges = new Set<string>();
    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    macroCoords.forEach(([Q, R], key) => {
      const [cx, cy] = axialToPixel(Q, R, hexSize * RATIO);
      for (let i = 0; i < 6; i++) {
        const dir = EDGE_DIRECTIONS[i];
        const neighborKey = tileKey(Q + dir.q, R + dir.r);
        const edgeKey = key < neighborKey ? `${key}|${neighborKey}` : `${neighborKey}|${key}`;
        if (seenEdges.has(edgeKey)) continue;
        seenEdges.add(edgeKey);
        const [x1, y1] = hexCorner(cx, cy, hexSize * RATIO - 1, i);
        const [x2, y2] = hexCorner(cx, cy, hexSize * RATIO - 1, (i + 1) % 6);
        segments.push({ x1, y1, x2, y2 });
      }
    });
    return segments;
  }, [showOverlay, level, cells, hexSize]);

  interface HexIcon {
    Comp: LucideIcon;
    size: number;
    color: string;
  }

  interface HexRenderData {
    key: string;
    x: number;
    y: number;
    fill: string;
    isVoid: boolean;
    icon: HexIcon | null;
  }

  // Precomputed once per hex: separates "what fill goes on the polygon" from "what icon (if
  // any) sits on top", so the two can be rendered in different SVG layers (see below) — the
  // icon layer needs to sit ABOVE rivers/roads, while the polygon fill needs to sit BELOW them.
  const hexRenderData: HexRenderData[] = useMemo(
      () =>
          positions.map(({ q, r, x, y }) => {
            const key = tileKey(q, r);

            if (isLocale) {
              if (cubeDistance(q, r) > WORLD_RADIUS) return { key, x, y, fill: "#11141a", isVoid: true, icon: null };
              const tile = getTile(q, r);
              const TerrainIconComp = TERRAIN_ICONS[tile.terrain];
              const icon: HexIcon | null = tile.features.casa
                  ? { Comp: Home, size: hexSize * 0.55, color: "#3b2a1a" }
                  : TerrainIconComp
                      ? { Comp: TerrainIconComp, size: hexSize * 0.5, color: "rgba(0,0,0,0.35)" }
                      : null;
              return { key, x, y, fill: TERRAINS[tile.terrain].color, isVoid: false, icon };
            }

            if (cubeDistance(q * ratio, r * ratio) > WORLD_RADIUS) return { key, x, y, fill: "#11141a", isVoid: true, icon: null };
            const data = clusterData[key];
            const TerrainIconComp = TERRAIN_ICONS[data.terrain];
            const isCity = data.houseDensity >= CITY_DENSITY_THRESHOLD;
            const isVillage = !isCity && data.houseDensity >= VILLAGE_DENSITY_THRESHOLD;
            const icon: HexIcon | null = isCity
                ? { Comp: Building2, size: hexSize * 0.45, color: "#3b2a1a" }
                : isVillage
                    ? { Comp: Building, size: hexSize * 0.45, color: "#3b2a1a" }
                    : TerrainIconComp
                        ? { Comp: TerrainIconComp, size: hexSize * 0.4, color: "rgba(0,0,0,0.35)" }
                        : null;
            return { key, x, y, fill: TERRAINS[data.terrain].color, isVoid: false, icon };
          }),
      [positions, isLocale, ratio, getTile, clusterData, hexSize]
  );

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

  const hexAtSvgPoint = (x: number, y: number): { q: number; r: number } => {
    const qf = x / (1.5 * hexSize);
    const rf = y / (hexSize * Math.sqrt(3)) - qf / 2;
    const [q, r] = axialRound(qf, rf);
    return { q, r };
  };

  const applyPaint = (q: number, r: number, fromCell: { q: number; r: number } | null) => {
    if (isLocale && tool.type === "river") {
      if (fromCell) {
        const dq = q - fromCell.q;
        const dr = r - fromCell.r;
        const edgeIdx = EDGE_DIRECTIONS.findIndex((d) => d.q === dq && d.r === dr);
        if (edgeIdx !== -1) onRiverEdge(fromCell.q, fromCell.r, edgeIdx);
        return;
      }
      onRiverStart(q, r);
      return;
    }
    onCellClick(q, r);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button === 2) {
      dragState.current = { mode: "pan", pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
      svgRef.current?.setPointerCapture(event.pointerId);
      return;
    }
    if (event.button !== 0) return;

    const { x, y } = toSvgPoint(event.clientX, event.clientY);
    const { q, r } = hexAtSvgPoint(x, y);
    dragState.current = { mode: "paint", pointerId: event.pointerId, lastKey: tileKey(q, r), lastQ: q, lastR: r };
    svgRef.current?.setPointerCapture(event.pointerId);
    applyPaint(q, r, null);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current;
    if (!drag) return;

    if (drag.mode === "pan") {
      const start = toSvgPoint(drag.lastX, drag.lastY);
      const current = toSvgPoint(event.clientX, event.clientY);
      const [dq, dr] = pixelToAxial(current.x - start.x, current.y - start.y, clampedPixelBaseSize);
      onPanBy(-dq, -dr);
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      return;
    }

    const { x, y } = toSvgPoint(event.clientX, event.clientY);
    const { q, r } = hexAtSvgPoint(x, y);
    const key = tileKey(q, r);
    if (key !== drag.lastKey) {
      applyPaint(q, r, { q: drag.lastQ, r: drag.lastR });
      drag.lastKey = key;
      drag.lastQ = q;
      drag.lastR = r;
    }
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (dragState.current) svgRef.current?.releasePointerCapture(event.pointerId);
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
            onContextMenu={(e) => e.preventDefault()}
            className="hex-svg"
        >
          {hexRenderData.map((d) => (
              <polygon
                  key={d.key}
                  points={hexPoints(d.x, d.y, hexSize - 1)}
                  fill={d.fill}
                  stroke={d.isVoid ? "#2a2f37" : "#5c4a2a"}
                  strokeWidth={isLocale ? 0.6 : 0.8}
                  className={!d.isVoid ? (isLocale && tool.type === "river" ? "hex-clickable hex-river-cursor" : "hex-clickable") : undefined}
              />
          ))}

          {roadPaths.map((d, i) => (
              <path key={`road-${i}`} d={d} fill="none" stroke="#c47a2c" strokeWidth={clampedPixelBaseSize * 0.16} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {riverPaths.map((d, i) => (
              <path key={`river-${i}`} d={d} fill="none" stroke="#2f6fa8" strokeWidth={clampedPixelBaseSize * 0.22} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {bridgePoints.map(([bx, by], i) => (
              <circle key={`bridge-${i}`} cx={bx} cy={by} r={clampedPixelBaseSize * 0.16} fill="#c0392b" stroke="#7a231c" strokeWidth={clampedPixelBaseSize * 0.04} />
          ))}
          {riverDots.map(([dx, dy], i) => (
              <circle key={`riverdot-${i}`} cx={dx} cy={dy} r={clampedPixelBaseSize * 0.12} fill="#2f6fa8" />
          ))}

          {hexRenderData.map(
              (d) => d.icon && <Icon key={`icon-${d.key}`} Comp={d.icon.Comp} x={d.x} y={d.y} size={d.icon.size} color={d.icon.color} />
          )}

          {overlaySegments.map((s, i) => (
              <line
                  key={`overlay-${i}`}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke="#c9a227"
                  strokeWidth={clampedPixelBaseSize * 0.12}
                  strokeDasharray={`${clampedPixelBaseSize * 0.3} ${clampedPixelBaseSize * 0.2}`}
                  strokeLinecap="round"
                  pointerEvents="none"
              />
          ))}
        </svg>
      </div>
  );
}