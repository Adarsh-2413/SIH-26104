// frontend/src/components/RiskGraph.jsx
/**
 * RiskGraph — Live Streaming Risk History Chart
 * Matches the reference design:
 *   - Trending green header icon + "LIVE RISK GRAPH"
 *   - Y-Axis: 0, 25, 50, 75, 100
 *   - X-Axis: Call time markers (00:00, 00:07, 00:14, ...)
 *   - Gradient area fill under curve (Green -> Amber -> Red)
 *   - Current score badge pinned at latest data point
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const val = item.score;
    const level = item.level || (val >= 70 ? "CRITICAL" : val >= 40 ? "SUSPICIOUS" : "SAFE");
    const color = level === "CRITICAL" ? "#ff1744" : level === "SUSPICIOUS" ? "#ff9100" : "#00e676";

    return (
      <div
        style={{
          background: "rgba(10, 14, 26, 0.95)",
          border: `1px solid ${color}88`,
          borderRadius: "8px",
          padding: "6px 12px",
          color: "#fff",
          fontSize: "0.78rem",
          boxShadow: `0 4px 14px ${color}33`,
        }}
      >
        <span style={{ color, fontWeight: 800 }}>Risk: {val}/100</span> ({level})
        {item.callTime && (
          <span style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>
            Time: {item.callTime}
          </span>
        )}
      </div>
    );
  }
  return null;
};

export default function RiskGraph({ data = [], currentScore = null }) {
  const hasData = data && data.length > 0;
  const latestPoint = hasData ? data[data.length - 1] : null;
  const displayScore = currentScore ?? (latestPoint ? latestPoint.score : null);

  const badgeColor =
    displayScore !== null
      ? displayScore >= 70
        ? "#ff1744"
        : displayScore >= 40
        ? "#ff9100"
        : "#00e676"
      : "#448aff";

  return (
    <div
      style={{
        background: "rgba(18, 24, 38, 0.65)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        position: "relative",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#00e676", fontSize: "1rem" }}>📈</span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "#00e676",
              textTransform: "uppercase",
            }}
          >
            Live Risk Graph
          </span>
        </div>

        {/* Current score badge pill (matching reference image) */}
        {displayScore !== null && (
          <div
            style={{
              background: badgeColor,
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "6px",
              boxShadow: `0 0 10px ${badgeColor}aa`,
            }}
          >
            {displayScore}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 110, position: "relative" }}>
        {!hasData ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255, 255, 255, 0.25)",
              fontSize: "0.75rem",
              fontStyle: "italic",
            }}
          >
            Awaiting continuous sliding-window audio stream...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 10, left: -24, bottom: -6 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff1744" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#ff9100" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00e676" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00e676" />
                  <stop offset="45%" stopColor="#ffb300" />
                  <stop offset="85%" stopColor="#ff9100" />
                  <stop offset="100%" stopColor="#ff1744" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />

              <XAxis
                dataKey="callTime"
                tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="score"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
