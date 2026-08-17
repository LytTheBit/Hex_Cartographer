import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Download, Layers, Link2, Link2Off, Minus, Plus, Upload } from "lucide-react";
import { LEVELS } from "../../lib/constants";
import "./ZoomControls.css";

interface ZoomControlsProps {
    zoomIndex: number;
    onSetLayer: (index: number) => void;
    onZoomVisualIn: () => void;
    onZoomVisualOut: () => void;
    showOverlay: boolean;
    onToggleOverlay: () => void;
    canShowOverlay: boolean;
    compensateOnLayerChange: boolean;
    onToggleCompensate: () => void;
    onExportMap: () => string;
    onImportMap: (json: string) => boolean;
}

export function ZoomControls({
                                 zoomIndex,
                                 onSetLayer,
                                 onZoomVisualIn,
                                 onZoomVisualOut,
                                 showOverlay,
                                 onToggleOverlay,
                                 canShowOverlay,
                                 compensateOnLayerChange,
                                 onToggleCompensate,
                                 onExportMap,
                                 onImportMap,
                             }: ZoomControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        const json = onExportMap();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hex-cartographer-map.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            const ok = onImportMap(text);
            if (!ok) alert("Impossibile leggere questo file: non sembra una mappa Hex Cartographer valida.");
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    return (
        <div className="zoom-controls">
            <div className="layer-switch">
                {LEVELS.map((lv, i) => (
                    <button
                        key={lv}
                        className="layer-btn"
                        style={{
                            backgroundColor: zoomIndex === i ? "#c9a227" : "transparent",
                            color: zoomIndex === i ? "#1b1f24" : "#e8e2d0",
                            fontWeight: zoomIndex === i ? 600 : 400,
                        }}
                        onClick={() => onSetLayer(i)}
                    >
                        {lv}
                    </button>
                ))}
                <button
                    className={compensateOnLayerChange ? "overlay-btn overlay-btn-active" : "overlay-btn"}
                    onClick={onToggleCompensate}
                    title={
                        compensateOnLayerChange
                            ? "Al cambio layer la dimensione apparente resta la stessa (clicca per disattivare)"
                            : "Al cambio layer lo zoom visivo resta invariato, la dimensione apparente cambia (clicca per attivare)"
                    }
                >
                    {compensateOnLayerChange ? <Link2 size={14} /> : <Link2Off size={14} />}
                </button>
            </div>

            <div className="visual-zoom">
                <button className="zoom-btn" onClick={onZoomVisualOut} title="Zoom visivo indietro (o rotella del mouse)">
                    <Minus size={16} />
                </button>
                <button className="zoom-btn" onClick={onZoomVisualIn} title="Zoom visivo avanti (o rotella del mouse)">
                    <Plus size={16} />
                </button>
                <button
                    className={showOverlay ? "overlay-btn overlay-btn-active" : "overlay-btn"}
                    onClick={onToggleOverlay}
                    disabled={!canShowOverlay}
                    title="Mostra i confini del layer superiore"
                >
                    <Layers size={16} />
                </button>
                <button className="zoom-btn zoom-btn-divided" onClick={handleSave} title="Salva la mappa in un file .json">
                    <Download size={16} />
                </button>
                <button className="zoom-btn" onClick={handleLoadClick} title="Carica una mappa da un file .json">
                    <Upload size={16} />
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} style={{ display: "none" }} />
            </div>
        </div>
    );
}