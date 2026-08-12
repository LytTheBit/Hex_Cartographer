import { Home, Waves } from "lucide-react";
import { TERRAINS } from "../../lib/constants";
import type { Tool } from "../../state/useMapState";
import type { TerrainType } from "../../types/map";
import "./Toolbar.css";

interface ToolbarProps {
    tool: Tool;
    setTool: (t: Tool) => void;
    disabled: boolean;
}

export function Toolbar({ tool, setTool, disabled }: ToolbarProps) {
    return (
        <div className="toolbar">
            <div className="toolbar-group">
                <span className="toolbar-label">Terreno</span>
                {(Object.entries(TERRAINS) as [TerrainType, (typeof TERRAINS)[TerrainType]][]).map(([key, t]) => (
                    <button
                        key={key}
                        className="swatch-btn"
                        disabled={disabled}
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
                    disabled={disabled}
                    style={{ borderColor: tool.type === "river" ? "#c9a227" : "transparent" }}
                    title="Fiume"
                    onClick={() => setTool({ type: "river" })}
                >
                    <Waves size={16} color="#7fb3d9" />
                </button>
                <button
                    className="icon-btn"
                    disabled={disabled}
                    style={{ borderColor: tool.type === "feature" && tool.value === "casa" ? "#c9a227" : "transparent" }}
                    title="Casa"
                    onClick={() => setTool({ type: "feature", value: "casa" })}
                >
                    <Home size={16} color="#e8e2d0" />
                </button>
                <button
                    className="icon-btn"
                    disabled={disabled}
                    style={{ borderColor: tool.type === "erase" ? "#c9a227" : "transparent" }}
                    title="Gomma"
                    onClick={() => setTool({ type: "erase" })}
                >
                    ✕
                </button>
            </div>

            {disabled && <span className="toolbar-hint">Entra in un esagono fino al livello Locale per dipingere</span>}
        </div>
    );
}