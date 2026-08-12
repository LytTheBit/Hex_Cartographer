import { useMapState } from "./state/useMapState";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { Breadcrumb } from "./components/Toolbar/Breadcrumb";
import { HexGrid } from "./components/HexGrid/HexGrid";
import "./App.css";

export default function App() {
    const { path, level, isLocale, enter, goToDepth, getTile, applyTool, toggleRiverEdge, tool, setTool, tilesStore } =
        useMapState();

    const hint = !isLocale
        ? "Clicca un esagono per entrarci ed esplorare il suo dettaglio."
        : tool.type === "river"
            ? "Clicca vicino al lato di un esagono per tracciare un segmento di fiume in quella direzione: il lato speculare sull'esagono adiacente si attiva automaticamente."
            : "Dipingi terreni e piazza case. Usa il breadcrumb qui sopra per uscire da questa porzione di mappa.";

    return (
        <div className="app">
            <h1 className="app-title">Cartografo</h1>
            <p className="app-subtitle">Editor di mappe esagonali</p>

            <Breadcrumb path={path} onNavigate={goToDepth} />

            <Toolbar tool={tool} setTool={setTool} disabled={!isLocale} />

            <HexGrid
                level={level}
                path={path}
                tilesStore={tilesStore}
                getTile={getTile}
                tool={tool}
                onEnter={enter}
                onPaint={applyTool}
                onRiverEdge={toggleRiverEdge}
            />

            <p className="app-hint">{hint}</p>
        </div>
    );
}
