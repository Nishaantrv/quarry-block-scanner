import React, { useMemo } from 'react';

interface Props {
    length: number;
    height: number;
    width: number;
}

interface SingleViewProps {
    frontW: number; // Dimension for the front face width
    frontH: number; // Dimension for the front face height
    depth: number;  // Dimension for the receding depth
    projection?: 'left' | 'right'; // Direction of the receding face
    labels: {
        bottom: string;
        left: string;
        slanted: string;
    }
    scale: number;
    title: string;
}

const SingleBlockView: React.FC<SingleViewProps> = ({ frontW, frontH, depth, labels, scale, title, projection = 'right' }) => {
    // Scaled dimensions
    const fw = frontW * scale;
    const fh = frontH * scale;
    const d = depth * scale;

    // Oblique projection offsets
    // If projection is 'right' (default), ox is positive.
    // If projection is 'left', ox is negative.
    const ox = projection === 'right' ? d * 0.5 : -d * 0.5;
    const oy = -d * 0.35; // always moves UP for top view

    // Coordinate adjustments
    // oy is negative (up), so we shift everything down by abs(oy).
    const shiftY = Math.abs(oy);

    // ox might be negative. If so, we need to shift everything right by abs(ox) so it starts at 0.
    const shiftX = ox < 0 ? Math.abs(ox) : 0;

    // Bounding box
    // Width:
    // If right projection: total width = fw + ox
    // If left projection: total width = fw + abs(ox) (since it goes left, but we shifted it right)
    const totalW = fw + Math.abs(ox);
    const totalH = fh + shiftY;

    // Padding for labels
    const padLeft = 40;
    const padRight = 40; // Increased for left projection needing space on right? No, standard padding.
    const padTop = 30;
    const padBottom = 30;

    const svgW = totalW + padLeft + padRight;
    const svgH = totalH + padTop + padBottom;

    // Origin for the drawing within the SVG
    const startX = padLeft + shiftX;
    const startY = padTop;

    // Coordinates
    // Front Face (shifted down by shiftY)
    const F_TL = { x: startX, y: startY + shiftY };
    const F_TR = { x: startX + fw, y: startY + shiftY };
    const F_BL = { x: startX, y: startY + shiftY + fh };
    const F_BR = { x: startX + fw, y: startY + shiftY + fh };

    // Back Face (shifted by ox and oy)
    // If ox is negative, B_TL will be to the left of F_TL.
    const B_TL = { x: startX + ox, y: startY };
    const B_TR = { x: startX + ox + fw, y: startY };
    const B_BR = { x: startX + ox + fw, y: startY + fh };
    const B_BL = { x: startX + ox, y: startY + fh }; // Needed for left projection bottom line

    // Label Positions
    // Bottom: Centered below Front Bottom Edge
    const lblBottom = { x: (F_BL.x + F_BR.x) / 2, y: F_BL.y + 15 };

    // Height Label (formerly lblLeft)
    // If projection is 'right', label is on the Left (F_TL.x - 10).
    // If projection is 'left', label is on the Right (F_TR.x + 10).
    const isRightProj = projection === 'right';
    const lblHeight = {
        x: isRightProj ? F_TL.x - 10 : F_TR.x + 10,
        y: (F_TL.y + F_BL.y) / 2
    };
    const heightAnchor = isRightProj ? 'end' : 'start';

    // Slanted: Midpoint of receding top edge
    // Right projection: F_TL -> B_TL (Top-Left corner goes back-right? No, standard oblique is top face visible)
    // Wait, let's look at previous code.
    // Previous code: `ox = d * 0.5`, `oy = -d * 0.35`. B_TL is (startX + ox, startY).
    // F_TL is (startX, startY + shiftY).
    // The line is F_TL -> B_TL. This is the top-left edge receding.
    // Midpoint:
    const lblSlanted = { x: (F_TL.x + B_TL.x) / 2 - 5, y: (F_TL.y + B_TL.y) / 2 - 5 };

    // For left projection, maybe adjust label anchor or offset?
    // If left projection, label moves left.
    // For left projection, we also want the text to be 'outside' the shape (to the left).
    // The line F_TL -> B_TL goes Up-Left. 
    // An 'end' anchor (extending left) ensures it doesn't overlap the top face.
    const slantedAnchor = 'end';

    // Offset: 
    // Right Projection: -5 (shift left)
    // Offset: 
    // Right Projection: -5 (shift left)
    // Left Projection: -45 (shift left even more to explicitly clear the back vertical edge)
    const slantedXOffset = projection === 'left' ? -45 : -5;


    return (
        <div className="flex flex-col items-center">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-1">{title}</h3>
            <svg width={svgW} height={svgH} className="overflow-visible">
                <g stroke="currentColor" strokeWidth="2" fill="none">
                    {/* Front Rectangle */}
                    <rect x={F_TL.x} y={F_TL.y} width={fw} height={fh} />

                    {/* Visible Back Edges (Top and Right/Left) */}
                    {/* Top Edge is always visible: B_TL to B_TR */}
                    <line x1={B_TL.x} y1={B_TL.y} x2={B_TR.x} y2={B_TR.y} />

                    {/* Side Edge: */}
                    {projection === 'right' ? (
                        // Right Projection: Right face visible? 
                        // Previous code: B_TL->B_TR (Top), B_TR->B_BR (Right side of back face).
                        // Connecting lines: F_TR->B_TR (Top Right), F_BR->B_BR (Bottom Right).
                        // So Right face is F_TR-B_TR-B_BR-F_BR.
                        <>
                            <line x1={B_TR.x} y1={B_TR.y} x2={B_BR.x} y2={B_BR.y} /> {/* Back Right Vertical */}
                            <line x1={F_TR.x} y1={F_TR.y} x2={B_TR.x} y2={B_TR.y} /> {/* Connect Top Right */}
                            <line x1={F_BR.x} y1={F_BR.y} x2={B_BR.x} y2={B_BR.y} /> {/* Connect Bottom Right */}
                            <line x1={F_TL.x} y1={F_TL.y} x2={B_TL.x} y2={B_TL.y} /> {/* Connect Top Left (for top face) */}
                        </>
                    ) : (
                        // Left Projection: Left face visible?
                        // We want to see the Left Face.
                        // Back Left Vertical: B_TL -> B_BL.
                        // Connect Top Left: F_TL -> B_TL.
                        // Connect Bottom Left: F_BL -> B_BL.
                        // Connect Top Right: F_TR -> B_TR (for top face)
                        <>
                            <line x1={B_TL.x} y1={B_TL.y} x2={B_BL.x} y2={B_BL.y} /> {/* Back Left Vertical */}
                            <line x1={F_TL.x} y1={F_TL.y} x2={B_TL.x} y2={B_TL.y} /> {/* Connect Top Left */}
                            <line x1={F_BL.x} y1={F_BL.y} x2={B_BL.x} y2={B_BL.y} /> {/* Connect Bottom Left */}
                            <line x1={F_TR.x} y1={F_TR.y} x2={B_TR.x} y2={B_TR.y} /> {/* Connect Top Right (for top face) */}
                        </>
                    )}
                </g>

                {/* Labels */}
                <g fill="currentColor" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
                    {/* Height Label */}
                    <text x={lblHeight.x} y={lblHeight.y} textAnchor={heightAnchor} dominantBaseline="middle">
                        {labels.left}
                    </text>

                    {/* Length/Width Front Label */}
                    <text x={lblBottom.x} y={lblBottom.y} dominantBaseline="hanging">
                        {labels.bottom}

                    </text>

                    {/* Depth Label - Positioned on the top receding line for that side */}
                    {/* For Left Projection: Use Top-Left line (F_TL -> B_TL) */}
                    {/* For Right Projection: Use Top-Left line? Wait. */}
                    {/* Previous code put it on F_TL -> B_TL for right projection? */}
                    {/* "lblSlanted = midpoint of F_TL and B_TL". Yes. */}
                    {/* But F_TL->B_TL is the LEFT edge of the TOP face. */}
                    {/* If we project LEFT, F_TL->B_TL is the TOP edge of the LEFT face. */}
                    {/* So using the same line segment coordinates works for both, just the semantic changes. */}
                    <text x={lblSlanted.x + slantedXOffset} y={lblSlanted.y} textAnchor={slantedAnchor}>
                        {labels.slanted}
                    </text>
                </g>
            </svg>
        </div>
    );
};

