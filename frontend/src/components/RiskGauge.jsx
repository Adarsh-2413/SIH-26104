// frontend/src/components/RiskGauge.jsx
/**
 * RiskGauge — Precision Semi-Circular Arc Gauge
 * Matches the reference security design:
 *   - Semi-circular gradient arc (Green -> Amber -> Red)
 *   - Glowing needle indicator at current percentage
 *   - Bold score number with "/100" label
 *   - Risk tier title (SAFE / SUSPICIOUS / CRITICAL)
 *   - "Risk Score ⓘ" subtitle
 */

export default function RiskGauge({ score = null, level = null, isWarmingUp = false }) {
  const hasScore = typeof score === "number" && score !== null;

  // Tier color mapping
  const levelColor =
    level === "CRITICAL"
      ? "#ff1744"
      : level === "SUSPICIOUS"
      ? "#ff9100"
      : level === "SAFE"
      ? "#00e676"
      : isWarmingUp
      ? "#448aff"
      : "rgba(255, 255, 255, 0.3)";

  const levelLabel =
    level || (isWarmingUp ? "ANALYZING..." : "STANDBY");

  // Semi-circle arc geometry (180deg to 0deg)
  const radius = 95;
  const strokeWidth = 14;
  const cx = 130;
  const cy = 115;

  // Arc math: 180 deg (left) to 0 deg (right)
  const angleDeg = hasScore ? 180 - (Math.min(100, Math.max(0, score)) / 100) * 180 : 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Indicator tip coordinates
  const tipX = cx + radius * Math.cos(angleRad);
  const tipY = cy - radius * Math.sin(angleRad);

  // SVG arc path for 180° semi-circle
  // From (cx - radius, cy) over the top to (cx + radius, cy)
  const bgPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  // Arc length = PI * radius ~ 298.45
  const arcLength = Math.PI * radius;
  const strokeDashoffset = hasScore ? arcLength * (1 - score / 100) : arcLength;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: "100%" }}>
      <svg width="260" height="155" viewBox="0 0 260 145" style={{ overflow: "visible" }}>
        <defs>
          {/* Multi-stop gradient along the semi-circle */}
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="38%" stopColor="#76ff03" />
            <stop offset="55%" stopColor="#ffb300" />
            <stop offset="75%" stopColor="#ff9100" />
            <stop offset="100%" stopColor="#ff1744" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inactive track */}
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active colored arc */}
        {hasScore && (
          <path
            d={bgPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeGlow)"
            style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
          />
        )}

        {/* Glowing tip indicator */}
        {hasScore && (
          <circle
            cx={tipX}
            cy={tipY}
            r="8"
            fill="#ffffff"
            stroke={levelColor}
            strokeWidth="3.5"
            style={{
              filter: `drop-shadow(0 0 8px ${levelColor})`,
              transition: "cx 0.4s ease-out, cy 0.4s ease-out",
            }}
          />
        )}

        {/* Center Score */}
        <text
          x={cx}
          y={cy - 16}
          textAnchor="middle"
          dominantBaseline="central"
        >
          <tspan
            fontSize="48"
            fontWeight="900"
            fill={hasScore ? levelColor : isWarmingUp ? "#448aff" : "rgba(255,255,255,0.3)"}
            fontFamily="'Inter', sans-serif"
            style={{ transition: "fill 0.4s ease" }}
          >
            {hasScore ? score : isWarmingUp ? "..." : "--"}
          </tspan>
          <tspan
            fontSize="18"
            fontWeight="500"
            fill="rgba(255, 255, 255, 0.4)"
            fontFamily="'Inter', sans-serif"
            dx="4"
          >
            /100
          </tspan>
        </text>

        {/* Risk Level Badge Text */}
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill={levelColor}
          fontSize="15"
          fontWeight="800"
          fontFamily="'Inter', sans-serif"
          letterSpacing="1.2"
          style={{ transition: "fill 0.4s ease" }}
        >
          {levelLabel}
        </text>

        {/* Subtitle */}
        <text
          x={cx}
          y={cy + 34}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.45)"
          fontSize="11"
          fontWeight="500"
          fontFamily="'Inter', sans-serif"
        >
          Risk Score ⓘ
        </text>
      </svg>
    </div>
  );
}
