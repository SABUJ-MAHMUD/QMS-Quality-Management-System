import React from 'react';

interface SpeedometerGaugeProps {
  value: number; // e.g. 7.2 or 4.5
  target?: number; // default 4.5
  max?: number; // default 12.0
  size?: 'sm' | 'md' | 'lg';
  showTargetPill?: boolean;
  subLabel?: string;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  value = 0,
  target = 4.5,
  max = 12.0,
  size = 'md',
  showTargetPill = true,
  subLabel = `Target: ${target.toFixed(2)}%`,
}) => {
  // Constrain value between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  
  // Calculate angle: 0% is 180 degrees (left), max is 0 degrees (right)
  // Angle goes from 180 to 0 (counter-clockwise) or -180 to 0
  const percentage = clampedValue / max;
  const needleAngle = -180 + percentage * 180; // -180 is left, 0 is right

  // Dimensions
  const dimensions = {
    sm: { width: 125, height: 70, radius: 46, strokeWidth: 12, fontSize: 'text-base', labelSize: 'text-[9px]' },
    md: { width: 170, height: 95, radius: 64, strokeWidth: 14, fontSize: 'text-xl', labelSize: 'text-[11px]' },
    lg: { width: 220, height: 125, radius: 82, strokeWidth: 18, fontSize: 'text-2xl', labelSize: 'text-xs' },
  }[size];

  const cx = dimensions.width / 2;
  const cy = dimensions.height - 10;
  const r = dimensions.radius;
  const sw = dimensions.strokeWidth;

  // Helpers to draw arc segment
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

  // Color segment zones:
  // Green zone: 0% to 3.5%
  // Yellow/Amber zone: 3.5% to 5.0%
  // Red zone: 5.0% to 12.0%
  const greenEndAngle = -180 + (3.5 / max) * 180;
  const yellowEndAngle = -180 + (5.0 / max) * 180;

  const greenPath = describeArc(cx, cy, r, -180, greenEndAngle);
  const yellowPath = describeArc(cx, cy, r, greenEndAngle, yellowEndAngle);
  const redPath = describeArc(cx, cy, r, yellowEndAngle, 0);

  // Status color for text
  const valueColor =
    value <= target
      ? 'text-emerald-700 dark:text-emerald-400'
      : value <= 5.5
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-red-700 dark:text-red-400';

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="relative flex items-center justify-center">
        {/* SVG Dial */}
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

          {/* Green Zone (Safe / Pass) */}
          <path
            d={greenPath}
            fill="none"
            stroke="#22c55e"
            strokeWidth={sw}
            strokeLinecap="round"
          />

          {/* Yellow Zone (Warning / Borderline) */}
          <path
            d={yellowPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={sw}
          />

          {/* Red Zone (Fail / High OQL) */}
          <path
            d={redPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth={sw}
            strokeLinecap="round"
          />

          {/* Target tick marker at 4.5% */}
          {(() => {
            const targetAngle = -180 + (target / max) * 180;
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
            {/* Needle shape */}
            <path
              d={`M 0 -3 L ${r - sw / 2} 0 L 0 3 Z`}
              fill="#dc2626"
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.3))"
            />
            {/* Needle center cap */}
            <circle cx="0" cy="0" r="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
          </g>

          {/* Scale min / max labels */}
          <text x={cx - r - 2} y={cy + 8} fontSize="8" fill="#64748b" textAnchor="middle" fontWeight="bold">
            0%
          </text>
          <text x={cx + r + 2} y={cy + 8} fontSize="8" fill="#64748b" textAnchor="middle" fontWeight="bold">
            {max}%
          </text>
        </svg>
      </div>

      {/* Main OQL Value Display */}
      <div className={`mt-0.5 font-black tracking-tight ${valueColor} ${dimensions.fontSize}`}>
        {value.toFixed(2)}%
      </div>

      {/* Sublabel */}
      {subLabel && (
        <div className={`font-semibold text-slate-500 dark:text-slate-400 ${dimensions.labelSize}`}>
          {subLabel}
        </div>
      )}
    </div>
  );
};
