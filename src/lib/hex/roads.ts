import type { Tile, AxialCoord } from "../../types/map";
import { EDGE_DIRECTIONS, axialToPixel } from "./coordinates";
import { tileKey } from "./grid";

interface Point {
    x: number;
    y: number;
}

export function computeRoadPaths(cells: AxialCoord[], getTile: (q: number, r: number) => Tile, hexSize: number): string[] {
    const roadCells = new Set(cells.filter(({ q, r }) => getTile(q, r).features.strada).map(({ q, r }) => tileKey(q, r)));

    const neighborsOf = (q: number, r: number): string[] =>
        EDGE_DIRECTIONS.map((d) => tileKey(q + d.q, r + d.r)).filter((k) => roadCells.has(k));

    const visitedLinks = new Set<string>();
    const chains: Point[][] = [];

    const linkKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    const centerOf = (key: string): Point => {
        const [q, r] = key.split(",").map(Number);
        const [x, y] = axialToPixel(q, r, hexSize);
        return { x, y };
    };

    function traceFrom(startKey: string, firstNeighborKey: string) {
        const points: Point[] = [centerOf(startKey)];
        let prevKey = startKey;
        let currentKey: string | null = firstNeighborKey;

        while (currentKey) {
            const lk = linkKey(prevKey, currentKey);
            if (visitedLinks.has(lk)) break;
            visitedLinks.add(lk);
            points.push(centerOf(currentKey));

            const [cq, cr] = currentKey.split(",").map(Number);
            const neighbors = neighborsOf(cq, cr);
            if (neighbors.length === 2) {
                const next = neighbors.find((n) => n !== prevKey) ?? null;
                prevKey = currentKey;
                currentKey = next;
            } else {
                currentKey = null;
            }
        }

        if (points.length >= 2) chains.push(points);
    }

    roadCells.forEach((key) => {
        const [q, r] = key.split(",").map(Number);
        const neighbors = neighborsOf(q, r);
        if (neighbors.length !== 2) {
            neighbors.forEach((n) => {
                if (!visitedLinks.has(linkKey(key, n))) traceFrom(key, n);
            });
        }
    });
    roadCells.forEach((key) => {
        const [q, r] = key.split(",").map(Number);
        const neighbors = neighborsOf(q, r);
        if (neighbors.length === 2) {
            neighbors.forEach((n) => {
                if (!visitedLinks.has(linkKey(key, n))) traceFrom(key, n);
            });
        }
    });

    return chains.map(catmullRomToPath);
}

function catmullRomToPath(points: Point[]): string {
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
    }
    return d;
}