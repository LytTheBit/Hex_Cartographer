import { Home, Route, Waves } from "lucide-react";
import { TERRAINS } from "../../lib/constants";
import type { Tool } from "../../state/useMapState";
import type { TerrainType } from "../../types/map";
import "./Toolbar.css";

interface ToolbarProps {
    tool: Tool;
    setTool: (t: Tool) => void;
    isLocale: boolean;
}

export function Toolbar({ tool, setTool, isLocale }: ToolbarProps) {
    return (
        <div className="toolbar">
            <div className="toolbar-group">
                <span className="toolbar-label">Terreno</span>
                {(Object.entries(TERRAINS) as [TerrainType, (typeof TERRAINS)[TerrainType]][]).map(([key, t]) => (
                    <button
                        key={key}
                        className="swatch-btn"
                        style={{
                            backgroundColor: t.color,
                            borderColor: tool.type === "terrain" && tool.value === key ? "#c9a227" : "transparent",
                        }}
                        title={t.label}
                        onClick={() => setTool({ type: "terrain", value: key })}
                    />
                ))}
            </div>

            <div className="toolbar-group">
                <span className="toolbar-label">Elementi</span>
                <button
                    className="icon-btn"
                    disabled={!isLocale}
                    style={{ borderColor: tool.type === "river" ? "#c9a227" : "transparent" }}
                    title="Fiume (richiede zoom Locale)"
                    onClick={() => setTool({ type: "river" })}
                >
                    <Waves size={16} color="#7fb3d9" />
                </button>
                <button
                    className="icon-btn"
                    disabled={!isLocale}
                    style={{ borderColor: tool.type === "feature" && tool.value === "strada" ? "#c9a227" : "transparent" }}
                    title="Strada (richiede zoom Locale)"
                    onClick={() => setTool({ type: "feature", value: "strada" })}
                >
                    <Route size={16} color="#d98c3a" />
                </button>
                <button
                    className="icon-btn"
                    disabled={!isLocale}
                    style={{ borderColor: tool.type === "feature" && tool.value === "casa" ? "#c9a227" : "transparent" }}
                    title="Casa (richiede zoom Locale)"
                    onClick={() => setTool({ type: "feature", value: "casa" })}
                >
                    <Home size={16} color="#e8e2d0" />
                </button>
                <button
                    className="icon-btn"
                    style={{ borderColor: tool.type === "erase" ? "#c9a227" : "transparent" }}
                    title="Gomma"
                    onClick={() => setTool({ type: "erase" })}
                >
                    ✕
                </button>
            </div>

            {!isLocale && (
                <span className="toolbar-hint">A questo zoom il terreno si dipinge in blocco su tutta l'area visibile</span>
            )}
        </div>
    );
}