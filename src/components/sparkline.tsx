import { cn } from "@/lib/utils";

/** Tiny SVG cash path — not a chart kit. */
export function Sparkline({
  values,
  className,
  label = "90-day cash",
}: {
  values: number[];
  className?: string;
  label?: string;
}) {
  if (values.length < 2) return null;
  const w = 320;
  const h = 48;
  const padX = 2;
  const padY = 4;
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const last = values.length - 1;
  const coords = values.map((v, i) => {
    const x = padX + (i / last) * (w - padX * 2);
    const y = padY + (1 - (v - min) / span) * (h - padY * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${(w - padX).toFixed(1)},${(h - padY).toFixed(1)} L${padX},${(h - padY).toFixed(1)} Z`;
  const [lx, ly] = coords[last];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("text-primary", className)}
      role="img"
      aria-label={label}
    >
      <path d={area} fill="currentColor" opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="2.25" fill="currentColor" />
    </svg>
  );
}
