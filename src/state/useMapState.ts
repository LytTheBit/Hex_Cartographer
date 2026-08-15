import { useCallback, useEffect, useState } from "react";
import type { AxialCoord, MapLevel, Tile, TileMap, TerrainType } from "../types/map";
import { tileKey } from "../lib/hex/grid";
import { EDGE_DIRECTIONS, oppositeEdge } from "../lib/hex/coordinates";
import { getMacroChildren } from "../lib/hex/aggregation";
import { LEVELS, LEVEL_RATIOS, VISUAL_ZOOM_MAX, VISUAL_ZOOM_MIN, VISUAL_ZOOM_STEP } from "../lib/constants";

export type Tool =
    | { type: "terrain"; value: TerrainType }
    | { type: "feature"; value: "casa" | "strada" }
    | { type: "river" }
    | { type: "erase" };

const DEFAULT_TILE: Tile = { terrain: "pianura", features: {} };

function clampVisualZoom(z: number): number {
    return Math.min(VISUAL_ZOOM_MAX, Math.max(VISUAL_ZOOM_MIN, z));
}

export function useMapState() {
    const [tilesStore, setTilesStore] = useState<TileMap>({});
    const [tool, setTool] = useState<Tool>({ type: "terrain", value: "pianura" });
    const [zoomIndex, setZoomIndexState] = useState(0);
    const [visualZoom, setVisualZoomState] = useState(1);
    const [compensateOnLayerChange, setCompensateOnLayerChange] = useState(true);
    const [camera, setCamera] = useState<AxialCoord>({ q: 0, r: 0 });
    const [showOverlay, setShowOverlay] = useState(false);

    const level: MapLevel = LEVELS[zoomIndex];
    const isLocale = level === "locale";
    const ratio = LEVEL_RATIOS[level];

    useEffect(() => {
        if (!isLocale && (tool.type === "river" || tool.type === "feature")) {
            setTool({ type: "terrain", value: "pianura" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLocale]);

    /**
     * Cambia layer di grandezza (0=Locale, 1=Regionale, 2=Globale). Se `compensateOnLayerChange`
     * è attivo (default), compensa lo zoom visivo per il salto di `ratio` tra i due layer, così
     * la dimensione APPARENTE degli esagoni resta la stessa subito dopo il cambio — l'esagono
     * Regionale in cui entri appare grande esattamente quanto la sua anteprima nell'overlay a
     * livello Locale. Disattivabile con toggleCompensateOnLayerChange, se preferisci che lo
     * zoom visivo resti invariato (e quindi la dimensione apparente cambi) al cambio layer.
     */
    const setLayer = useCallback(
        (index: number) => {
            const clamped = Math.min(LEVELS.length - 1, Math.max(0, index));
            if (compensateOnLayerChange) {
                const oldRatio = LEVEL_RATIOS[level];
                const newRatio = LEVEL_RATIOS[LEVELS[clamped]];
                setVisualZoomState((z) => clampVisualZoom((z * oldRatio) / newRatio));
            }
            setZoomIndexState(clamped);
        },
        [level, compensateOnLayerChange]
    );

    const toggleCompensateOnLayerChange = useCallback(() => {
        setCompensateOnLayerChange((v) => !v);
    }, []);

    const zoomVisualBy = useCallback((factor: number) => {
        setVisualZoomState((z) => clampVisualZoom(z * factor));
    }, []);

    const zoomVisualIn = useCallback(() => zoomVisualBy(VISUAL_ZOOM_STEP), [zoomVisualBy]);
    const zoomVisualOut = useCallback(() => zoomVisualBy(1 / VISUAL_ZOOM_STEP), [zoomVisualBy]);

    const panBy = useCallback((dq: number, dr: number) => {
        setCamera((prev) => ({ q: prev.q + dq, r: prev.r + dr }));
    }, []);

    const getTile = useCallback(
        (q: number, r: number): Tile => tilesStore[tileKey(q, r)] ?? DEFAULT_TILE,
        [tilesStore]
    );

    const paintLocale = useCallback(
        (q: number, r: number) => {
            const key = tileKey(q, r);
            setTilesStore((prev) => {
                const current = prev[key] ?? DEFAULT_TILE;
                let next: Tile;
                if (tool.type === "terrain") next = { ...current, terrain: tool.value };
                else if (tool.type === "feature") {
                    const key2 = tool.value; // "casa" | "strada"
                    next = { ...current, features: { ...current.features, [key2]: !current.features[key2] } };
                } else if (tool.type === "erase") next = { terrain: "pianura", features: {} };
                else return prev;
                return { ...prev, [key]: next };
            });
        },
        [tool]
    );

    const paintMacro = useCallback(
        (Q: number, R: number, macroRatio: number) => {
            if (tool.type !== "terrain" && tool.type !== "erase") return;
            const children = getMacroChildren(Q, R, macroRatio);
            setTilesStore((prev) => {
                const next = { ...prev };
                children.forEach(({ q, r }) => {
                    const key = tileKey(q, r);
                    const current = next[key] ?? DEFAULT_TILE;
                    next[key] = tool.type === "terrain" ? { ...current, terrain: tool.value } : { terrain: "pianura", features: {} };
                });
                return next;
            });
        },
        [tool]
    );

    const handleCellClick = useCallback(
        (q: number, r: number) => {
            if (isLocale) paintLocale(q, r);
            else paintMacro(q, r, ratio);
        },
        [isLocale, ratio, paintLocale, paintMacro]
    );

    const toggleRiverEdge = useCallback(
        (q: number, r: number, edge: number) => {
            if (!isLocale) return;
            const dir = EDGE_DIRECTIONS[edge];
            const nq = q + dir.q;
            const nr = r + dir.r;
            const oppEdge = oppositeEdge(edge);

            setTilesStore((prev) => {
                const toggled = (map: TileMap, tq: number, tr: number, e: number): TileMap => {
                    const key = tileKey(tq, tr);
                    const tile = map[key] ?? DEFAULT_TILE;
                    const edges = tile.features.fiume ?? [];
                    const nextEdges = edges.includes(e) ? edges.filter((x) => x !== e) : [...edges, e];
                    return { ...map, [key]: { ...tile, features: { ...tile.features, fiume: nextEdges } } };
                };
                let next = toggled(prev, q, r, edge);
                next = toggled(next, nq, nr, oppEdge);
                return next;
            });
        },
        [isLocale]
    );

    return {
        tilesStore,
        tool,
        setTool,
        level,
        zoomIndex,
        setLayer,
        isLocale,
        ratio,
        camera,
        panBy,
        visualZoom,
        zoomVisualIn,
        zoomVisualOut,
        zoomVisualBy,
        compensateOnLayerChange,
        toggleCompensateOnLayerChange,
        showOverlay,
        setShowOverlay,
        getTile,
        handleCellClick,
        toggleRiverEdge,
    };
}