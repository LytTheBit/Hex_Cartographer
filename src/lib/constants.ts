import type { TerrainType, MapLevel } from "../types/map";

// Dimensione in pixel di un esagono Locale. Ai livelli superiori si usa HEX_SIZE * ratio.
export const HEX_SIZE = 32;

// Rapporto di scala tra un livello e il successivo (~diametro in celle, come richiesto: ~10/11).
export const RATIO = 10;

export const LEVELS: MapLevel[] = ["locale", "regionale", "globale"];

// Rapporto ASSOLUTO rispetto al livello Locale (non incrementale): comodo perché permette
// di aggregare/dipingere in blocco direttamente dalle celle Locale, senza passaggi intermedi.
export const LEVEL_RATIOS: Record<MapLevel, number> = {
  locale: 1,
  regionale: RATIO,
  globale: RATIO * RATIO,
};

// Dimensione (larghezza = altezza) del canvas della mappa, in pixel. Fissa, indipendente
// dalle celle generate: sono le celle a riempire questo rettangolo, non viceversa.
export const VIEWPORT_PX = 680;

export const TERRAINS: Record<TerrainType, { label: string; color: string }> = {
  pianura: { label: "Pianura", color: "#c9cf7a" },
  foresta: { label: "Foresta", color: "#4f7942" },
  montagna: { label: "Montagna", color: "#8b7d6b" },
  deserto: { label: "Deserto", color: "#e0c068" },
  acqua: { label: "Acqua", color: "#5b8fb0" },
};