export const ObliqueBlockViews: React.FC<Props> = React.memo(({ length, height, width }) => {
    const isValid = length > 0 && height > 0 && width > 0;

    if (!isValid) {
        return <div className="h-40 flex items-center justify-center text-muted-foreground italic text-xs">Enter dimensions</div>;
    }

    const maxDim = Math.max(length, height, width);
    const viewScale = 140 / (maxDim || 1);

    return (
        <div className="w-full flex flex-wrap justify-center gap-6 py-4 bg-muted/10 rounded-lg border border-border/50">
            {/* View A: Mirror of View B (Front=WxH, Depth=L, Project Left) */}
            <SingleBlockView
                title="View A"
                frontW={width}
                frontH={height}
                depth={length}
                projection="left"
                labels={{
                    bottom: `W ${width}`,
                    left: `H ${height}`,
                    slanted: `L ${length}`,
                }}
                scale={viewScale}
            />

            {/* View B: Front=WxH, Depth=L, Standard (Project Right) */}
            <SingleBlockView
                title="View B"
                frontW={width}
                frontH={height}
                depth={length}
                projection="right"
                labels={{
                    bottom: `W ${width}`,
                    left: `H ${height}`,
                    slanted: `L ${length}`,
                }}
                scale={viewScale}
            />
        </div>
    );
});
