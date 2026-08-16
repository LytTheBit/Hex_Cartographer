import { useMapState } from "./state/useMapState";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { ZoomControls } from "./components/Toolbar/ZoomControls";
import { SaveLoadControls } from "./components/Toolbar/SaveLoadControls";
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
        compensateOnLayerChange,
        toggleCompensateOnLayerChange,
        showOverlay,
        setShowOverlay,
        getTile,
        handleCellClick,
        setRiverEdge,
        exportMap,
        importMap,
    } = useMapState();

    const hint = !isLocale
        ? "Left-click (or drag) to paint the terrain of the whole area below. Right-drag to pan, wheel to zoom."
        : tool.type === "river"
            ? "Left-click near a hex's side to start a river; keep dragging to extend it."
            : "Paint terrain and place houses/roads; drag to paint several hexes at once. Right-drag to pan, wheel to zoom.";

    return (
        <div className="app">
            <h1 className="app-title">Cartografo</h1>
            <p className="app-subtitle">Editor di mappe esagonali</p>

            <div className="app-toolbar-row">
                <ZoomControls
                    zoomIndex={zoomIndex}
                    onSetLayer={setLayer}
                    onZoomVisualIn={zoomVisualIn}
                    onZoomVisualOut={zoomVisualOut}
                    showOverlay={showOverlay}
                    onToggleOverlay={() => setShowOverlay((v) => !v)}
                    canShowOverlay={level !== "globale"}
                    compensateOnLayerChange={compensateOnLayerChange}
                    onToggleCompensate={toggleCompensateOnLayerChange}
                />
                <SaveLoadControls onExport={exportMap} onImport={importMap} />
            </div>

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
                onRiverEdge={setRiverEdge}
                onPanBy={panBy}
                onZoomVisualBy={zoomVisualBy}
            />

            <p className="app-hint">{hint}</p>
        </div>
    );
}