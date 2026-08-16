import type { TerrainType, MapLevel } from "../types/map";

export const HEX_SIZE = 32;
export const RATIO = 10;
export const LEVELS: MapLevel[] = ["locale", "regionale", "globale"];

export const LEVEL_RATIOS: Record<MapLevel, number> = {
  locale: 1,
  regionale: RATIO,
  globale: RATIO * RATIO,
};

export const VIEWPORT_PX = 680;

export const VISUAL_ZOOM_MIN = 0.001;
export const VISUAL_ZOOM_MAX = 200;
export const VISUAL_ZOOM_STEP = 1.25;

export const MIN_HEX_SIZE_PX = 5;

export const VILLAGE_DENSITY_THRESHOLD = 0.08;
export const CITY_DENSITY_THRESHOLD = 0.12;

export const WORLD_RADIUS = 600;

export const TERRAINS: Record<TerrainType, { label: string; color: string }> = {
  pianura: { label: "Pianura", color: "#c9cf7a" },
  foresta: { label: "Foresta", color: "#4f7942" },
  montagna: { label: "Montagna", color: "#8b7d6b" },
  deserto: { label: "Deserto", color: "#e0c068" },
  acqua: { label: "Acqua", color: "#5b8fb0" },
};