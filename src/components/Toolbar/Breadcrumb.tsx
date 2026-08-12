import { LEVELS } from "../../lib/constants";
import type { Path } from "../../types/map";
import "./Breadcrumb.css";

interface BreadcrumbProps {
    path: Path;
    onNavigate: (depth: number) => void;
}

/** Mostra il percorso di navigazione (Globale > cella > Regionale > cella > Locale). */
export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    return (
        <div className="breadcrumb">
            <button className="breadcrumb-item" onClick={() => onNavigate(0)} disabled={path.length === 0}>
                {LEVELS[0]}
            </button>
            {path.map((coord, i) => (
                <span key={i} className="breadcrumb-segment">
          <span className="breadcrumb-sep">›</span>
          <button className="breadcrumb-item" onClick={() => onNavigate(i + 1)} disabled={i === path.length - 1}>
            ({coord.q}, {coord.r}) · {LEVELS[i + 1]}
          </button>
        </span>
            ))}
        </div>
    );
}