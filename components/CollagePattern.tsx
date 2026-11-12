'use client';

import React, { useMemo, useId } from 'react';

export type CollageShapeType = 'honeycomb' | 'square' | 'chain';

export interface MemberProofItem {
  id?: string;
  name?: string;
  jerseyName?: string;
  rollNumber?: string;
  photoUrl?: string;
  size?: string;
}

interface CollagePatternProps {
  shape?: CollageShapeType;
  peopleCount?: number;
  photos?: string[];
  graduatingYear?: number | string;
  isStandaloneCard?: boolean;
  centerMember?: MemberProofItem;
  members?: MemberProofItem[];
  svgId?: string;
  showCardFrame?: boolean;
}

// Minimalist avatar silhouette icon
export const AvatarIcon = ({
  gender = 'female',
  className = 'w-7/12 h-7/12',
}: {
  gender?: 'male' | 'female';
  className?: string;
}) => (
  <svg
    viewBox="0 0 40 46"
    fill="currentColor"
    className={`${className} select-none`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="20" cy="13" r="8" />
    {gender === 'female' ? (
      <path d="M7 40 C7 28, 12 24, 20 24 C28 24, 33 28, 33 40 Z" />
    ) : (
      <path d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z" />
    )}
  </svg>
);

// Regular Flat-topped hexagon SVG polygon points generator
export function getFlatTopHexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i);
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

// Regular Pointy-topped hexagon SVG polygon points generator (used for Chain)
export function getPointyHexPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(angleRad);
    const y = cy + r * Math.sin(angleRad);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
}

// 18-vertex (12-sided) center rosette polygon generator
export function getCenterRosettePoints(cx: number, cy: number, r: number): string {
  const sqrt3 = Math.sqrt(3);
  const rawVerts: Array<[number, number]> = [
    [  2.0,    sqrt3 ],
    [  2.5,  0.5 * sqrt3 ],
    [  2.0,    0.0 ],
    [  2.5, -0.5 * sqrt3 ],
    [  2.0,   -sqrt3 ],
    [  1.0,   -sqrt3 ],
    [  0.5, -1.5 * sqrt3 ],
    [ -0.5, -1.5 * sqrt3 ],
    [ -1.0,   -sqrt3 ],
    [ -2.0,   -sqrt3 ],
    [ -2.5, -0.5 * sqrt3 ],
    [ -2.0,    0.0 ],
    [ -2.5,  0.5 * sqrt3 ],
    [ -2.0,    sqrt3 ],
    [ -1.0,    sqrt3 ],
    [ -0.5,  1.5 * sqrt3 ],
    [  0.5,  1.5 * sqrt3 ],
    [  1.0,    sqrt3 ],
  ];

  return rawVerts
    .map(([vx, vy]) => `${(cx + vx * r).toFixed(2)},${(cy + vy * r).toFixed(2)}`)
    .join(' ');
}

