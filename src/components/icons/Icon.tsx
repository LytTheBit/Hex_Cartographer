export interface IconComponentProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

interface IconProps {
  Comp: React.ComponentType<IconComponentProps>;
  x: number;
  y: number;
  size: number;
  color: string;
}

/** Positions a vector icon (lucide-react or a custom hand-made one) centered on (x, y) inside a parent <svg>. */
export function Icon({ Comp, x, y, size, color }: IconProps) {
  return <Comp x={x - size / 2} y={y - size / 2} width={size} height={size} color={color} strokeWidth={2} />;
}