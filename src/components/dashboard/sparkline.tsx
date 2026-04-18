interface SparklineProps {
  data: number[];
  color?: string;
  fill?: boolean;
  height?: number;
}

export function Sparkline({
  data,
  color = "currentColor",
  fill = false,
  height = 28,
}: SparklineProps) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    height - 4 - ((v - min) / range) * (height - 8),
  ]);
  const d =
    pts
      .map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1))
      .join(" ");
  const area = d + ` L${w},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height }}
      aria-hidden
    >
      {fill && <path d={area} fill={color} opacity={0.18} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}
