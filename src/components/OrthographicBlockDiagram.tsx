import React from 'react';

interface Props {
  length: number;
  height: number;
  width: number;
}

const LABEL_MARGIN = 28;
const CAPTION_HEIGHT = 20;
const GAP = 24;

function OrthographicMarkingDiagram({ length, height, width }: Props) {
  if (length <= 0 || height <= 0 || width <= 0) {
    return (
      <div className="w-full flex items-center justify-center py-6 text-sm text-muted-foreground">
        Enter valid block dimensions
      </div>
    );
  }

  const maxDim = Math.max(length, height, width);
  const scale = 260 / maxDim;

  const frontW = length * scale;
  const frontH = height * scale;
  const topW = length * scale;
  const topH = width * scale;

  const totalW = frontW + GAP + topW + LABEL_MARGIN * 2;
  const maxH = Math.max(frontH, topH);
  const totalH = maxH + LABEL_MARGIN + CAPTION_HEIGHT + 8;

  const frontX = LABEL_MARGIN;
  const frontY = LABEL_MARGIN + (maxH - frontH) / 2;
  const topX = LABEL_MARGIN + frontW + GAP;
  const topY = LABEL_MARGIN + (maxH - topH) / 2;

  return (
    <div className="w-full flex justify-center py-2">
      <svg
        width="100%"
        viewBox={`0 0 ${totalW} ${totalH}`}
        className="max-w-full"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Front Elevation */}
        <rect
          x={frontX} y={frontY}
          width={frontW} height={frontH}
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
        {/* Front dimension labels */}
        <DimLabel
          x1={frontX} y1={frontY + frontH + 6}
          x2={frontX + frontW} y2={frontY + frontH + 6}
          label={`L = ${length} cm`}
          orientation="horizontal"
        />
        <DimLabel
          x1={frontX - 6} y1={frontY}
          x2={frontX - 6} y2={frontY + frontH}
          label={`H = ${height} cm`}
          orientation="vertical"
        />
        {/* Caption */}
        <text
          x={frontX + frontW / 2}
          y={LABEL_MARGIN + maxH + CAPTION_HEIGHT + 4}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
        >
          Front
        </text>

        {/* Top View */}
        <rect
          x={topX} y={topY}
          width={topW} height={topH}
          fill="none" stroke="currentColor" strokeWidth="1.5"
        />
        {/* Top dimension labels */}
        <DimLabel
          x1={topX} y1={topY + topH + 6}
          x2={topX + topW} y2={topY + topH + 6}
          label={`L = ${length} cm`}
          orientation="horizontal"
        />
        <DimLabel
          x1={topX - 6} y1={topY}
          x2={topX - 6} y2={topY + topH}
          label={`W = ${width} cm`}
          orientation="vertical"
        />
        {/* Caption */}
        <text
          x={topX + topW / 2}
          y={LABEL_MARGIN + maxH + CAPTION_HEIGHT + 4}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
        >
          Top
        </text>
      </svg>
    </div>
  );
}

function DimLabel({
  x1, y1, x2, y2, label, orientation,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; orientation: 'horizontal' | 'vertical';
}) {
  const tickLen = 4;

  if (orientation === 'horizontal') {
    const midX = (x1 + x2) / 2;
    const y = y1;
    return (
      <g>
        {/* Ticks */}
        <line x1={x1} y1={y - tickLen} x2={x1} y2={y + tickLen} stroke="currentColor" strokeWidth="0.8" />
        <line x1={x2} y1={y - tickLen} x2={x2} y2={y + tickLen} stroke="currentColor" strokeWidth="0.8" />
        {/* Line */}
        <line x1={x1} y1={y} x2={x2} y2={y} stroke="currentColor" strokeWidth="0.6" />
        {/* Arrows */}
        <polygon points={`${x1},${y} ${x1 + 5},${y - 2} ${x1 + 5},${y + 2}`} fill="currentColor" />
        <polygon points={`${x2},${y} ${x2 - 5},${y - 2} ${x2 - 5},${y + 2}`} fill="currentColor" />
        {/* Label */}
        <text x={midX} y={y + 14} textAnchor="middle" fontSize="9" fill="currentColor">{label}</text>
      </g>
    );
  }

  // Vertical
  const x = x1;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      {/* Ticks */}
      <line x1={x - tickLen} y1={y1} x2={x + tickLen} y2={y1} stroke="currentColor" strokeWidth="0.8" />
      <line x1={x - tickLen} y1={y2} x2={x + tickLen} y2={y2} stroke="currentColor" strokeWidth="0.8" />
      {/* Line */}
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="currentColor" strokeWidth="0.6" />
      {/* Arrows */}
      <polygon points={`${x},${y1} ${x - 2},${y1 + 5} ${x + 2},${y1 + 5}`} fill="currentColor" />
      <polygon points={`${x},${y2} ${x - 2},${y2 - 5} ${x + 2},${y2 - 5}`} fill="currentColor" />
      {/* Label */}
      <text x={x - 8} y={midY} textAnchor="end" dominantBaseline="central" fontSize="9" fill="currentColor">{label}</text>
    </g>
  );
}

export const OrthographicBlockDiagram = React.memo(OrthographicMarkingDiagram);
