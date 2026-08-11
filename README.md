# Cartografo — Editor di mappe esagonali

Prototipo di editor per mappe a griglia esagonale con supporto a più livelli di dettaglio
(Locale → Regionale → Globale), pensato come base per un tool di worldbuilding.

## Stack

- **Vite + React + TypeScript** — build veloce, tipizzazione delle coordinate esagonali
- **lucide-react** — icone vettoriali (case, edifici, fiumi, terreno)

## Aprire il progetto in WebStorm

1. `File → Open...` e seleziona la cartella `hex-cartografo`
2. WebStorm rileva automaticamente `package.json` — ti chiederà se vuoi installare le dipendenze,
   oppure apri il terminale integrato e lancia:
   ```bash
   npm install
   ```
3. Per avviare il server di sviluppo:
   ```bash
   npm run dev
   ```
   e apri l'URL mostrato (di solito `http://localhost:5173`).
4. Per il "Run" da WebStorm: crea una configurazione **npm** che punta allo script `dev`
   (WebStorm di solito la propone da solo cliccando sulla freccina verde accanto allo script
   in `package.json`).

## Struttura del progetto

```
src/
  types/map.ts          Tipi condivisi (Tile, TerrainType, MapLevel, ...)
  lib/
    constants.ts         Costanti di configurazione (dimensioni, RATIO, colori terreni)
    hex/
      coordinates.ts      Matematica delle coordinate assiali/cubiche (conversioni, hex rounding)
      grid.ts              Generazione della griglia esagonale
      aggregation.ts       Logica di aggregazione LOD (Locale -> Regionale -> Globale)
      rivers.ts            Calcolo dei segmenti di fiume tra tile connessi
  state/
    useMapState.ts        Hook con lo stato della mappa (tiles, tool selezionato, livello attivo)
  components/
    Toolbar/               Selettore terreno/elementi/livello
    HexGrid/                Rendering SVG della griglia (tutti e 3 i livelli)
    icons/Icon.tsx          Helper per posizionare icone lucide-react dentro l'SVG
  App.tsx                  Composizione dell'app
  main.tsx                 Entry point
```

## Stato attuale

- Livello **Locale**: editabile — dipingi terreno, piazza fiumi/case
- Livelli **Regionale** e **Globale**: sola anteprima, calcolati aggregando il livello Locale
  con un algoritmo di "hex rounding" su coordinate cubiche (rapporto configurabile via `RATIO`
  in `lib/constants.ts`, attualmente 10)
- I fiumi collegano con una linea ogni tile-fiume al vicino che sia anch'esso fiume o un tile Acqua

## Prossimi passi pianificati

1. **Navigazione drill-down**: invece di una griglia Locale unica e fissa, permettere di
   "entrare" in un esagono Regionale/Globale specifico per editarne la porzione Locale.
   Necessario per scalare a un mondo vero (l'attuale griglia flat da ~900 celle è solo dimostrativa).
2. **Fiumi edge-based**: passare da "fiume booleano per esagono" a un modello dove il fiume
   specifica da quali lati dell'esagono entra/esce, per tracciati più naturali (vedi TODO in
   `lib/hex/rivers.ts`).
3. **Bordo/overlay griglia superiore**: opzione attivabile per vedere, mentre si è a livello
   Locale, i confini della griglia Regionale sovrapposti (per capire visivamente come si
   raggruppano le celle).
4. Persistenza (salvataggio/caricamento mappa), nuove feature (strade, campi).
