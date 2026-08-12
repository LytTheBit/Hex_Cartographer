import { Layers, Minus, Plus } from "lucide-react";
import type { MapLevel } from "../../types/map";
import "./ZoomControls.css";

interface ZoomControlsProps {
    level: MapLevel;
    zoomIndex: number;
    maxZoomIndex: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    showOverlay: boolean;
    onToggleOverlay: () => void;
    isLocale: boolean;
}

export function ZoomControls({
                                 level,
                                 zoomIndex,
                                 maxZoomIndex,
                                 onZoomIn,
                                 onZoomOut,
                                 showOverlay,
                                 onToggleOverlay,
                                 isLocale,
                             }: ZoomControlsProps) {
    return (
        <div className="zoom-controls">
            <button className="zoom-btn" onClick={onZoomOut} disabled={zoomIndex === maxZoomIndex} title="Zoom indietro (o rotella del mouse)">
                <Minus size={16} />
            </button>
            <span className="zoom-level-label">{level}</span>
            <button className="zoom-btn" onClick={onZoomIn} disabled={zoomIndex === 0} title="Zoom avanti (o rotella del mouse)">
                <Plus size={16} />
            </button>
            <button
                className={showOverlay ? "overlay-btn overlay-btn-active" : "overlay-btn"}
                onClick={onToggleOverlay}
                disabled={!isLocale}
                title="Mostra i confini della griglia Regionale"
            >
                <Layers size={16} />
            </button>
        </div>
    );
}