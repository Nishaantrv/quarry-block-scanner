import React, { useState, useMemo } from 'react';

interface Props {
  length: number;
  height: number;
  width: number;
}

const COS30 = 0.866;
const SIN30 = 0.5;

function project(x: number, y: number, z: number, ox: number, oy: number): [number, number] {
  return [
    ox + (x - y) * COS30,
    oy + (x + y) * SIN30 - z,
  ];
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

const IsometricBlockPreviewInner: React.FC<Props> = ({ length, height, width }) => {
  const [color, setColor] = useState('#8B8680');

  const isValid = length > 0 && height > 0 && width > 0;

  const svgContent = useMemo(() => {
    if (!isValid) return null;

    const maxDim = Math.max(length, height, width);
    const scale = 200 / maxDim;
    const sx = width * scale;   // x-axis = width
    const sy = length * scale;  // y-axis = length
    const sz = height * scale;  // z-axis = height

    // Compute all 8 vertices with a temporary origin of (0,0)
    const raw = {
      A: project(0, 0, 0, 0, 0),
      B: project(sx, 0, 0, 0, 0),
      C: project(sx, sy, 0, 0, 0),
      D: project(0, sy, 0, 0, 0),
      E: project(0, 0, sz, 0, 0),
      F: project(sx, 0, sz, 0, 0),
      G: project(sx, sy, sz, 0, 0),
      H: project(0, sy, sz, 0, 0),
    };

    // Bounding box
    const allPts = Object.values(raw);
    const xs = allPts.map(p => p[0]);
    const ys = allPts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 40;
    const svgW = maxX - minX + pad * 2;
    const svgH = maxY - minY + pad * 2;
    const ox = -minX + pad;
    const oy = -minY + pad;

    // Re-project with correct origin
    const v = {
      A: project(0, 0, 0, ox, oy),
      B: project(sx, 0, 0, ox, oy),
      C: project(sx, sy, 0, ox, oy),
      D: project(0, sy, 0, ox, oy),
      E: project(0, 0, sz, ox, oy),
      F: project(sx, 0, sz, ox, oy),
      G: project(sx, sy, sz, ox, oy),
      H: project(0, sy, sz, ox, oy),
    };

    const pts = (face: [number, number][]) => face.map(p => `${p[0]},${p[1]}`).join(' ');

    // Colors
    const [h, s, l] = hexToHsl(color);
    const topColor = `hsl(${h}, ${s}%, ${Math.min(l + 18, 95)}%)`;
    const frontColor = `hsl(${h}, ${s}%, ${l}%)`;
    const sideColor = `hsl(${h}, ${s}%, ${Math.max(l - 18, 5)}%)`;

    // Label helpers
    const mid = (a: [number, number], b: [number, number]): [number, number] => [
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
    ];
    const angle = (a: [number, number], b: [number, number]) =>
      Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);

    const labelAB = mid(v.A, v.B); // width label along front bottom
    const labelAD = mid(v.A, v.D); // length label along left bottom  
    const labelAE = mid(v.A, v.E); // height label along front left vertical

    const angleAB = angle(v.A, v.B);
    const angleAD = angle(v.A, v.D);

    return (
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="mx-auto">
        {/* Faces: back to front for correct depth */}
        <polygon points={pts([v.E, v.F, v.G, v.H])} fill={topColor} stroke="#000" strokeWidth="1" />
        <polygon points={pts([v.B, v.C, v.G, v.F])} fill={sideColor} stroke="#000" strokeWidth="1" />
        <polygon points={pts([v.A, v.B, v.F, v.E])} fill={frontColor} stroke="#000" strokeWidth="1" />

        {/* Labels */}
        <text
          x={labelAB[0]}
          y={labelAB[1] + 16}
          fontSize="11"
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${angleAB}, ${labelAB[0]}, ${labelAB[1] + 16})`}
        >
          {width} cm
        </text>
        <text
          x={labelAD[0] - 14}
          y={labelAD[1]}
          fontSize="11"
          fill="currentColor"
          textAnchor="end"
          dominantBaseline="middle"
          transform={`rotate(${angleAD}, ${labelAD[0] - 14}, ${labelAD[1]})`}
        >
          {length} cm
        </text>
        <text
          x={labelAE[0] - 10}
          y={labelAE[1]}
          fontSize="11"
          fill="currentColor"
          textAnchor="end"
          dominantBaseline="middle"
        >
          {height} cm
        </text>
      </svg>
    );
  }, [length, height, width, color, isValid]);

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {isValid ? (
        <>
          {svgContent}
          <div className="flex items-center gap-2">
            <label htmlFor="block-color" className="text-xs text-muted-foreground">Block color</label>
            <input
              id="block-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded border border-input cursor-pointer"
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic py-4">Invalid block dimensions</p>
      )}
    </div>
  );
};

export const IsometricBlockPreview = React.memo(IsometricBlockPreviewInner);
