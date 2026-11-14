import React from 'react';

interface DefectAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value?: string };
  maxCharsPerLine?: number;
  maxNameLines?: number;
}

function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
    } else if ((current + ' ' + word).length <= maxChars) {
      current = current + ' ' + word;
    } else {
      lines.push(current);
      if (lines.length >= maxLines) {
        const lastIdx = lines.length - 1;
        lines[lastIdx] =
          lines[lastIdx].length >= maxChars - 1
            ? lines[lastIdx].slice(0, maxChars - 2) + '…'
            : lines[lastIdx] + '…';
        return lines;
      }
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
}

/**
 * Centered, horizontal multi-line SVG tick for Recharts XAxis.
 * Displays bold defect code (e.g. [Se-26]) on line 1 and cleanly wrapped name lines below,
 * preventing left-edge clipping caused by angled text labels.
 */
export const DefectAxisTick: React.FC<DefectAxisTickProps> = ({
  x = 0,
  y = 0,
  payload,
  maxCharsPerLine = 16,
  maxNameLines = 2,
}) => {
  const raw = String(payload?.value || '').trim();
  if (!raw) return null;

  const colonIdx = raw.indexOf(':');
  const hasCodePrefix = colonIdx > 0 && colonIdx <= 10;
  const codePart = hasCodePrefix ? raw.slice(0, colonIdx).trim() : '';
  const namePart = hasCodePrefix ? raw.slice(colonIdx + 1).trim() : raw;
  const nameLines = wrapWords(namePart, maxCharsPerLine, maxNameLines);

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{raw}</title>
      {codePart && (
        <text
          x={0}
          y={0}
          dy={11}
          textAnchor="middle"
          fill="#0369a1"
          fontSize={10}
          fontWeight={800}
        >
          [{codePart}]
        </text>
      )}
      {nameLines.map((line, idx) => (
        <text
          key={idx}
          x={0}
          y={0}
          dy={(codePart ? 23 : 12) + idx * 11}
          textAnchor="middle"
          fill="#334155"
          fontSize={9}
          fontWeight={600}
        >
          {line}
        </text>
      ))}
    </g>
  );
};
