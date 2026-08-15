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

// Zoom VISIVO: scala continua indipendente dal layer di grandezza (Locale/Regionale/
// Globale). Permette di dezoomare la mappa restando sullo stesso layer di editing.
// Range molto ampio perché, cambiando layer, il valore viene compensato automaticamente
// (vedi useMapState.setLayer) e può quindi assumere valori molto diversi da 1.
export const VISUAL_ZOOM_MIN = 0.001;
export const VISUAL_ZOOM_MAX = 200;
export const VISUAL_ZOOM_STEP = 1.25; // fattore moltiplicativo per click sui pulsanti +/-

// Soglie per le icone di villaggio/città, come DENSITÀ (quota di celle Locale con una
// casa) invece che conteggio assoluto: così funzionano correttamente a ogni livello di
// aggregazione, non solo a quello per cui erano state tarate.
export const VILLAGE_DENSITY_THRESHOLD = 0.08; // 8%
export const CITY_DENSITY_THRESHOLD = 0.12; // 12%

// Raggio del "mondo" (in celle Locale, distanza cubica dall'origine). Oltre questo limite
// la mappa non esiste: le celle vengono mostrate come area vuota invece che come terreno,
// così è chiaro se hai raggiunto il bordo della mappa invece che un rallentamento.
// Modificabile: aumentalo se ti serve una mappa più grande.
export const WORLD_RADIUS = 600;

export const TERRAINS: Record<TerrainType, { label: string; color: string }> = {
  pianura: { label: "Pianura", color: "#c9cf7a" },
  foresta: { label: "Foresta", color: "#4f7942" },
  montagna: { label: "Montagna", color: "#8b7d6b" },
  deserto: { label: "Deserto", color: "#e0c068" },
  acqua: { label: "Acqua", color: "#5b8fb0" },
};