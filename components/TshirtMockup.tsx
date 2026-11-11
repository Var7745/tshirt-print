'use client';

import React, { useState, useId } from 'react';
import CollagePattern, { CollageShapeType, MemberProofItem } from './CollagePattern';
import { SAMPLE_AVATARS } from '@/lib/store';
import { Download, Printer, Check } from 'lucide-react';
import { downloadSvgElementAsPng, downloadSvgElementAsSvg } from '@/lib/downloadPrint';

interface TshirtMockupProps {
  shape?: CollageShapeType;
  peopleCount?: number;
  jerseyName?: string;
  rollNumber?: string;
  collegeName?: string;
  courseSection?: string;
  graduatingYear?: number | string;
  userPhoto?: string;
  membersPhotos?: string[];
  viewMode?: 'both' | 'front' | 'back' | 'card';
  centerMember?: MemberProofItem;
  members?: MemberProofItem[];
  showDownloadControls?: boolean;
  tshirtNumber?: string;
  frontSvgId?: string;
  backSvgId?: string;
}

export default function TshirtMockup({
  shape = 'honeycomb',
  peopleCount = 20,
  jerseyName = 'NEHA',
  rollNumber = '21',
  collegeName = 'GOVT COLLEGE',
  courseSection = 'MSCS',
  graduatingYear = '2027',
  userPhoto,
  membersPhotos,
  viewMode = 'both',
  centerMember,
  members = [],
  showDownloadControls = false,
  tshirtNumber = 'JK-001',
  frontSvgId: customFrontSvgId,
  backSvgId: customBackSvgId,
}: TshirtMockupProps) {
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'card'>('front');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const frontSvgId = customFrontSvgId || `front-svg-${safeId}`;
  const backSvgId = customBackSvgId || `back-svg-${safeId}`;

  const displayJersey = (centerMember?.jerseyName || jerseyName || 'YOUR NAME').trim().toUpperCase();
  const displayRoll = (centerMember?.rollNumber || rollNumber || '00').trim();
  const displayCollege = (collegeName || 'JK EMPRESS').trim().toUpperCase();
  const displayCourse = (courseSection || 'BATCH 2027').trim().toUpperCase();

  const photos =
    membersPhotos && membersPhotos.length > 0
      ? membersPhotos
      : userPhoto
      ? [userPhoto, ...SAMPLE_AVATARS]
      : SAMPLE_AVATARS;

  const triggerFeedback = (label: string) => {
    setDownloadSuccess(label);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadFrontPng = () => {
    const el = (document.getElementById(frontSvgId) || document.querySelector(`svg[id*="${frontSvgId}"]`)) as SVGSVGElement | null;
    if (el) {
      downloadSvgElementAsPng(el, `${tshirtNumber}_Front_${displayJersey}`);
      triggerFeedback('Front PNG Downloaded');
    } else {
      console.error('Front SVG element not found in DOM');
      alert('Generating front print file... please try again in a moment.');
    }
  };

  const handleDownloadBackPng = () => {
    const el = (document.getElementById(backSvgId) || document.querySelector(`svg[id*="${backSvgId}"]`)) as SVGSVGElement | null;
    if (el) {
      downloadSvgElementAsPng(el, `${tshirtNumber}_Back_${displayJersey}`);
      triggerFeedback('Back PNG Downloaded');
    } else {
      console.error('Back SVG element not found in DOM');
      alert('Generating back print file... please try again in a moment.');
    }
  };

  const handleDownloadFrontSvg = () => {
    const el = (document.getElementById(frontSvgId) || document.querySelector(`svg[id*="${frontSvgId}"]`)) as SVGSVGElement | null;
    if (el) {
      downloadSvgElementAsSvg(el, `${tshirtNumber}_Front_${displayJersey}`);
      triggerFeedback('Front SVG Vector Downloaded');
    }
  };

  const handleDownloadBackSvg = () => {
    const el = (document.getElementById(backSvgId) || document.querySelector(`svg[id*="${backSvgId}"]`)) as SVGSVGElement | null;
    if (el) {
      downloadSvgElementAsSvg(el, `${tshirtNumber}_Back_${displayJersey}`);
      triggerFeedback('Back SVG Vector Downloaded');
    }
  };

  // Realistic Front T-Shirt Graphic (Garment + Centered Chest Collage Pattern)
  const frontTshirt = (
    <div className="relative w-full max-w-[280px] aspect-[1/1.18] mx-auto select-none transition-all duration-300">
      {/* Garment Base */}
      <svg
        viewBox="0 0 400 480"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`frontFabric_${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#F2ECE1" />
          </linearGradient>

          <linearGradient id={`collarRib_${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EDE6D8" />
            <stop offset="100%" stopColor="#FAF8F5" />
          </linearGradient>

          <filter id={`softShadow_${safeId}`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.06" />
          </filter>
        </defs>

        {/* Real T-shirt Outline */}
        <path
          d="
            M145 42
            C165 52, 235 52, 255 42
            L315 76
            C335 88, 360 105, 385 130
            L348 185
            C332 175, 318 165, 308 155
            L306 430
            C306 442, 294 448, 280 448
            L120 448
            C106 448, 94 442, 94 430
            L92 155
            C82 165, 68 175, 52 185
            L15 130
            C40 105, 65 88, 85 76
            Z
          "
          fill={`url(#frontFabric_${safeId})`}
          stroke="#DFD8CC"
          strokeWidth="2.5"
          filter={`url(#softShadow_${safeId})`}
        />

        {/* Sleeve seams */}
        <path
          d="M85 76 L112 168"
          stroke="#E3DCCE"
          strokeWidth="1.5"
          strokeDasharray="3,2"
        />
        <path
          d="M315 76 L288 168"
          stroke="#E3DCCE"
          strokeWidth="1.5"
          strokeDasharray="3,2"
        />

        {/* Underarm folds */}
        <path d="M92 155 Q80 180 52 185" stroke="#DDD4C5" strokeWidth="1.5" />
        <path d="M308 155 Q320 180 348 185" stroke="#DDD4C5" strokeWidth="1.5" />

        {/* Collar Back & Front */}
        <path
          d="M145 42 C170 32, 230 32, 255 42"
          stroke="#DDD5C7"
          strokeWidth="3.5"
          fill="#ECE5D8"
        />
        <path
          d="M145 42 C165 72, 235 72, 255 42"
          fill={`url(#collarRib_${safeId})`}
          stroke="#DDD5C7"
          strokeWidth="3.5"
        />

        {/* Bottom hemline stitch */}
        <path
          d="M96 438 L304 438"
          stroke="#E5DECF"
          strokeWidth="1.2"
          strokeDasharray="3,2"
        />
      </svg>

      {/* Chest Collage Artwork Area (Direct pure SVG overlay with zero foreignObject) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
        <div className="scale-[0.84] origin-center pointer-events-auto">
          <CollagePattern
            shape={shape}
            peopleCount={peopleCount}
            photos={photos}
            graduatingYear={graduatingYear}
            isStandaloneCard={false}
            centerMember={centerMember}
            members={members}
            svgId={frontSvgId}
            showCardFrame={false}
          />
        </div>
      </div>

      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-2">
        <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-stone-200 shadow-xs">
          Front · {centerMember?.name ? `${centerMember.name} (Center)` : 'You in Center'}
        </span>
      </div>
    </div>
  );

  // Realistic Back T-Shirt Graphic (Fully Pure Vector SVG for 300 DPI DTF Export)
  const backTshirt = (
    <div className="relative w-full max-w-[280px] aspect-[1/1.18] mx-auto select-none transition-all duration-300">
      <svg
        id={backSvgId}
        viewBox="0 0 400 480"
        className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`backFabric_${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#F2ECE1" />
          </linearGradient>
        </defs>

        {/* T-Shirt Silhouette */}
        <path
          d="
            M145 42
            C165 48, 235 48, 255 42
            L315 76
            C335 88, 360 105, 385 130
            L348 185
            C332 175, 318 165, 308 155
            L306 430
            C306 442, 294 448, 280 448
            L120 448
            C106 448, 94 442, 94 430
            L92 155
            C82 165, 68 175, 52 185
            L15 130
            C40 105, 65 88, 85 76
            Z
          "
          fill={`url(#backFabric_${safeId})`}
          stroke="#DFD8CC"
          strokeWidth="2.5"
        />

        {/* Back collar ridge */}
        <path
          d="M145 42 C170 54, 230 54, 255 42"
          stroke="#DDD5C7"
          strokeWidth="3.5"
          fill="#FAF8F5"
        />

        {/* Sleeve seams */}
        <path
          d="M85 76 L112 168"
          stroke="#E3DCCE"
          strokeWidth="1.5"
          strokeDasharray="3,2"
        />
        <path
          d="M315 76 L288 168"
          stroke="#E3DCCE"
          strokeWidth="1.5"
          strokeDasharray="3,2"
        />

        {/* BACK PRINT GRAPHIC (DTF Print Area) */}
        {/* 1. College Name */}
        <text
          x="200"
          y="155"
          textAnchor="middle"
          fill="#78716C"
          fontSize="9.5"
          fontWeight="800"
          letterSpacing="1.5"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {displayCollege.length > 28 ? displayCollege.substring(0, 28) + '...' : displayCollege}
        </text>

        {/* 2. Jersey Name (Bold Varsity) */}
        <text
          x="200"
          y="195"
          textAnchor="middle"
          fill="#1C1917"
          fontSize="26"
          fontWeight="900"
          letterSpacing="2.5"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {displayJersey.toUpperCase()}
        </text>

        {/* 3. Big Varsity Roll Number */}
        <text
          x="200"
          y="275"
          textAnchor="middle"
          fill="#1C1917"
          fontSize="72"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="'Times New Roman', Georgia, serif"
        >
          {displayRoll}
        </text>

        {/* 4. Course/Department Badge Box */}
        <rect
          x="120"
          y="298"
          width="160"
          height="22"
          rx="5"
          fill="#F5F5F4"
          stroke="#D6D3D1"
          strokeWidth="1.2"
        />
        <text
          x="200"
          y="313"
          textAnchor="middle"
          fill="#292524"
          fontSize="10"
          fontWeight="800"
          letterSpacing="1.2"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {displayCourse}
        </text>

        {/* 5. Class of Year */}
        <text
          x="200"
          y="342"
          textAnchor="middle"
          fill="#A8A29E"
          fontSize="9"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          CLASS OF {graduatingYear}
        </text>

        {/* 6. Signature watermark line */}
        <path
          d="M160 365 Q200 355 240 365"
          stroke="#D9531E"
          strokeWidth="1.2"
          strokeDasharray="2,2"
          fill="none"
        />
        <text
          x="200"
          y="378"
          textAnchor="middle"
          fill="#D9531E"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          SIGNATURE DAY EDITION
        </text>
      </svg>

      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-2">
        <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-stone-200 shadow-xs">
          Back · Details &amp; Jersey
        </span>
      </div>
    </div>
  );

  // High-Resolution Standalone Print Proof Card
  const standaloneCard = (
    <div className="w-full max-w-[340px] mx-auto select-none py-2">
      <CollagePattern
        shape={shape}
        peopleCount={peopleCount}
        photos={photos}
        graduatingYear={graduatingYear}
        isStandaloneCard={true}
        centerMember={centerMember}
        members={members}
      />
      <div className="text-center mt-2">
        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-stone-200 shadow-xs">
          Front Artwork Proof ({shape})
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4">
      {/* View Switcher Tabs (Front, Back, Card Proof) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-stone-200/80 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'front'
                ? 'bg-white shadow-xs text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            T-Shirt (Front)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('back')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'back'
                ? 'bg-white shadow-xs text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            T-Shirt (Back)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'card'
                ? 'bg-white shadow-xs text-stone-900'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Proof Card
          </button>
        </div>

        {/* Download Buttons */}
        {showDownloadControls && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleDownloadFrontPng}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              title="Download 300 DPI Front Print PNG"
            >
              <Download className="w-3 h-3" />
              <span>Front.png</span>
            </button>

            <button
              onClick={handleDownloadBackPng}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-stone-800 hover:bg-stone-900 text-white flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              title="Download 300 DPI Back Print PNG"
            >
              <Download className="w-3 h-3" />
              <span>Back.png</span>
            </button>

            <button
              onClick={activeTab === 'back' ? handleDownloadBackSvg : handleDownloadFrontSvg}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Download Vector SVG"
            >
              <Printer className="w-3 h-3 text-orange-500" />
              <span>SVG Vector</span>
            </button>

            {downloadSuccess && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>{downloadSuccess}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Display Pane: All SVGs stay mounted in DOM at all times! */}
      <div className="p-4 bg-gradient-to-b from-[#F5F2EB]/60 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-2xl border border-stone-200/80 dark:border-zinc-800 flex items-center justify-center min-h-[360px]">
        <div className={`w-full ${activeTab === 'front' ? 'block' : 'hidden'}`}>
          {frontTshirt}
        </div>
        <div className={`w-full ${activeTab === 'back' ? 'block' : 'hidden'}`}>
          {backTshirt}
        </div>
        <div className={`w-full ${activeTab === 'card' ? 'block' : 'hidden'}`}>
          {standaloneCard}
        </div>
      </div>
    </div>
  );
}
