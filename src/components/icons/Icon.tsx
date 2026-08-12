import type { LucideIcon } from "lucide-react";

interface IconProps {
  Comp: LucideIcon;
  x: number;
  y: number;
  size: number;
  color: string;
}

/** Posiziona un'icona vettoriale lucide-react centrata su (x, y) dentro un <svg> genitore. */
export function Icon({ Comp, x, y, size, color }: IconProps) {
  return <Comp x={x - size / 2} y={y - size / 2} width={size} height={size} color={color} strokeWidth={2} />;
}