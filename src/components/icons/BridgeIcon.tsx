import type { IconComponentProps } from "./Icon";

/**
 * A small hand-made bridge glyph (lucide-react has no built-in bridge icon). Matches the
 * same prop shape lucide icons use (x, y, width, height, color, strokeWidth), so it can be
 * dropped into the shared Icon helper exactly like any library icon.
 */
export function BridgeIcon({ x, y, width = 24, height = 24, color = "currentColor", strokeWidth = 2 }: IconComponentProps) {
    return (
        <svg
            x={x}
            y={y}
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 19h18" />
            <path d="M5 19v-6a7 7 0 0 1 14 0v6" />
            <path d="M9 19v-4" />
            <path d="M15 19v-4" />
        </svg>
    );
}