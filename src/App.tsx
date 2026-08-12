import { useMapState } from "./state/useMapState";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { ZoomControls } from "./components/Toolbar/ZoomControls";
import { HexGrid } from "./components/HexGrid/HexGrid";
import { LEVELS } from "./lib/constants";
import "./App.css";

export default function App() {
    const {
        tilesStore,
        tool,
        setTool,
        level,
        zoomIndex,
        isLocale,
        ratio,
        camera,
        panBy,
        zoomIn,
        zoomOut,
        showOverlay,
        setShowOverlay,
        getTile,
        handleCellClick,
        toggleRiverEdge,
    } = useMapState();

    const hint = !isLocale
        ? "Clicca un esagono per dipingere il terreno di tutta l'area sottostante. Trascina per spostarti, rotella per zoomare."
        : tool.type === "river"
            ? "Clicca vicino al lato di un esagono per tracciare un segmento di fiume in quella direzione."
            : "Dipingi terreni e piazza case. Trascina per spostarti, rotella (o i pulsanti sopra) per zoomare.";

    return (
        <div className="app">
            <h1 className="app-title">Cartografo</h1>
            <p className="app-subtitle">Editor di mappe esagonali</p>

            <ZoomControls
                level={level}
                zoomIndex={zoomIndex}
                maxZoomIndex={LEVELS.length - 1}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                showOverlay={showOverlay}
                onToggleOverlay={() => setShowOverlay((v) => !v)}
                isLocale={isLocale}
            />

            <Toolbar tool={tool} setTool={setTool} isLocale={isLocale} />

            <HexGrid
                level={level}
                ratio={ratio}
                camera={camera}
                tilesStore={tilesStore}
                getTile={getTile}
                tool={tool}
                showOverlay={showOverlay}
                onCellClick={handleCellClick}
                onRiverEdge={toggleRiverEdge}
                onPanBy={panBy}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
            />

            <p className="app-hint">{hint}</p>
        </div>
    );
}