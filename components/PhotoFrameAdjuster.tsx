'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  X, 
  RefreshCw, 
  Move,
  Crop,
  ShieldCheck
} from 'lucide-react';

export type FrameShape = 'circle' | 'square' | 'honeycomb';

interface PhotoFrameAdjusterProps {
  imageSrc: string;
  initialShape?: FrameShape;
  onSave: (adjustedDataUrl: string, blob: Blob) => void;
  onCancel: () => void;
}

export default function PhotoFrameAdjuster({
  imageSrc,
  initialShape = 'square',
  onSave,
  onCancel,
}: PhotoFrameAdjusterProps) {
  const [shape, setShape] = useState<FrameShape>(initialShape);
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Viewport display size in pixels
  const VIEWPORT_SIZE = 280;

  // Reset adjustments
  const handleReset = () => {
    setZoom(1.1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Zoom handlers
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(0.8, Math.min(3.5, newZoom)));
  };

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch Drag handlers (Mobile Support)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    handleZoomChange(zoom + delta);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Export high-resolution cropped canvas image (800x800 for 300 DPI print quality)
  const handleSaveCropped = () => {
    const img = imageRef.current;
    if (!img) return;

    setIsProcessing(true);

    try {
      const OUTPUT_SIZE = 800;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Smooth rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clean white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Coordinate transformation
      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Map offset from 280px display viewport to 800px export canvas
      const scaleMultiplier = OUTPUT_SIZE / VIEWPORT_SIZE;
      ctx.translate(offset.x * scaleMultiplier / zoom, offset.y * scaleMultiplier / zoom);

      // Maintain aspect ratio cover
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let drawW = OUTPUT_SIZE;
      let drawH = OUTPUT_SIZE;
      if (imgAspect > 1) {
        drawW = OUTPUT_SIZE * imgAspect;
      } else {
        drawH = OUTPUT_SIZE / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            onSave(dataUrl, blob);
          } else {
            // Fallback with Data URL
            fetch(dataUrl)
              .then((res) => res.blob())
              .then((b) => onSave(dataUrl, b));
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Photo crop export error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative flex flex-col items-center">
        
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-orange-100 text-[#D9531E]">
              <Crop className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-stone-900 leading-tight">
                Adjust Your Photo
              </h3>
              <p className="text-[11px] text-stone-500">
                Center your face inside the print frame
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Frame Shape Selector */}
        <div className="w-full flex items-center justify-center gap-1.5 mb-4 p-1 bg-stone-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setShape('circle')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              shape === 'circle'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-current"></span>
            Circle
          </button>
          <button
            type="button"
            onClick={() => setShape('square')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              shape === 'square'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="w-3 h-3 rounded-md border border-current"></span>
            Square
          </button>
          <button
            type="button"
            onClick={() => setShape('honeycomb')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              shape === 'honeycomb'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="text-[11px]">⬡</span>
            Hexagon
          </button>
        </div>

        {/* Interactive Cropper Viewport */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          className="relative bg-stone-900 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner border-2 border-stone-800 touch-none flex items-center justify-center"
        >
          {/* Underlying Transformed Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Upload to crop"
            onLoad={() => setImageLoaded(true)}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Mask Frame Overlays */}
          {shape === 'circle' && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                borderRadius: '50%',
                border: '2px solid rgba(217, 83, 30, 0.9)',
              }}
            />
          )}

          {shape === 'square' && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                borderRadius: '24px',
                border: '2px solid rgba(217, 83, 30, 0.9)',
              }}
            />
          )}

          {shape === 'honeycomb' && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 100 100"
            >
              <defs>
                <mask id="hex-mask">
                  <rect width="100" height="100" fill="white" />
                  <polygon 
                    points="50,4 92,27 92,73 50,96 8,73 8,27" 
                    fill="black" 
                  />
                </mask>
              </defs>
              <rect width="100" height="100" fill="rgba(0,0,0,0.65)" mask="url(#hex-mask)" />
              <polygon 
                points="50,4 92,27 92,73 50,96 8,73 8,27" 
                fill="none" 
                stroke="#D9531E" 
                strokeWidth="1.5" 
              />
            </svg>
          )}

          {/* Rule-of-Thirds Grid & Face Outline Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Subtle Face Guide Oval */}
            <div className="w-36 h-44 border border-dashed border-white/40 rounded-[50%] flex items-center justify-center">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full">
                Face Center
              </span>
            </div>
          </div>

          {/* Drag instruction overlay badge */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs text-white/90 text-[10px] px-2.5 py-1 rounded-full font-medium pointer-events-none flex items-center gap-1">
            <Move className="w-3 h-3" />
            Drag photo to reposition
          </div>
        </div>

        {/* Zoom Slider & Adjust Controls */}
        <div className="w-full mt-4 space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0.8"
              max="3.0"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#D9531E] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action Tools: Rotate & Reset */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold"
            >
              <RotateCw className="w-3.5 h-3.5 text-stone-500" />
              Rotate 90°
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              Reset Frame
            </button>
          </div>
        </div>

        {/* Bottom Save & Cancel Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCropped}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#D9531E] hover:bg-[#B84214] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-75"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                Apply & Save Frame
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
