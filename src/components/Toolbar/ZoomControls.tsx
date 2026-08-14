import { Layers, Minus, Plus } from "lucide-react";
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
}

export function ZoomControls({
                                 zoomIndex,
                                 onSetLayer,
                                 onZoomVisualIn,
                                 onZoomVisualOut,
                                 showOverlay,
                                 onToggleOverlay,
                                 canShowOverlay,
                             }: ZoomControlsProps) {
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
            </div>
        </div>
    );
}