import React from 'react';

interface SpeedometerGaugeProps {
  value: number; // e.g. 7.2 for OQL, or 98.5 for Pass Rate
  target?: number; // default 4.5 for OQL, 95 for passRate
  max?: number; // default 12.0 for OQL, 100 for passRate
  size?: 'sm' | 'md' | 'lg';
  showTargetPill?: boolean;
  subLabel?: string;
  mode?: 'oql' | 'passRate';
  decimals?: number;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  value = 0,
  target,
  max,
  size = 'md',
  subLabel,
  mode = 'oql',
  decimals,
}) => {
  const effectiveMax = max ?? (mode === 'passRate' ? 100 : 12.0);
  const effectiveTarget = target ?? (mode === 'passRate' ? 95 : 4.5);
  const effectiveDecimals = decimals ?? (mode === 'passRate' ? 1 : 2);
  const effectiveSubLabel =
    subLabel !== undefined
      ? subLabel
      : mode === 'passRate'
      ? `Target: >=${effectiveTarget.toFixed(0)}%`
      : `Target: ${effectiveTarget.toFixed(2)}%`;

  // Constrain value between 0 and max
  const clampedValue = Math.max(0, Math.min(value, effectiveMax));

  // Calculate angle: 0% is -180 degrees (left), max is 0 degrees (right)
  const percentage = effectiveMax > 0 ? clampedValue / effectiveMax : 0;
  const needleAngle = -180 + percentage * 180;

  // Dimensions
  const dimensions = {
    sm: { width: 125, height: 78, radius: 44, strokeWidth: 11, fontSize: 'text-base', labelSize: 'text-[9px]' },
    md: { width: 170, height: 102, radius: 62, strokeWidth: 14, fontSize: 'text-xl', labelSize: 'text-[11px]' },
    lg: { width: 220, height: 130, radius: 80, strokeWidth: 18, fontSize: 'text-2xl', labelSize: 'text-xs' },
  }[size];

  const cx = dimensions.width / 2;
  const cy = dimensions.height - 18;
  const r = dimensions.radius;
  const sw = dimensions.strokeWidth;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');
  };

  // Arc zone geometry differs by mode:
  // - 'oql': lower is better (Green 0->3.5, Yellow 3.5->5.0, Red 5.0->12)
  // - 'passRate': higher is better (Red 0->85, Yellow 85->95, Green 95->100)
  let segments: Array<{ path: string; color: string; roundCap?: boolean }> = [];
  if (mode === 'passRate') {
    const redEndAngle = -180 + (85 / effectiveMax) * 180;
    const yellowEndAngle = -180 + (95 / effectiveMax) * 180;
    segments = [
      { path: describeArc(cx, cy, r, -180, redEndAngle), color: '#ef4444', roundCap: true },
      { path: describeArc(cx, cy, r, redEndAngle, yellowEndAngle), color: '#f59e0b' },
      { path: describeArc(cx, cy, r, yellowEndAngle, 0), color: '#22c55e', roundCap: true },
    ];
  } else {
    const greenEndAngle = -180 + (3.5 / effectiveMax) * 180;
    const yellowEndAngle = -180 + (5.0 / effectiveMax) * 180;
    segments = [
      { path: describeArc(cx, cy, r, -180, greenEndAngle), color: '#22c55e', roundCap: true },
      { path: describeArc(cx, cy, r, greenEndAngle, yellowEndAngle), color: '#f59e0b' },
      { path: describeArc(cx, cy, r, yellowEndAngle, 0), color: '#ef4444', roundCap: true },
    ];
  }

  // Status color for text
  const valueColor =
    mode === 'passRate'
      ? value >= effectiveTarget
        ? 'text-emerald-700 dark:text-emerald-400'
        : value >= 85
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-red-700 dark:text-red-400'
      : value <= effectiveTarget
      ? 'text-emerald-700 dark:text-emerald-400'
      : value <= 5.5
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-700 dark:text-red-400';

  const needleColor = mode === 'passRate' ? '#0284c7' : '#dc2626';

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="overflow-visible"
        >
          {/* Subtle background track */}
          <path
            d={describeArc(cx, cy, r, -180, 0)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={sw + 2}
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />

          {/* Color Zones */}
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeLinecap={seg.roundCap ? 'round' : undefined}
            />
          ))}

          {/* Target tick marker */}
          {(() => {
            const targetAngle = -180 + (effectiveTarget / effectiveMax) * 180;
            const pInner = polarToCartesian(cx, cy, r - sw / 2 - 2, targetAngle);
            const pOuter = polarToCartesian(cx, cy, r + sw / 2 + 3, targetAngle);
            return (
              <line
                x1={pInner.x}
                y1={pInner.y}
                x2={pOuter.x}
                y2={pOuter.y}
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeDasharray="2,1"
                className="dark:stroke-white"
              />
            );
          })()}

          {/* Needle Pointer */}
          <g
            style={{
              transform: `translate(${cx}px, ${cy}px) rotate(${needleAngle}deg)`,
              transformOrigin: '0px 0px',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <path
              d={`M 0 -3 L ${r - sw / 2} 0 L 0 3 Z`}
              fill={needleColor}
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.3))"
            />
            <circle cx="0" cy="0" r="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
          </g>

          {/* Scale min / max labels */}
          <text x={cx - r + 2} y={cy + 14} fontSize="7.5" fill="#64748b" textAnchor="middle" fontWeight="bold">
            0%
          </text>
          <text x={cx + r - 2} y={cy + 14} fontSize="7.5" fill="#64748b" textAnchor="middle" fontWeight="bold">
            {effectiveMax}%
          </text>
        </svg>
      </div>

      {/* Main Percentage Display */}
      <div className={`mt-0.5 font-black tracking-tight ${valueColor} ${dimensions.fontSize}`}>
        {value.toFixed(effectiveDecimals)}%
      </div>

      {/* Sublabel */}
      {effectiveSubLabel && (
        <div className={`font-semibold text-slate-500 dark:text-slate-400 ${dimensions.labelSize}`}>
          {effectiveSubLabel}
        </div>
      )}
    </div>
  );
};
