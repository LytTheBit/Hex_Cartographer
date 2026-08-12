import { useCallback, useMemo, useState } from "react";
import type { Path, MapLevel, Tile, TileMap, TerrainType } from "../types/map";
import { tileKey } from "../lib/hex/grid";
import { EDGE_DIRECTIONS, oppositeEdge } from "../lib/hex/coordinates";
import { pathKey } from "../lib/hex/aggregation";
import { GRID_RADIUS, LEVELS } from "../lib/constants";

export type Tool =
    | { type: "terrain"; value: TerrainType }
    | { type: "feature"; value: "casa" }
    | { type: "river" }
    | { type: "erase" };

const DEFAULT_TILE: Tile = { terrain: "pianura", features: {} };

function isInsideGrid(q: number, r: number): boolean {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) <= GRID_RADIUS;
}

export function useMapState() {
  const [path, setPath] = useState<Path>([]);
  const [tilesStore, setTilesStore] = useState<Record<string, TileMap>>({});
  const [tool, setTool] = useState<Tool>({ type: "terrain", value: "pianura" });

  const level: MapLevel = LEVELS[path.length];
  const isLocale = level === "locale";
  const currentKey = useMemo(() => pathKey(path), [path]);

  /** Entra nella cella (q, r) della griglia corrente, scendendo di un livello. */
  const enter = useCallback((q: number, r: number) => {
    setPath((prev) => (prev.length < LEVELS.length - 1 ? [...prev, { q, r }] : prev));
  }, []);

  /** Torna al livello con path.length === depth (0 = Globale). */
  const goToDepth = useCallback((depth: number) => {
    setPath((prev) => prev.slice(0, depth));
  }, []);

  const getTile = useCallback(
      (q: number, r: number): Tile => tilesStore[currentKey]?.[tileKey(q, r)] ?? DEFAULT_TILE,
      [tilesStore, currentKey]
  );

  /** Dipinge la cella (q, r) della griglia Locale attualmente aperta: terreno, casa, gomma. */
  const applyTool = useCallback(
      (q: number, r: number) => {
        if (!isLocale) return;
        const cellKey = tileKey(q, r);
        setTilesStore((prev) => {
          const currentMap = prev[currentKey] ?? {};
          const current = currentMap[cellKey] ?? DEFAULT_TILE;
          let next: Tile;
          if (tool.type === "terrain") next = { ...current, terrain: tool.value };
          else if (tool.type === "feature") next = { ...current, features: { ...current.features, casa: !current.features.casa } };
          else if (tool.type === "erase") next = { terrain: "pianura", features: {} };
          else return prev; // tool "river": gestito da toggleRiverEdge, non da qui
          return { ...prev, [currentKey]: { ...currentMap, [cellKey]: next } };
        });
      },
      [tool, isLocale, currentKey]
  );

  /**
   * Attiva/disattiva un segmento di fiume sul lato `edge` della cella (q, r), e allo stesso
   * tempo il lato speculare sulla cella vicina (se dentro i confini della griglia), così i
   * due lati restano sempre sincronizzati e il fiume è sempre visivamente continuo.
   */
  const toggleRiverEdge = useCallback(
      (q: number, r: number, edge: number) => {
        if (!isLocale) return;
        const dir = EDGE_DIRECTIONS[edge];
        const nq = q + dir.q;
        const nr = r + dir.r;
        const neighborInBounds = isInsideGrid(nq, nr);
        const oppEdge = oppositeEdge(edge);

        setTilesStore((prev) => {
          const currentMap = prev[currentKey] ?? {};

          const toggled = (map: TileMap, tq: number, tr: number, e: number): TileMap => {
            const key = tileKey(tq, tr);
            const tile = map[key] ?? DEFAULT_TILE;
            const edges = tile.features.fiume ?? [];
            const nextEdges = edges.includes(e) ? edges.filter((x) => x !== e) : [...edges, e];
            return { ...map, [key]: { ...tile, features: { ...tile.features, fiume: nextEdges } } };
          };

          let nextMap = toggled(currentMap, q, r, edge);
          if (neighborInBounds) nextMap = toggled(nextMap, nq, nr, oppEdge);

          return { ...prev, [currentKey]: nextMap };
        });
      },
      [isLocale, currentKey]
  );

  return { path, level, isLocale, enter, goToDepth, getTile, applyTool, toggleRiverEdge, tool, setTool, tilesStore };
}