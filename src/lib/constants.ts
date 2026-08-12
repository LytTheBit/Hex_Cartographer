import type { TerrainType, MapLevel } from "../types/map";

// Dimensione in pixel di un esagono: ogni livello (Globale, Regionale, Locale) mostra
// sempre una griglia della STESSA forma (stesso raggio), solo con contenuto diverso —
// per questo un solo HEX_SIZE basta per tutti e tre.
export const HEX_SIZE = 32;

// Raggio (in numero di celle) di ogni griglia esagonale mostrata a schermo.
// Diametro = 2*GRID_RADIUS + 1 = 11 celle, per rispettare il rapporto ~10/11 richiesto:
// ogni esagono "genitore", una volta aperto, mostra una griglia di 11 celle di diametro.
export const GRID_RADIUS = 5;

export const LEVELS: MapLevel[] = ["globale", "regionale", "locale"];

export const TERRAINS: Record<TerrainType, { label: string; color: string }> = {
  pianura: { label: "Pianura", color: "#c9cf7a" },
  foresta: { label: "Foresta", color: "#4f7942" },
  montagna: { label: "Montagna", color: "#8b7d6b" },
  deserto: { label: "Deserto", color: "#e0c068" },
  acqua: { label: "Acqua", color: "#5b8fb0" },
};