export default function CollagePattern({
  shape = 'honeycomb',
  peopleCount = 20,
  photos = [],
  graduatingYear = 2027,
  isStandaloneCard = true,
  centerMember,
  members = [],
  svgId,
  showCardFrame = true,
}: CollagePatternProps) {
  const rawId = useId();
  const uid = useMemo(() => `clg_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const count = Math.max(1, Math.min(peopleCount || 20, 200));

  // Determine Center Member and Surrounding Classmates
  const centerPhoto = centerMember?.photoUrl || (photos.length > 0 ? photos[0] : null);
  const centerName = centerMember?.name || centerMember?.jerseyName || 'YOU';

  const surroundingMembers = useMemo(() => {
    // If structured members provided, filter out the center member
    if (members && members.length > 0) {
      return members.filter((m) => {
        if (centerMember?.id && m.id) return m.id !== centerMember.id;
        if (centerMember?.name && m.name) return m.name !== centerMember.name;
        return true;
      });
    }
    // Fallback: use photos array (skip first if used as center)
    return photos.slice(1).map((url, idx) => ({
      id: `p_${idx}`,
      name: `Member ${idx + 2}`,
      photoUrl: url,
    }));
  }, [members, centerMember, photos]);

  // --------------------------------------------------------------------------
  // 1. HONEYCOMB LAYOUT: 12-FACET CENTER ROSETTE & CONCENTRIC FLAT-TOP HEX RINGS
  // --------------------------------------------------------------------------
  const honeycombData = useMemo(() => {
    let r = 24;
    if (count > 120) r = 10.5;
    else if (count > 80) r = 12.5;
    else if (count > 50) r = 15.0;
    else if (count > 30) r = 18.0;
    else if (count > 18) r = 21.0;
    else if (count > 10) r = 24.0;
    else r = 28.0;

    const sqrt3 = Math.sqrt(3);

    const hexDist = (q: number, hexR: number) =>
      Math.floor((Math.abs(q) + Math.abs(hexR) + Math.abs(q + hexR)) / 2);

    const candidates: Array<{ x: number; y: number; r: number; metric: number }> = [];
    const maxCoord = 14;

    for (let q = -maxCoord; q <= maxCoord; q++) {
      for (let hexR = -maxCoord; hexR <= maxCoord; hexR++) {
        const d = hexDist(q, hexR);
        if (d >= 2) {
          const x = 1.5 * r * q;
          const y = sqrt3 * r * (hexR + q / 2);
          const metric = d * 1000 + Math.sqrt(x * x * 1.35 + y * y);
          candidates.push({ x, y, r, metric });
        }
      }
    }

    candidates.sort((a, b) => a.metric - b.metric);
    const surrounding = count > 1 ? candidates.slice(0, count - 1) : [];

    let minX = -2.5 * r;
    let maxX = 2.5 * r;
    let minY = -1.5 * sqrt3 * r;
    let maxY = 1.5 * sqrt3 * r;

    surrounding.forEach((p) => {
      minX = Math.min(minX, p.x - p.r);
      maxX = Math.max(maxX, p.x + p.r);
      minY = Math.min(minY, p.y - p.r);
      maxY = Math.max(maxY, p.y + p.r);
    });

    const pad = 12;
    const w = Math.max(50, maxX - minX + pad * 2);
    const h = Math.max(50, maxY - minY + pad * 2);

    return {
      r,
      surrounding,
      viewBox: `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    };
  }, [count]);

  // --------------------------------------------------------------------------
  // 2. SQUARE LAYOUT
  // --------------------------------------------------------------------------
  const squareData = useMemo(() => {
    if (count === 1) {
      return {
        cols: 1,
        mainRows: 1,
        centerSpan: 1,
        startCol: 0,
        startRow: 0,
        orphan: 0,
        cellSize: 42,
        viewBox: '-10 -10 62 62',
      };
    }

    let cols = 5;
    if (count <= 4) cols = 2;
    else if (count <= 9) cols = 3;
    else if (count <= 16) cols = 4;
    else if (count <= 35) cols = 5;
    else if (count <= 55) cols = 6;
    else if (count <= 75) cols = 7;
    else if (count <= 105) cols = 8;
    else cols = 9;

    const centerSpan = cols % 2 === 1 ? 3 : 2;
    const lost = centerSpan * centerSpan - 1;

    const mainRows = Math.max(centerSpan, Math.floor((count + lost) / cols));
    const capacity = mainRows * cols - lost;
    const orphan = Math.max(0, count - capacity);

    const topRows = Math.floor((mainRows - centerSpan) / 2);
    const startCol = Math.floor((cols - centerSpan) / 2);
    const startRow = topRows;

    const cellSize = 36;
    const totalW = cols * cellSize;
    const totalRows = mainRows + (orphan > 0 ? 1 : 0);
    const totalH = totalRows * cellSize;

    const pad = 10;
    const viewBox = `${-pad} ${-pad} ${totalW + pad * 2} ${totalH + pad * 2}`;

    return {
      cols,
      mainRows,
      centerSpan,
      startCol,
      startRow,
      orphan,
      cellSize,
      viewBox,
    };
  }, [count]);

  // --------------------------------------------------------------------------
  // 3. CHAIN LAYOUT
  // --------------------------------------------------------------------------
  const chainData = useMemo(() => {
    if (count === 1) {
      const r = 32;
      const hexW = r * Math.sqrt(3);
      const pad = 12;
      return {
        items: [{ x: 0, y: 0, r, isCenter: true, row: 0, col: 0 }],
        viewBox: `${(-hexW / 2 - pad).toFixed(1)} ${(-r - pad).toFixed(1)} ${(hexW + pad * 2).toFixed(1)} ${(r * 2 + pad * 2).toFixed(1)}`,
      };
    }

    let cols = 5;
    if (count <= 4) cols = 2;
    else if (count <= 9) cols = 3;
    else if (count <= 18) cols = 4;
    else if (count <= 35) cols = 5;
    else if (count <= 65) cols = 6;
    else if (count <= 100) cols = 7;
    else cols = 8;

    let r = 24;
    if (count > 90) r = 11.5;
    else if (count > 60) r = 14.0;
    else if (count > 35) r = 17.0;
    else if (count > 18) r = 20.0;
    else if (count > 9) r = 23.0;
    else r = 26.0;

    const hexW = r * Math.sqrt(3);
    const hexH = r * 1.5;

    const fullRows = Math.floor(count / cols);
    const orphan = count % cols;
    const totalRows = fullRows + (orphan > 0 ? 1 : 0);

    const centerRow = Math.floor((totalRows - 1) / 2);
    const centerCol = Math.floor((cols - 1) / 2);

    const coords: Array<{
      x: number;
      y: number;
      r: number;
      isCenter: boolean;
      row: number;
      col: number;
    }> = [];

    for (let rIdx = 0; rIdx < fullRows; rIdx++) {
      const isOdd = rIdx % 2 === 1;
      const shift = isOdd ? 0.5 * hexW : 0;
      for (let c = 0; c < cols; c++) {
        const x = c * hexW + shift;
        const y = rIdx * hexH;
        const isCenter = rIdx === centerRow && c === centerCol;
        coords.push({ x, y, r, isCenter, row: rIdx, col: c });
      }
    }

    if (orphan > 0) {
      const rIdx = fullRows;
      const isOdd = rIdx % 2 === 1;
      const shift = isOdd ? 0.5 * hexW : 0;
      const startCol = Math.floor((cols - orphan) / 2);
      for (let i = 0; i < orphan; i++) {
        const c = startCol + i;
        const x = c * hexW + shift;
        const y = rIdx * hexH;
        coords.push({ x, y, r, isCenter: false, row: rIdx, col: c });
      }
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    coords.forEach((p) => {
      minX = Math.min(minX, p.x - hexW / 2);
      maxX = Math.max(maxX, p.x + hexW / 2);
      minY = Math.min(minY, p.y - p.r);
      maxY = Math.max(maxY, p.y + p.r);
    });

    const pad = 12;
    const w = Math.max(40, maxX - minX + pad * 2);
    const h = Math.max(40, maxY - minY + pad * 2);

    return {
      items: coords,
      viewBox: `${(minX - pad).toFixed(1)} ${(minY - pad).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    };
  }, [count]);

  const cardClasses = isStandaloneCard
    ? 'w-full max-w-[360px] aspect-[1/1.42] bg-white border border-[#E8E2D8] rounded-2xl p-3 shadow-xs mx-auto flex flex-col justify-between select-none relative'
    : 'w-full max-w-[210px] aspect-[1/1.42] bg-white border border-[#E8E2D8] rounded-xl p-1.5 shadow-xs mx-auto flex flex-col justify-between select-none relative';

  // ==========================================================================
  // RENDER: HONEYCOMB
  // ==========================================================================
  if (shape === 'honeycomb') {
    const centerAvatarScale = (honeycombData.r * 2.5) / 46;
    const sqrt3 = Math.sqrt(3);

    const svgContent = (
      <svg
        id={svgId}
        viewBox={honeycombData.viewBox}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ECE6DC" />
            <stop offset="100%" stopColor="#DDD3C4" />
          </linearGradient>

          {/* Center Rosette Clip Path */}
          <clipPath id={`${uid}-center-rosette`}>
            <polygon points={getCenterRosettePoints(0, 0, honeycombData.r)} />
          </clipPath>

          {/* Surrounding Hexagons Clip Paths */}
          {honeycombData.surrounding.map((h, i) => (
            <clipPath key={`clip-${i}`} id={`${uid}-hex-${i}`}>
              <polygon points={getFlatTopHexPoints(h.x, h.y, h.r - 0.4)} />
            </clipPath>
          ))}
        </defs>

        {/* 1. Large Center "YOU" Rosette */}
        <polygon
          points={getCenterRosettePoints(0, 0, honeycombData.r)}
          fill="#F7F0E3"
          stroke="#FFFFFF"
          strokeWidth="3"
        />

        {centerPhoto ? (
          <image
            href={centerPhoto}
            x={-2.5 * honeycombData.r}
            y={-1.5 * sqrt3 * honeycombData.r}
            width={5 * honeycombData.r}
            height={3 * sqrt3 * honeycombData.r}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${uid}-center-rosette)`}
          />
        ) : (
          <g
            transform={`translate(${-20 * centerAvatarScale}, ${
              -23 * centerAvatarScale
            }) scale(${centerAvatarScale})`}
          >
            <circle cx="20" cy="13" r="8" fill="#8C7E6A" />
            <path d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z" fill="#8C7E6A" />
          </g>
        )}

        {/* Rosette Border Stroke */}
        <polygon
          points={getCenterRosettePoints(0, 0, honeycombData.r)}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.8"
        />

        {/* Center "YOU" Highlight Tag */}
        <g transform={`translate(0, ${honeycombData.r * 1.05})`}>
          <rect
            x="-18"
            y="-6"
            width="36"
            height="12"
            rx="6"
            fill="#D9531E"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <text
            x="0"
            y="2.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="6.5"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
          >
            YOU
          </text>
        </g>

        {/* 2. Surrounding Classmates (Remaining members) */}
        {honeycombData.surrounding.map((h, i) => {
          const avatarScale = (h.r * 1.5) / 46;
          const memberItem = surroundingMembers[i];
          const photo = memberItem?.photoUrl;

          return (
            <g key={i}>
              <polygon
                points={getFlatTopHexPoints(h.x, h.y, h.r)}
                fill={`url(#${uid}-grad)`}
                stroke="#FFFFFF"
                strokeWidth="1.8"
              />

              {photo ? (
                <image
                  href={photo}
                  x={h.x - h.r}
                  y={h.y - h.r}
                  width={h.r * 2}
                  height={h.r * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${uid}-hex-${i})`}
                />
              ) : (
                <g
                  transform={`translate(${h.x - 20 * avatarScale}, ${
                    h.y - 23 * avatarScale
                  }) scale(${avatarScale})`}
                >
                  <circle cx="20" cy="13" r="8" fill="#A89C8A" />
                  {i % 2 === 0 ? (
                    <path
                      d="M7 40 C7 28, 12 24, 20 24 C28 24, 33 28, 33 40 Z"
                      fill="#A89C8A"
                    />
                  ) : (
                    <path
                      d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z"
                      fill="#A89C8A"
                    />
                  )}
                </g>
              )}

              {/* White Hexagon Border */}
              <polygon
                points={getFlatTopHexPoints(h.x, h.y, h.r)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.6"
              />
            </g>
          );
        })}
      </svg>
    );

    if (!showCardFrame) return svgContent;

    return (
      <div className={cardClasses}>
        <div className="w-full h-full border border-[#EDE7DC] rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden bg-white">
          {svgContent}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: SQUARE
  // ==========================================================================
  if (shape === 'square') {
    const { cols, mainRows, centerSpan, startCol, startRow, orphan, cellSize, viewBox } = squareData;
    const cells: React.ReactNode[] = [];
    let centerRendered = false;
    let surroundingIdx = 0;

    for (let r = 0; r < mainRows; r++) {
      for (let c = 0; c < cols; c++) {
        const inCenter =
          count > 1 &&
          r >= startRow &&
          r < startRow + centerSpan &&
          c >= startCol &&
          c < startCol + centerSpan;

        if (inCenter) {
          if (!centerRendered && r === startRow && c === startCol) {
            centerRendered = true;
            const cx = c * cellSize;
            const cy = r * cellSize;
            const size = centerSpan * cellSize;
            const centerScale = (size * 0.44) / 46;
            const midX = cx + size / 2;
            const midY = cy + size / 2;

            cells.push(
              <g key="center-you">
                <defs>
                  <clipPath id={`${uid}-sq-center`}>
                    <rect x={cx} y={cy} width={size} height={size} rx="3" />
                  </clipPath>
                </defs>

                <rect
                  x={cx}
                  y={cy}
                  width={size}
                  height={size}
                  fill="#F7F0E3"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  rx="3"
                />

                {centerPhoto ? (
                  <image
                    href={centerPhoto}
                    x={cx}
                    y={cy}
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${uid}-sq-center)`}
                  />
                ) : (
                  <g
                    transform={`translate(${midX - 20 * centerScale}, ${
                      midY - 23 * centerScale
                    }) scale(${centerScale})`}
                  >
                    <circle cx="20" cy="13" r="8" fill="#8C7E6A" />
                    <path
                      d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z"
                      fill="#8C7E6A"
                    />
                  </g>
                )}

                <rect
                  x={cx}
                  y={cy}
                  width={size}
                  height={size}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  rx="3"
                />

                {/* "YOU" Badge */}
                <g transform={`translate(${midX}, ${cy + size - 8})`}>
                  <rect
                    x="-16"
                    y="-5"
                    width="32"
                    height="10"
                    rx="5"
                    fill="#D9531E"
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="5.5"
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                  >
                    YOU
                  </text>
                </g>
              </g>
            );
          }
        } else {
          const x = c * cellSize;
          const y = r * cellSize;
          const midX = x + cellSize / 2;
          const midY = y + cellSize / 2;
          const avatarScale = (cellSize * 0.52) / 46;
          const isFemale = (r + c) % 2 === 0;
          const memberItem = surroundingMembers[surroundingIdx++];
          const photo = memberItem?.photoUrl;
          const cellKey = `sq-${r}-${c}`;

          cells.push(
            <g key={cellKey}>
              <defs>
                <clipPath id={`${uid}-${cellKey}`}>
                  <rect x={x} y={y} width={cellSize} height={cellSize} rx="1.5" />
                </clipPath>
              </defs>

              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill="#F7F0E3"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                rx="1.5"
              />

              {photo ? (
                <image
                  href={photo}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${uid}-${cellKey})`}
                />
              ) : (
                <g
                  transform={`translate(${midX - 20 * avatarScale}, ${
                    midY - 23 * avatarScale
                  }) scale(${avatarScale})`}
                >
                  <circle cx="20" cy="13" r="8" fill="#A89C8A" />
                  {isFemale ? (
                    <path
                      d="M7 40 C7 28, 12 24, 20 24 C28 24, 33 28, 33 40 Z"
                      fill="#A89C8A"
                    />
                  ) : (
                    <path
                      d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z"
                      fill="#A89C8A"
                    />
                  )}
                </g>
              )}

              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                rx="1.5"
              />
            </g>
          );
        }
      }
    }

    // Centered orphan bottom row
    if (orphan > 0) {
      const orphanStartX = ((cols - orphan) * cellSize) / 2;
      const y = mainRows * cellSize;
      const midY = y + cellSize / 2;

      for (let i = 0; i < orphan; i++) {
        const x = orphanStartX + i * cellSize;
        const midX = x + cellSize / 2;
        const avatarScale = (cellSize * 0.52) / 46;
        const isFemale = i % 2 === 0;
        const memberItem = surroundingMembers[surroundingIdx++];
        const photo = memberItem?.photoUrl;
        const cellKey = `sq-orphan-${i}`;

        cells.push(
          <g key={cellKey}>
            <defs>
              <clipPath id={`${uid}-${cellKey}`}>
                <rect x={x} y={y} width={cellSize} height={cellSize} rx="1.5" />
              </clipPath>
            </defs>

            <rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill="#F7F0E3"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              rx="1.5"
            />

            {photo ? (
              <image
                href={photo}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${uid}-${cellKey})`}
              />
            ) : (
              <g
                transform={`translate(${midX - 20 * avatarScale}, ${
                  midY - 23 * avatarScale
                }) scale(${avatarScale})`}
              >
                <circle cx="20" cy="13" r="8" fill="#A89C8A" />
                {isFemale ? (
                  <path
                    d="M7 40 C7 28, 12 24, 20 24 C28 24, 33 28, 33 40 Z"
                    fill="#A89C8A"
                  />
                ) : (
                  <path
                    d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z"
                    fill="#A89C8A"
                  />
                )}
              </g>
            )}

            <rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              rx="1.5"
            />
          </g>
        );
      }
    }

    const svgContent = (
      <svg
        id={svgId}
        viewBox={viewBox}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {cells}
      </svg>
    );

    if (!showCardFrame) return svgContent;

    return (
      <div className={cardClasses}>
        <div className="w-full h-full border border-[#EDE7DC] rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden bg-white">
          {svgContent}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: CHAIN
  // ==========================================================================
  if (shape === 'chain') {
    let surroundingChainIdx = 0;

    const svgContent = (
      <svg
        id={svgId}
        viewBox={chainData.viewBox}
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uid}-chain-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ECE6DC" />
            <stop offset="100%" stopColor="#DDD3C4" />
          </linearGradient>

          {chainData.items.map((h, i) => (
            <clipPath key={`chain-clip-${i}`} id={`${uid}-chain-clip-${i}`}>
              <polygon points={getPointyHexPoints(h.x, h.y, h.r - 0.4)} />
            </clipPath>
          ))}
        </defs>

        {chainData.items.map((h, i) => {
          const avatarScale = (h.r * 1.5) / 46;
          const isFemale = (h.row + h.col) % 2 === 0;
          const isCenter = h.isCenter;
          const photo = isCenter ? centerPhoto : surroundingMembers[surroundingChainIdx++]?.photoUrl;

          return (
            <g key={i}>
              <polygon
                points={getPointyHexPoints(h.x, h.y, h.r)}
                fill={isCenter ? '#F7F0E3' : `url(#${uid}-chain-grad)`}
                stroke="#FFFFFF"
                strokeWidth={isCenter ? '2.8' : '2.0'}
              />

              {photo ? (
                <image
                  href={photo}
                  x={h.x - h.r}
                  y={h.y - h.r}
                  width={h.r * 2}
                  height={h.r * 2}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${uid}-chain-clip-${i})`}
                />
              ) : (
                <g
                  transform={`translate(${h.x - 20 * avatarScale}, ${
                    h.y - 23 * avatarScale
                  }) scale(${avatarScale})`}
                >
                  <circle
                    cx="20"
                    cy="13"
                    r="8"
                    fill={isCenter ? '#8C7E6A' : '#A89C8A'}
                  />
                  {isFemale ? (
                    <path
                      d="M7 40 C7 28, 12 24, 20 24 C28 24, 33 28, 33 40 Z"
                      fill={isCenter ? '#8C7E6A' : '#A89C8A'}
                    />
                  ) : (
                    <path
                      d="M6 41 C6 27, 11 24, 20 24 C29 24, 34 27, 34 41 Z"
                      fill={isCenter ? '#8C7E6A' : '#A89C8A'}
                    />
                  )}
                </g>
              )}

              {/* White Hex Border */}
              <polygon
                points={getPointyHexPoints(h.x, h.y, h.r)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={isCenter ? '2.6' : '1.8'}
              />

              {isCenter && (
                <g transform={`translate(${h.x}, ${h.y + h.r * 0.75})`}>
                  <rect
                    x="-14"
                    y="-4.5"
                    width="28"
                    height="9"
                    rx="4.5"
                    fill="#D9531E"
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="5"
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                  >
                    YOU
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );

    if (!showCardFrame) return svgContent;

    return (
      <div className={cardClasses}>
        <div className="w-full h-full border border-[#EDE7DC] rounded-xl p-2 flex flex-col items-center justify-center overflow-hidden bg-white">
          {svgContent}
        </div>
      </div>
    );
  }

  return null;
}
