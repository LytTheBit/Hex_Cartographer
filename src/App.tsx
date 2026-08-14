import { useMapState } from "./state/useMapState";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { ZoomControls } from "./components/Toolbar/ZoomControls";
import { HexGrid } from "./components/HexGrid/HexGrid";
import "./App.css";

export default function App() {
    const {
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
        showOverlay,
        setShowOverlay,
        getTile,
        handleCellClick,
        toggleRiverEdge,
    } = useMapState();

    const hint = !isLocale
        ? "Clicca un esagono per dipingere il terreno di tutta l'area sottostante. Trascina per spostarti, rotella per lo zoom visivo."
        : tool.type === "river"
            ? "Clicca vicino al lato di un esagono per tracciare un segmento di fiume in quella direzione."
            : "Dipingi terreni e piazza case. Trascina per spostarti, rotella per lo zoom visivo.";

    return (
        <div className="app">
            <h1 className="app-title">Cartografo</h1>
            <p className="app-subtitle">Editor di mappe esagonali</p>

            <ZoomControls
                zoomIndex={zoomIndex}
                onSetLayer={setLayer}
                onZoomVisualIn={zoomVisualIn}
                onZoomVisualOut={zoomVisualOut}
                showOverlay={showOverlay}
                onToggleOverlay={() => setShowOverlay((v) => !v)}
                canShowOverlay={level !== "globale"}
            />

            <Toolbar tool={tool} setTool={setTool} isLocale={isLocale} />

            <HexGrid
                level={level}
                ratio={ratio}
                camera={camera}
                visualZoom={visualZoom}
                tilesStore={tilesStore}
                getTile={getTile}
                tool={tool}
                showOverlay={showOverlay}
                onCellClick={handleCellClick}
                onRiverEdge={toggleRiverEdge}
                onPanBy={panBy}
                onZoomVisualBy={zoomVisualBy}
            />

            <p className="app-hint">{hint}</p>
        </div>
    );
}