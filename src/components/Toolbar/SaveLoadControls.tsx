import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import "./SaveLoadControls.css";

interface SaveLoadControlsProps {
    onExport: () => string;
    onImport: (json: string) => boolean;
}

export function SaveLoadControls({ onExport, onImport }: SaveLoadControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        const json = onExport();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hex-cartographer-map.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === "string" ? reader.result : "";
            const ok = onImport(text);
            if (!ok) alert("Could not read this file: it doesn't look like a valid Hex Cartographer map.");
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    return (
        <div className="save-load-controls">
            <button className="save-load-btn" onClick={handleSave} title="Save the map to a .json file">
                <Download size={16} />
            </button>
            <button className="save-load-btn" onClick={handleLoadClick} title="Load a map from a .json file">
                <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} style={{ display: "none" }} />
        </div>
    );
}